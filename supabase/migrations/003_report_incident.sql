-- Migration 003: any signed-in person can report an emergency from the app.
-- Run after 002. Reported emergencies have no type: the reporter doesn't pick
-- one, and every report means "evacuate now".
--
-- Adds: report_incident(), get_active_incident(), request_help(),
-- untyped incidents and generic evacuation guidance.

-- ---------------------------------------------------------------------------
-- Untyped incidents ("Emergency" instead of "Fire")
-- ---------------------------------------------------------------------------

alter table public.incidents alter column type drop not null;
alter table public.incidents
  add column source text not null default 'management' check (source in ('management', 'occupant_report')),
  add column report_count int not null default 1 check (report_count >= 1);

-- Guidance for untyped incidents uses incident_type = null.
alter table public.guidance_templates alter column incident_type drop not null;
alter table public.guidance_templates
  drop constraint guidance_templates_incident_type_action_audience_key;
alter table public.guidance_templates
  add constraint guidance_templates_type_action_audience_key
  unique nulls not distinct (incident_type, action, audience);

-- One short detail line per step, shown under the step in the app.
alter table public.guidance_templates add column details text[];

insert into public.guidance_templates (incident_type, action, audience, title, steps, details) values
  (null, 'evacuate', 'everyone', 'Evacuate now',
   array['Leave by the nearest stairwell', 'Don''t use the lifts', 'Go to Assembly point A', 'Don''t go back inside'],
   array['Keep left so others can pass.', 'The Bomba lift is for firefighters.', 'Front plaza on Jalan Kerinchi. Check in when you arrive.', 'Leave your belongings behind.']),
  (null, 'evacuate', 'needs_help', 'Evacuate now',
   array['Go to the nearest stairwell waiting point', 'Tap I need help', 'Stay where you are', 'Don''t use the lifts'],
   array['It''s right by the stairwell door.', 'Your helpers see where you are waiting.', 'Rescue teams check waiting points first.', 'The Bomba lift is for firefighters.']),
  (null, 'evacuate', 'management', 'Evacuate now',
   array['Watch your help alerts', 'Go to people at waiting points', 'Then leave by the stairs'],
   array['Answer On my way or Can''t help.', 'Stay with them. Don''t carry anyone without training and a chair.', 'Check in at Assembly point A.'])
on conflict on constraint guidance_templates_type_action_audience_key do nothing;

-- ---------------------------------------------------------------------------
-- report_incident: "I saw an emergency"
-- ---------------------------------------------------------------------------

-- Starts a building-wide evacuation in the reporter's tower, or joins the one
-- already running. Returns { incident_id, created }.
create function public.report_incident() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_me public.profiles;
  v_floor public.floors;
  v_tower public.towers;
  v_id uuid;
begin
  select * into v_me from public.profiles where id = auth.uid() and employment_status = 'active';
  if not found then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  -- Someone already reported it: count the extra report and join.
  update public.incidents
  set report_count = report_count + 1
  where tower_id = v_me.tower_id and status = 'active'
  returning id into v_id;
  if v_id is not null then
    insert into public.incident_events (incident_id, actor_id, type, payload)
    values (v_id, auth.uid(), 'incident_reported_again', jsonb_build_object('floor_id', v_me.floor_id));
    return jsonb_build_object('incident_id', v_id, 'created', false);
  end if;

  select * into v_floor from public.floors where id = v_me.floor_id;
  select * into v_tower from public.towers where id = v_me.tower_id;

  insert into public.incidents (tower_id, origin_floor_id, type, action, title, triggered_by, source)
  values (v_me.tower_id, v_floor.id, null, 'evacuate',
          'Emergency reported on ' || v_floor.label || ', ' || v_tower.name,
          auth.uid(), 'occupant_report')
  returning id into v_id;

  -- Everyone currently in the tower goes on the roll call.
  insert into public.incident_occupants (incident_id, user_id, home_floor_id)
  select v_id, p.id, p.floor_id
  from public.profiles p
  where p.tower_id = v_me.tower_id and p.employment_status = 'active';

  return jsonb_build_object('incident_id', v_id, 'created', true);
exception
  -- Two people reported at the same moment: the other insert won, so join it.
  when unique_violation then
    select id into v_id from public.incidents where tower_id = v_me.tower_id and status = 'active';
    return jsonb_build_object('incident_id', v_id, 'created', false);
end;
$$;

-- ---------------------------------------------------------------------------
-- get_active_incident: everything the alert and evacuation screens need
-- ---------------------------------------------------------------------------

create function public.get_active_incident() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_me public.profiles;
  v_inc public.incidents;
  v_audience text;
  v_needs boolean;
  v_occ public.incident_occupants;
  v_guidance jsonb;
  v_help jsonb;
