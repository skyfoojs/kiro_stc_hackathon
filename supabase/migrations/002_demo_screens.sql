-- Migration 002: what the demo screens in MINIMUM_PAGES.md need.
-- Run after supabase/schema.sql (and seed.sql). Safe to run once; it fails
-- cleanly (nothing applied) if run twice.
--
-- Adds: help request arrival/undo columns, "shared with Bomba" columns,
-- two read policies, a demo-mode flag, and the RPCs from docs/DATABASE_AND_API.md 6.2.
-- Every RPC is security definer with its own checks, because employees have no
-- direct write access to roll-call or help tables.

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.help_requests
  add column arrived_at timestamptz,
  add column cancelled_at timestamptz;

alter table public.incidents
  add column bomba_shared_at timestamptz,
  add column bomba_shared_by uuid references public.profiles (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Demo-mode flag (demo_* functions refuse to run unless it is true)
-- ---------------------------------------------------------------------------

create table public.app_config (
  key text primary key,
  value jsonb not null
);
alter table public.app_config enable row level security;
create policy "read config" on public.app_config for select to authenticated using (true);
grant select on public.app_config to authenticated;
revoke all on public.app_config from anon;

insert into public.app_config (key, value) values ('demo_mode', 'true');

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

-- Help status screen: the requester sees who was alerted and who acknowledged.
create policy "requester reads own alerts" on public.help_alerts for select to authenticated
  using (exists (
    select 1 from public.help_requests r
    where r.id = help_request_id and r.requester_id = auth.uid()
  ));

-- "Your profile": employees see who viewed their assistance details.
create policy "subject reads own audit" on public.access_audit for select to authenticated
  using (auth.uid() = any (subject_user_ids));

-- ---------------------------------------------------------------------------
-- Internal helpers (not callable by clients)
-- ---------------------------------------------------------------------------

create function public._require_management() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_management() then
    raise exception 'Management only' using errcode = '42501';
  end if;
end;
$$;

create function public._require_demo_mode() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce((select value = 'true'::jsonb from public.app_config where key = 'demo_mode'), false) is not true then
    raise exception 'Demo mode is off' using errcode = '42501';
  end if;
end;
$$;

-- Returns the incident if it is active and in the caller's tower.
create function public._active_incident(p_incident_id uuid) returns public.incidents
language plpgsql stable security definer set search_path = '' as $$
declare
  v public.incidents;
begin
  select * into v from public.incidents
  where id = p_incident_id and status = 'active' and tower_id = public.my_tower_id();
  if not found then
    raise exception 'No active incident % in your tower', p_incident_id using errcode = 'P0002';
  end if;
  return v;
end;
$$;

-- Great-circle distance in metres (no PostGIS needed).
create function public._distance_m(lat1 float8, lng1 float8, lat2 float8, lng2 float8) returns float8
language sql immutable set search_path = '' as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- ---------------------------------------------------------------------------
-- Employee RPCs
-- ---------------------------------------------------------------------------

-- FR4. MIN_HELPERS is 1 for the demo (one management account); the brief asks for 2.
create function public.set_my_helpers(p_helper_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare
  c_min_helpers constant int := 1;
  v_ids uuid[] := array(select distinct unnest(coalesce(p_helper_ids, '{}')));
  v_valid int;
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if cardinality(v_ids) < c_min_helpers then
    raise exception 'Pick at least % helper(s)', c_min_helpers;
  end if;
  select count(*) into v_valid from public.profiles
  where id = any (v_ids) and role = 'management' and employment_status = 'active'
    and tower_id = public.my_tower_id();
  if v_valid <> cardinality(v_ids) then
    raise exception 'Helpers must be active management in your tower';
  end if;
  delete from public.assistance_assignments where person_id = auth.uid();
  insert into public.assistance_assignments (person_id, helper_id)
  select auth.uid(), unnest(v_ids);
end;
$$;

-- FR8. Called when the barometer floor estimate changes, or every 30 s.
create function public.report_location(
  p_incident_id uuid,
  p_floor_level int,
  p_source public.location_source,
  p_barometer_estimate numeric default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_incident public.incidents := public._active_incident(p_incident_id);
  v_floor_id uuid;
begin
  select id into v_floor_id from public.floors where tower_id = v_incident.tower_id and level = p_floor_level;
  if v_floor_id is null then
    raise exception 'Floor % does not exist in this tower', p_floor_level;
  end if;
  update public.incident_occupants
  set last_floor_id = v_floor_id, last_floor_source = p_source,
      barometer_floor_estimate = p_barometer_estimate, last_seen_at = now()
  where incident_id = p_incident_id and user_id = auth.uid();
end;
$$;

-- FR8 + FR10. "I'm safe" or assembly-point check-in. Returns whether GPS confirmed it.
create function public.mark_safe(
  p_incident_id uuid,
  p_method public.safe_method,
  p_assembly_point_id uuid default null,
  p_lat float8 default null,
  p_lng float8 default null,
  p_client_ts timestamptz default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_incident public.incidents := public._active_incident(p_incident_id);
  v_point public.building_points;
  v_method public.safe_method := p_method;
  v_verified boolean := false;
  v_safe_at timestamptz;
begin
  if p_method = 'management_marked' then
    raise exception 'Use management_mark for that';
  end if;
  if p_method in ('assembly_manual', 'assembly_gps') then
    select * into v_point from public.building_points
    where id = p_assembly_point_id and kind = 'assembly_point' and tower_id = v_incident.tower_id;
    if not found then
      raise exception 'Unknown assembly point';
    end if;
    if p_lat is not null and p_lng is not null and v_point.lat is not null and v_point.radius_m is not null then
      v_verified := public._distance_m(p_lat, p_lng, v_point.lat, v_point.lng) <= v_point.radius_m;
    end if;
    -- GPS is optional: an unconfirmed GPS check-in still counts, as a manual one.
    v_method := case when v_verified then 'assembly_gps'::public.safe_method else 'assembly_manual'::public.safe_method end;
  end if;

  -- Queued offline check-ins keep their real time, clamped to the incident window.
  v_safe_at := greatest(v_incident.started_at, least(coalesce(p_client_ts, now()), now()));

  update public.incident_occupants
  set state = 'safe', safe_method = v_method, safe_at = v_safe_at,
      assembly_point_id = v_point.id, gps_lat = p_lat, gps_lng = p_lng,
      gps_verified = v_verified, last_seen_at = now()
  where incident_id = p_incident_id and user_id = auth.uid();
  if not found then
    raise exception 'You are not on this incident''s roll call';
  end if;

  -- They got out, so any open help request is done.
  update public.help_requests
  set status = 'resolved', resolved_at = now()
  where incident_id = p_incident_id and requester_id = auth.uid() and status in ('open', 'acknowledged');

  return jsonb_build_object('method', v_method, 'gps_verified', v_verified, 'safe_at', v_safe_at);
end;
$$;

-- Undo bar on "Help sent".
create function public.cancel_help(p_help_request_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_req public.help_requests;
begin
  update public.help_requests
  set status = 'cancelled', cancelled_at = now()
  where id = p_help_request_id and requester_id = auth.uid() and status in ('open', 'acknowledged')
  returning * into v_req;
  if not found then
    raise exception 'No open help request to cancel';
  end if;

  update public.incident_occupants
  set state = 'unaccounted'
  where incident_id = v_req.incident_id and user_id = auth.uid() and state in ('needs_help', 'help_on_way');

  -- Helpers who were on their way are no longer responding to anyone.
  update public.incident_occupants o
  set state = 'unaccounted'
  where o.incident_id = v_req.incident_id and o.state = 'responding'
    and o.user_id in (
      select recipient_id from public.help_alerts
      where help_request_id = v_req.id and response = 'on_my_way'
    );
end;
$$;

-- Help status screen: the caller's latest request and each helper's response.
create function public.get_my_help_status(p_incident_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_req public.help_requests;
  v_waiting text;
begin
  select * into v_req from public.help_requests
  where incident_id = p_incident_id and requester_id = auth.uid()
  order by created_at desc limit 1;
  if not found then
    return null;
  end if;
  select label into v_waiting from public.building_points where id = v_req.waiting_point_id;

  return jsonb_build_object(
    'help_request_id', v_req.id,
    'status', v_req.status,
    'created_at', v_req.created_at,
    'acknowledged_at', v_req.acknowledged_at,
    'arrived_at', v_req.arrived_at,
    'waiting_point', v_waiting,
    'helpers', coalesce((
      select jsonb_agg(jsonb_build_object(
               'name', p.full_name, 'kind', a.kind, 'sent_at', a.sent_at,
               'response', a.response, 'responded_at', a.responded_at)
             order by a.sent_at)
      from public.help_alerts a
      join public.profiles p on p.id = a.recipient_id
      where a.help_request_id = v_req.id
    ), '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Management RPCs
-- ---------------------------------------------------------------------------

-- FR9. "On my way" or "Can't help".
create function public.respond_to_help(p_help_request_id uuid, p_response text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_req public.help_requests;
begin
  perform public._require_management();
  if p_response not in ('on_my_way', 'cannot_help') then
    raise exception 'Response must be on_my_way or cannot_help';
  end if;

  select r.* into v_req from public.help_requests r
  join public.incidents i on i.id = r.incident_id
  where r.id = p_help_request_id and i.status = 'active' and i.tower_id = public.my_tower_id()
    and r.status in ('open', 'acknowledged');
  if not found then
    raise exception 'Help request is not open';
  end if;

  -- Management may answer even if they were not alerted directly.
  insert into public.help_alerts (help_request_id, recipient_id, kind, response, responded_at)
  values (v_req.id, auth.uid(), 'escalation', p_response, now())
  on conflict (help_request_id, recipient_id)
  do update set response = excluded.response, responded_at = excluded.responded_at;

  if p_response = 'on_my_way' then
    update public.help_requests
    set status = 'acknowledged',
        acknowledged_at = coalesce(acknowledged_at, now()),
        acknowledged_by = coalesce(acknowledged_by, auth.uid())
    where id = v_req.id;

    update public.incident_occupants
    set state = 'help_on_way'
    where incident_id = v_req.incident_id and user_id = v_req.requester_id and state = 'needs_help';

    update public.incident_occupants
    set state = 'responding', last_seen_at = now()
    where incident_id = v_req.incident_id and user_id = auth.uid() and state <> 'safe';
  end if;
end;
$$;

-- "I'm with her" on the Assistant "on the way" screen.
create function public.mark_arrived(p_help_request_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_req public.help_requests;
begin
  perform public._require_management();
  update public.help_requests r
  set arrived_at = coalesce(r.arrived_at, now())
  from public.incidents i
  where r.id = p_help_request_id and i.id = r.incident_id and i.tower_id = public.my_tower_id()
    and r.status = 'acknowledged'
  returning r.* into v_req;
  if not found then
    raise exception 'Tap On my way first';
  end if;
  insert into public.incident_events (incident_id, actor_id, subject_user_id, type, payload)
  values (v_req.incident_id, auth.uid(), v_req.requester_id, 'helper_arrived',
          jsonb_build_object('help_request_id', v_req.id));
end;
$$;

-- Both reached safety, or the person was handed over to Bomba.
create function public.resolve_help(p_help_request_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public._require_management();
  update public.help_requests r
  set status = 'resolved', resolved_at = now()
  from public.incidents i
  where r.id = p_help_request_id and i.id = r.incident_id and i.tower_id = public.my_tower_id()
    and r.status in ('open', 'acknowledged');
  if not found then
    raise exception 'Help request is not open';
  end if;
end;
$$;

-- FR11. Floor sweep: mark someone safe, waiting, or back to unaccounted.
create function public.management_mark(p_incident_id uuid, p_user_id uuid, p_state public.occupant_state) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_incident public.incidents;
begin
  perform public._require_management();
  v_incident := public._active_incident(p_incident_id);
  if p_state not in ('safe', 'needs_help', 'unaccounted') then
    raise exception 'State must be safe, needs_help or unaccounted';
  end if;
  update public.incident_occupants
  set state = p_state,
      safe_method = case when p_state = 'safe' then 'management_marked'::public.safe_method end,
      safe_at = case when p_state = 'safe' then now() end,
      marked_by = auth.uid(),
      last_seen_at = now()
  where incident_id = v_incident.id and user_id = p_user_id;
  if not found then
    raise exception 'That person is not on this incident''s roll call';
  end if;
end;
$$;

-- Audited read of one person's assistance details (drawer, assistant screen).
create function public.get_person_needs(p_person_id uuid, p_incident_id uuid)
returns table (
  oku_status public.oku_status,
  oku_categories public.oku_category[],
  stair_help public.stair_help,
  note text,
  is_temporary boolean,
  temporary_until date
)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
begin
  perform public._require_management();
  perform public._active_incident(p_incident_id);
  insert into public.access_audit (viewer_id, subject_user_ids, incident_id, context)
  values (auth.uid(), array[p_person_id], p_incident_id,
          case when public.is_assigned_helper(p_person_id) then 'helper_view' else 'dashboard' end);
  return query
    select a.oku_status, a.oku_categories, a.stair_help, a.note, a.is_temporary, a.temporary_until
    from public.assistance_profiles a
    join public.profiles p on p.id = a.user_id
    where a.user_id = p_person_id and p.tower_id = public.my_tower_id();
end;
$$;

-- FR11 + FR12. Everyone not yet safe, with stated needs. One audit row per call.
-- Works on resolved incidents too, so the Bomba report can be produced afterwards.
create function public.get_incident_roll(p_incident_id uuid, p_floor_id uuid default null)
returns table (
  user_id uuid,
  full_name text,
  phone text,
  company text,
  role public.user_role,
  state public.occupant_state,
  floor_level int,
  floor_label text,
  last_floor_source public.location_source,
  barometer_floor_estimate numeric,
  last_seen_at timestamptz,
  help_request_id uuid,
  help_status public.help_status,
  waiting_point text,
  oku_status public.oku_status,
  oku_categories public.oku_category[],
  stair_help public.stair_help,
  note text,
  is_temporary boolean
)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
begin
  perform public._require_management();
  if not exists (select 1 from public.incidents where id = p_incident_id and tower_id = public.my_tower_id()) then
    raise exception 'Unknown incident';
  end if;

  return query
  with roll as (
    select
      o.user_id, p.full_name, p.phone, c.name as company, p.role, o.state,
      f.level as floor_level, f.label as floor_label, o.last_floor_source,
      o.barometer_floor_estimate, o.last_seen_at,
      h.id as help_request_id, h.status as help_status, wp.label as waiting_point,
      a.oku_status, a.oku_categories, a.stair_help, a.note, a.is_temporary
    from public.incident_occupants o
    join public.profiles p on p.id = o.user_id
    left join public.companies c on c.id = p.company_id
    join public.floors f on f.id = coalesce(o.last_floor_id, o.home_floor_id)
    left join public.assistance_profiles a on a.user_id = o.user_id
    left join lateral (
      select r.id, r.status, r.waiting_point_id from public.help_requests r
      where r.incident_id = o.incident_id and r.requester_id = o.user_id
      order by r.created_at desc limit 1
    ) h on true
    left join public.building_points wp on wp.id = h.waiting_point_id
    where o.incident_id = p_incident_id
      and o.state <> 'safe'
      and (p_floor_id is null or f.id = p_floor_id)
  ), logged as (
    insert into public.access_audit (viewer_id, subject_user_ids, incident_id, context)
    select auth.uid(),
           coalesce(array_agg(roll.user_id) filter (where roll.stair_help is not null), '{}'),
           p_incident_id, 'dashboard'
    from roll
  )
  select * from roll order by roll.floor_level desc, roll.full_name;
end;
$$;

-- Share with Bomba: "Mark as shared".
create function public.mark_bomba_shared(p_incident_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public._require_management();
  update public.incidents
  set bomba_shared_at = now(), bomba_shared_by = auth.uid()
  where id = p_incident_id and tower_id = public.my_tower_id();
  if not found then
    raise exception 'Unknown incident';
  end if;
  insert into public.incident_events (incident_id, actor_id, type)
  values (p_incident_id, auth.uid(), 'report_shared');
end;
$$;

create function public.resolve_incident(p_incident_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public._require_management();
  update public.incidents
  set status = 'resolved', resolved_at = now(), resolved_by = auth.uid()
  where id = p_incident_id and status = 'active' and tower_id = public.my_tower_id();
  if not found then
    raise exception 'No active incident to resolve';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Demo controls (demo mode only)
-- ---------------------------------------------------------------------------

-- Marks ONE more of employee01-employee08 safe at the tower's assembly point and
-- returns how many are left. The console calls it every ~700 ms until it returns 0,
-- so the dashboard tiles animate (one call = one Realtime update).
create function public.demo_simulate_evacuation(p_incident_id uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_incident public.incidents;
  v_user uuid;
  v_point uuid;
  v_left int;
begin
  perform public._require_management();
  perform public._require_demo_mode();
  v_incident := public._active_incident(p_incident_id);

  select id into v_point from public.building_points
  where tower_id = v_incident.tower_id and kind = 'assembly_point' order by label limit 1;

  select o.user_id into v_user
  from public.incident_occupants o
  join public.profiles p on p.id = o.user_id
  where o.incident_id = p_incident_id and o.state <> 'safe' and p.username ~ '^employee0[1-8]$'
  order by p.username limit 1;

  if v_user is not null then
    update public.incident_occupants
    set state = 'safe', safe_method = 'assembly_manual', safe_at = now(),
        assembly_point_id = v_point, last_seen_at = now()
    where incident_id = p_incident_id and user_id = v_user;
  end if;

  select count(*) into v_left
  from public.incident_occupants o
  join public.profiles p on p.id = o.user_id
  where o.incident_id = p_incident_id and o.state <> 'safe' and p.username ~ '^employee0[1-8]$';
  return v_left;
end;
$$;

-- Deletes every incident in the caller's tower (roll calls, help requests and
-- timelines cascade) so the demo can be run again from scratch.
create function public.demo_reset() returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_count int;
begin
  perform public._require_management();
  perform public._require_demo_mode();
  delete from public.incidents where tower_id = public.my_tower_id();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants: signed-in users only; internal helpers not callable at all.
-- ---------------------------------------------------------------------------

do $$
declare
  f text;
begin
  foreach f in array array[
    'public._require_management()',
    'public._require_demo_mode()',
    'public._active_incident(uuid)',
    'public._distance_m(float8, float8, float8, float8)'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
  end loop;

  foreach f in array array[
    'public.set_my_helpers(uuid[])',
    'public.report_location(uuid, int, public.location_source, numeric)',
    'public.mark_safe(uuid, public.safe_method, uuid, float8, float8, timestamptz)',
    'public.cancel_help(uuid)',
    'public.get_my_help_status(uuid)',
    'public.respond_to_help(uuid, text)',
    'public.mark_arrived(uuid)',
    'public.resolve_help(uuid)',
    'public.management_mark(uuid, uuid, public.occupant_state)',
    'public.get_person_needs(uuid, uuid)',
    'public.get_incident_roll(uuid, uuid)',
    'public.mark_bomba_shared(uuid)',
    'public.resolve_incident(uuid)',
    'public.demo_simulate_evacuation(uuid)',
    'public.demo_reset()'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end;
$$;
