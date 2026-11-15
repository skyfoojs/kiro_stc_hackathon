-- Office Disaster Recovery App: database schema.
-- Design notes: docs/DATABASE_AND_API.md
-- Run once on a fresh Supabase project, as a single transaction:
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -1 -f supabase/schema.sql

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('employee', 'management');
create type public.oku_status as enum ('registered', 'not_oku', 'prefer_not_to_say');
create type public.oku_category as enum ('physical', 'visual', 'hearing', 'speech', 'learning', 'mental', 'multiple');
create type public.stair_help as enum ('yes', 'sometimes', 'no');
create type public.employment_status as enum ('active', 'left');
create type public.point_kind as enum ('stairwell', 'bomba_lift_lobby', 'waiting_point', 'evac_chair', 'assembly_point', 'floor_qr');
create type public.incident_type as enum ('fire', 'earthquake', 'power_outage', 'security_threat');
create type public.incident_action as enum ('evacuate', 'shelter_in_place', 'lockdown');
create type public.incident_status as enum ('active', 'resolved');
create type public.occupant_state as enum ('unaccounted', 'needs_help', 'help_on_way', 'responding', 'safe');
create type public.safe_method as enum ('self_report', 'assembly_manual', 'assembly_gps', 'management_marked');
create type public.help_status as enum ('open', 'acknowledged', 'resolved', 'cancelled');
create type public.alert_kind as enum ('assigned', 'same_floor', 'escalation');
create type public.location_source as enum ('profile_floor', 'floor_qr', 'barometer', 'manual');

-- ---------------------------------------------------------------------------
-- Building (reference data)
-- ---------------------------------------------------------------------------

create table public.towers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  building_type text not null check (building_type in ('corporate', 'business_suites')),
  floors_above_ground int not null check (floors_above_ground > 0),
  podium_floors int not null default 0 check (podium_floors >= 0),
  floor_height_m numeric(4, 2) not null default 4.0 check (floor_height_m > 0),
  created_at timestamptz not null default now()
);

create table public.floors (
  id uuid primary key default gen_random_uuid(),
  tower_id uuid not null references public.towers (id) on delete cascade,
  level int not null,
  label text not null,
  plan_image_path text,
  unique (tower_id, level)
);

create table public.building_points (
  id uuid primary key default gen_random_uuid(),
  tower_id uuid not null references public.towers (id) on delete cascade,
  floor_id uuid references public.floors (id) on delete cascade,
  kind public.point_kind not null,
  label text not null,
  plan_x numeric(4, 3) check (plan_x between 0 and 1),
  plan_y numeric(4, 3) check (plan_y between 0 and 1),
  lat float8,
  lng float8,
  radius_m int check (radius_m > 0),
  qr_code text unique,
  created_at timestamptz not null default now(),
  unique (tower_id, label)
);

-- Fixed, reviewed guidance text. Never generated live, safe to cache offline.
create table public.guidance_templates (
  id uuid primary key default gen_random_uuid(),
  incident_type public.incident_type not null,
  action public.incident_action not null,
  audience text not null check (audience in ('everyone', 'needs_help', 'management')),
  title text not null,
  steps text[] not null,
  unique (incident_type, action, audience)
);

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tower_id uuid not null references public.towers (id) on delete cascade,
  unique (name, tower_id)
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username = lower(username) and username ~ '^[a-z0-9_.-]{3,32}$'),
  full_name text not null,
  phone text,
  avatar_url text,
  company_id uuid references public.companies (id) on delete set null,
  tower_id uuid not null references public.towers (id),
  floor_id uuid not null references public.floors (id),
  role public.user_role not null default 'employee',
  employment_status public.employment_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_tower_idx on public.profiles (tower_id);
create index profiles_floor_idx on public.profiles (floor_id);

-- Sensitive personal data (PDPA). A row exists only for employees who need assistance.
create table public.assistance_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  oku_status public.oku_status not null default 'not_oku',
  oku_categories public.oku_category[] not null default '{}',
  stair_help public.stair_help not null default 'no',
  note text check (char_length(note) <= 280),
  is_temporary boolean not null default false,
  temporary_until date,
  consent_at timestamptz not null,
  consent_version text not null,
  updated_at timestamptz not null default now(),
  constraint needs_assistance check (oku_status = 'registered' or stair_help in ('yes', 'sometimes'))
);

create table public.assistance_assignments (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.profiles (id) on delete cascade,
  helper_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (person_id, helper_id),
  check (person_id <> helper_id)
);
create index assistance_assignments_helper_idx on public.assistance_assignments (helper_id);

create table public.push_tokens (
  expo_token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);