begin
  select * into v_me from public.profiles where id = auth.uid();
  if not found then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select * into v_inc from public.incidents
  where tower_id = v_me.tower_id and status = 'active'
  order by started_at desc limit 1;
  if not found then
    return null;
  end if;

  v_needs := exists (select 1 from public.assistance_profiles where user_id = v_me.id);
  v_audience := case when v_me.role = 'management' then 'management'
                     when v_needs then 'needs_help'
                     else 'everyone' end;

  -- Exact match first, then the untyped (generic) guidance.
  select jsonb_build_object('title', g.title, 'steps', g.steps, 'details', coalesce(g.details, '{}'))
  into v_guidance
  from public.guidance_templates g
  where g.action = v_inc.action and g.audience = v_audience
    and (g.incident_type = v_inc.type or g.incident_type is null)
  order by (g.incident_type is null) limit 1;

  select * into v_occ from public.incident_occupants where incident_id = v_inc.id and user_id = v_me.id;

  select jsonb_build_object('id', r.id, 'status', r.status, 'created_at', r.created_at,
                            'acknowledged_at', r.acknowledged_at, 'arrived_at', r.arrived_at)
  into v_help
  from public.help_requests r
  where r.incident_id = v_inc.id and r.requester_id = v_me.id
  order by r.created_at desc limit 1;

  return jsonb_build_object(
    'incident', jsonb_build_object(
      'id', v_inc.id,
      'type', v_inc.type,
      'action', v_inc.action,
      'title', v_inc.title,
      'source', v_inc.source,
      'started_at', v_inc.started_at,
      'report_count', v_inc.report_count,
      'floor_label', (select label from public.floors where id = v_inc.origin_floor_id),
      'floor_level', (select level from public.floors where id = v_inc.origin_floor_id),
      'tower_name', (select name from public.towers where id = v_inc.tower_id)
    ),
    'guidance', v_guidance,
    'me', jsonb_build_object(
      'state', coalesce(v_occ.state, 'unaccounted'),
      'needs_assistance', v_needs,
      'role', v_me.role
    ),
    'help_request', v_help,
    'assembly_point', (
      select jsonb_build_object('id', bp.id, 'label', bp.label)
      from public.building_points bp
      where bp.tower_id = v_inc.tower_id and bp.kind = 'assembly_point'
      order by bp.label limit 1
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- request_help: "I need help" (alerts assigned helpers + same-floor management)
-- Push delivery comes later from an Edge Function; the alerts already reach
-- open apps through Realtime.
-- ---------------------------------------------------------------------------

create function public.request_help(
  p_incident_id uuid,
  p_waiting_point_id uuid default null,
  p_note text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_inc public.incidents := public._active_incident(p_incident_id);
  v_floor_id uuid;
  v_id uuid;
  v_alerted int;
begin
  if p_note is not null and char_length(p_note) > 280 then
    raise exception 'Note is too long';
  end if;

  -- Already asked: return the open request instead of alerting twice.
  select id into v_id from public.help_requests
  where incident_id = v_inc.id and requester_id = auth.uid() and status in ('open', 'acknowledged');
  if v_id is not null then
    return v_id;
  end if;

  select coalesce(o.last_floor_id, o.home_floor_id) into v_floor_id
  from public.incident_occupants o where o.incident_id = v_inc.id and o.user_id = auth.uid();
  if v_floor_id is null then
    raise exception 'You are not on this incident''s roll call';
  end if;

  insert into public.help_requests (incident_id, requester_id, floor_id, waiting_point_id, note)
  values (v_inc.id, auth.uid(), v_floor_id, p_waiting_point_id, p_note)
  returning id into v_id;

  update public.incident_occupants
  set state = 'needs_help', last_seen_at = now()
  where incident_id = v_inc.id and user_id = auth.uid();

  insert into public.help_alerts (help_request_id, recipient_id, kind)
  select v_id, a.helper_id, 'assigned'
  from public.assistance_assignments a
  join public.profiles p on p.id = a.helper_id and p.employment_status = 'active'
  where a.person_id = auth.uid()
  on conflict do nothing;

  insert into public.help_alerts (help_request_id, recipient_id, kind)
  select v_id, p.id, 'same_floor'
  from public.profiles p
  where p.role = 'management' and p.employment_status = 'active'
    and p.tower_id = v_inc.tower_id and p.floor_id = v_floor_id and p.id <> auth.uid()
  on conflict do nothing;

  select count(*) into v_alerted from public.help_alerts where help_request_id = v_id;

  -- Nobody assigned or on the floor: go straight to all management (level 1).
  if v_alerted = 0 then
    update public.help_requests set escalation_level = 1 where id = v_id;
    insert into public.help_alerts (help_request_id, recipient_id, kind)
    select v_id, p.id, 'escalation'
    from public.profiles p
    where p.role = 'management' and p.employment_status = 'active'
      and p.tower_id = v_inc.tower_id and p.id <> auth.uid()
    on conflict do nothing;
  end if;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke execute on function public.report_incident() from public, anon;
revoke execute on function public.get_active_incident() from public, anon;
revoke execute on function public.request_help(uuid, uuid, text) from public, anon;
grant execute on function public.report_incident() to authenticated;
grant execute on function public.get_active_incident() to authenticated;
grant execute on function public.request_help(uuid, uuid, text) to authenticated;