-- ---------------------------------------------------------------------------
-- Incidents
-- ---------------------------------------------------------------------------

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  tower_id uuid not null references public.towers (id),
  origin_floor_id uuid references public.floors (id),
  type public.incident_type not null,
  action public.incident_action not null,
  title text not null,
  description text,
  status public.incident_status not null default 'active',
  triggered_by uuid references public.profiles (id) on delete set null,
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null
);
create unique index incidents_one_active_per_tower on public.incidents (tower_id) where status = 'active';

-- The live roll call: one row per person in the tower when the incident starts.
create table public.incident_occupants (
  incident_id uuid not null references public.incidents (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  home_floor_id uuid not null references public.floors (id),
  state public.occupant_state not null default 'unaccounted',
  last_floor_id uuid references public.floors (id),
  last_floor_source public.location_source not null default 'profile_floor',
  barometer_floor_estimate numeric(5, 2),
  last_seen_at timestamptz,
  safe_method public.safe_method,
  safe_at timestamptz,
  assembly_point_id uuid references public.building_points (id),
  gps_lat float8,
  gps_lng float8,
  gps_verified boolean not null default false,
  marked_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (incident_id, user_id)
);
create index incident_occupants_state_idx on public.incident_occupants (incident_id, state);

create table public.help_requests (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  floor_id uuid not null references public.floors (id),
  waiting_point_id uuid references public.building_points (id),
  barometer_floor_estimate numeric(5, 2),
  note text check (char_length(note) <= 280),
  status public.help_status not null default 'open',
  escalation_level int not null default 0 check (escalation_level between 0 and 2),
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz
);
create unique index help_requests_one_open_per_person
  on public.help_requests (incident_id, requester_id) where status in ('open', 'acknowledged');
create index help_requests_incident_idx on public.help_requests (incident_id, status);

create table public.help_alerts (
  id uuid primary key default gen_random_uuid(),
  help_request_id uuid not null references public.help_requests (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  kind public.alert_kind not null,
  sent_at timestamptz not null default now(),
  push_ticket_id text,
  responded_at timestamptz,
  response text check (response in ('on_my_way', 'cannot_help')),
  unique (help_request_id, recipient_id)
);
create index help_alerts_recipient_idx on public.help_alerts (recipient_id);

create table public.visitor_checkins (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  assembly_point_id uuid not null references public.building_points (id),
  full_name text not null check (char_length(full_name) between 1 and 120),
  phone text,
  visiting_company text,
  floor_level int,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Logs
-- ---------------------------------------------------------------------------

create table public.incident_events (
  id bigint generated always as identity primary key,
  incident_id uuid not null references public.incidents (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  subject_user_id uuid references public.profiles (id) on delete set null,
  type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index incident_events_incident_idx on public.incident_events (incident_id, created_at);

create table public.access_audit (
  id bigint generated always as identity primary key,
  viewer_id uuid references public.profiles (id) on delete set null,
  subject_user_ids uuid[] not null,
  incident_id uuid references public.incidents (id) on delete set null,
  context text not null check (context in ('helper_view', 'dashboard', 'bomba_report')),
  created_at timestamptz not null default now()
);

create table public.report_shares (
  token text primary key check (char_length(token) >= 32),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- ---------------------------------------------------------------------------
-- Helper functions (used by RLS). security definer avoids RLS recursion on profiles.
-- ---------------------------------------------------------------------------

create function public.is_management() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'management' and employment_status = 'active'
  );
$$;

create function public.my_tower_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select tower_id from public.profiles where id = auth.uid();
$$;

create function public.is_assigned_helper(p_person_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.assistance_assignments
    where person_id = p_person_id and helper_id = auth.uid()
  );
$$;

-- Moves a device's token to whoever is signed in on it now.
create function public.register_push_token(p_token text, p_platform text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if p_platform not in ('ios', 'android') then
    raise exception 'Invalid platform: %', p_platform;
  end if;
  insert into public.push_tokens (expo_token, user_id, platform, updated_at)
  values (p_token, auth.uid(), p_platform, now())
  on conflict (expo_token) do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger assistance_profiles_updated_at before update on public.assistance_profiles
  for each row execute function public.set_updated_at();
create trigger incident_occupants_updated_at before update on public.incident_occupants
  for each row execute function public.set_updated_at();

-- Employees can edit their own profile, but not their role, username, tower, company or status.
create function public.protect_profile_fields() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.is_management() then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.username is distinct from old.username
     or new.tower_id is distinct from old.tower_id
     or new.company_id is distinct from old.company_id
     or new.employment_status is distinct from old.employment_status then
    raise exception 'Only management can change role, username, tower, company or employment status';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_fields before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Incident timeline (FR14) is written automatically, however the change was made.
create function public.log_incident_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.incident_events (incident_id, actor_id, type, payload)
    values (new.id, coalesce(auth.uid(), new.triggered_by), 'incident_triggered',
            jsonb_build_object('type', new.type, 'action', new.action, 'title', new.title));
  elsif new.status is distinct from old.status and new.status = 'resolved' then
    insert into public.incident_events (incident_id, actor_id, type)
    values (new.id, coalesce(auth.uid(), new.resolved_by), 'incident_resolved');
  end if;
  return new;
end;
$$;

create trigger incidents_log after insert or update on public.incidents
  for each row execute function public.log_incident_change();

create function public.log_occupant_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.state is distinct from old.state then
    insert into public.incident_events (incident_id, actor_id, subject_user_id, type, payload)
    values (new.incident_id, auth.uid(), new.user_id, 'occupant_state_changed',
            jsonb_build_object('from', old.state, 'to', new.state, 'method', new.safe_method));
  end if;
  return new;
end;
$$;

create trigger incident_occupants_log after update on public.incident_occupants
  for each row execute function public.log_occupant_change();

create function public.log_help_request_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.incident_events (incident_id, actor_id, subject_user_id, type, payload)
    values (new.incident_id, auth.uid(), new.requester_id, 'help_requested',
            jsonb_build_object('help_request_id', new.id, 'floor_id', new.floor_id,
                               'waiting_point_id', new.waiting_point_id));
  elsif new.status is distinct from old.status or new.escalation_level is distinct from old.escalation_level then
    insert into public.incident_events (incident_id, actor_id, subject_user_id, type, payload)
    values (new.incident_id, auth.uid(), new.requester_id,
            case when new.escalation_level is distinct from old.escalation_level
                 then 'help_escalated' else 'help_status_changed' end,
            jsonb_build_object('help_request_id', new.id, 'status', new.status,
                               'escalation_level', new.escalation_level));
  end if;
  return new;
end;
$$;

create trigger help_requests_log after insert or update on public.help_requests
  for each row execute function public.log_help_request_change();

create function public.log_help_alert_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_incident_id uuid;
begin
  select incident_id into v_incident_id from public.help_requests where id = new.help_request_id;
  if tg_op = 'INSERT' then
    insert into public.incident_events (incident_id, actor_id, subject_user_id, type, payload)
    values (v_incident_id, auth.uid(), new.recipient_id, 'alert_sent',
            jsonb_build_object('help_request_id', new.help_request_id, 'kind', new.kind));
  elsif new.response is distinct from old.response then
    insert into public.incident_events (incident_id, actor_id, subject_user_id, type, payload)
    values (v_incident_id, new.recipient_id, new.recipient_id, 'alert_responded',
            jsonb_build_object('help_request_id', new.help_request_id, 'response', new.response));
  end if;
  return new;
end;
$$;

create trigger help_alerts_log after insert or update on public.help_alerts
  for each row execute function public.log_help_alert_change();

-- ---------------------------------------------------------------------------
-- Views (management only; they run as owner so they can count OKU rows,
-- and filter to management of the same tower themselves)
-- ---------------------------------------------------------------------------

create view public.incident_floor_summary as
select
  o.incident_id,
  i.tower_id,
  f.id as floor_id,
  f.level,
  f.label,
  count(*)::int as total,
  count(*) filter (where o.state = 'safe')::int as safe,
  count(*) filter (where o.state in ('needs_help', 'help_on_way'))::int as waiting_help,
  count(*) filter (where o.state = 'responding')::int as responding,
  count(*) filter (where o.state = 'unaccounted')::int as unaccounted,
  count(*) filter (where o.state <> 'safe' and a.oku_status = 'registered')::int as oku_inside,
  max(o.updated_at) as last_update
from public.incident_occupants o
join public.incidents i on i.id = o.incident_id
join public.floors f on f.id = coalesce(o.last_floor_id, o.home_floor_id)
left join public.assistance_profiles a on a.user_id = o.user_id
where public.is_management() and i.tower_id = public.my_tower_id()
group by o.incident_id, i.tower_id, f.id, f.level, f.label;

-- Employees who need assistance but have fewer than MIN_HELPERS (1 for the demo) helpers.
create view public.assignment_gaps as
select p.id as person_id, p.full_name, p.floor_id, count(aa.helper_id)::int as helper_count
from public.profiles p
join public.assistance_profiles a on a.user_id = p.id
left join public.assistance_assignments aa on aa.person_id = p.id
where public.is_management() and p.tower_id = public.my_tower_id() and p.employment_status = 'active'
group by p.id, p.full_name, p.floor_id
having count(aa.helper_id) < 1;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.towers enable row level security;
alter table public.floors enable row level security;
alter table public.building_points enable row level security;
alter table public.guidance_templates enable row level security;
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.assistance_profiles enable row level security;
alter table public.assistance_assignments enable row level security;
alter table public.push_tokens enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_occupants enable row level security;
alter table public.help_requests enable row level security;
alter table public.help_alerts enable row level security;
alter table public.visitor_checkins enable row level security;
alter table public.incident_events enable row level security;
alter table public.access_audit enable row level security;
alter table public.report_shares enable row level security;

-- Reference data: any signed-in user reads, management writes.
create policy "read towers" on public.towers for select to authenticated using (true);
create policy "manage towers" on public.towers for all to authenticated
  using (public.is_management()) with check (public.is_management());

create policy "read floors" on public.floors for select to authenticated using (true);
create policy "manage floors" on public.floors for all to authenticated
  using (public.is_management()) with check (public.is_management());

create policy "read points" on public.building_points for select to authenticated using (true);
create policy "manage points" on public.building_points for all to authenticated
  using (public.is_management()) with check (public.is_management());

create policy "read guidance" on public.guidance_templates for select to authenticated using (true);
create policy "manage guidance" on public.guidance_templates for all to authenticated
  using (public.is_management()) with check (public.is_management());

create policy "read companies" on public.companies for select to authenticated using (true);
create policy "manage companies" on public.companies for all to authenticated
  using (public.is_management()) with check (public.is_management());

-- Profiles: self; management sees everyone in its tower; employees see management
-- in their tower (to pick helpers) but not other employees.
create policy "read profiles" on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or (tower_id = public.my_tower_id() and (public.is_management() or role = 'management'))
  );
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "management updates profiles" on public.profiles for update to authenticated
  using (public.is_management() and tower_id = public.my_tower_id())
  with check (public.is_management());
create policy "management deletes leavers" on public.profiles for delete to authenticated
  using (public.is_management() and employment_status = 'left');

-- Assistance profiles: only the employee. Management reads them through audited
-- functions during an incident (added with the RPCs).
create policy "read own assistance" on public.assistance_profiles for select to authenticated
  using (user_id = auth.uid());
create policy "create own assistance" on public.assistance_profiles for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'employee')
  );
create policy "update own assistance" on public.assistance_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own assistance" on public.assistance_profiles for delete to authenticated
  using (user_id = auth.uid());

create policy "read assignments" on public.assistance_assignments for select to authenticated
  using (person_id = auth.uid() or helper_id = auth.uid() or public.is_management());
create policy "management manages assignments" on public.assistance_assignments for all to authenticated
  using (public.is_management()) with check (public.is_management());

create policy "own push tokens" on public.push_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "read tower incidents" on public.incidents for select to authenticated
  using (tower_id = public.my_tower_id());
create policy "management creates incidents" on public.incidents for insert to authenticated
  with check (public.is_management() and tower_id = public.my_tower_id());
create policy "management updates incidents" on public.incidents for update to authenticated
  using (public.is_management() and tower_id = public.my_tower_id())
  with check (public.is_management());

create policy "read occupants" on public.incident_occupants for select to authenticated
  using (user_id = auth.uid() or public.is_management());
create policy "management manages occupants" on public.incident_occupants for all to authenticated
  using (public.is_management()) with check (public.is_management());

create policy "read help requests" on public.help_requests for select to authenticated
  using (requester_id = auth.uid() or public.is_management());
create policy "management manages help requests" on public.help_requests for all to authenticated
  using (public.is_management()) with check (public.is_management());

create policy "read help alerts" on public.help_alerts for select to authenticated
  using (recipient_id = auth.uid() or public.is_management());
create policy "recipient responds to alert" on public.help_alerts for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy "management manages alerts" on public.help_alerts for all to authenticated
  using (public.is_management()) with check (public.is_management());

create policy "management reads visitors" on public.visitor_checkins for select to authenticated
  using (public.is_management());

create policy "management reads events" on public.incident_events for select to authenticated
  using (public.is_management());

create policy "management reads audit" on public.access_audit for select to authenticated
  using (public.is_management());

create policy "management manages shares" on public.report_shares for all to authenticated
  using (public.is_management()) with check (public.is_management());

-- ---------------------------------------------------------------------------
-- Grants. RLS decides rows; signed-out (anon) users get nothing.
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke all on all tables in schema public from anon;

revoke execute on function public.is_management() from public, anon;
revoke execute on function public.my_tower_id() from public, anon;
revoke execute on function public.is_assigned_helper(uuid) from public, anon;
revoke execute on function public.register_push_token(text, text) from public, anon;
grant execute on function public.is_management() to authenticated;
grant execute on function public.my_tower_id() to authenticated;
grant execute on function public.is_assigned_helper(uuid) to authenticated;
grant execute on function public.register_push_token(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime (RLS still applies to what each client receives)
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table
  public.incidents,
  public.incident_occupants,
  public.help_requests,
  public.help_alerts;
