-- Migration 004: the reporter picks what they saw (fire or smoke, earthquake,
-- security threat), plus read-only helpers for the Relay prototype screens.
-- Run after 003. Every report still means "evacuate".

-- ---------------------------------------------------------------------------
-- report_incident(p_type)
-- ---------------------------------------------------------------------------

drop function public.report_incident();

create function public.report_incident(p_type public.incident_type default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_me public.profiles;
  v_floor public.floors;
  v_tower public.towers;
  v_id uuid;
  v_what text;
begin
  select * into v_me from public.profiles where id = auth.uid() and employment_status = 'active';
  if not found then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if p_type = 'power_outage' then
    raise exception 'Power outages are not reported from the app';
  end if;

  -- Someone already reported it: count the extra report and join.
  update public.incidents
  set report_count = report_count + 1
  where tower_id = v_me.tower_id and status = 'active'
  returning id into v_id;
  if v_id is not null then
    insert into public.incident_events (incident_id, actor_id, type, payload)
    values (v_id, auth.uid(), 'incident_reported_again',
            jsonb_build_object('floor_id', v_me.floor_id, 'type', p_type));
    return jsonb_build_object('incident_id', v_id, 'created', false);
  end if;

  select * into v_floor from public.floors where id = v_me.floor_id;
  select * into v_tower from public.towers where id = v_me.tower_id;
  v_what := case p_type
              when 'fire' then 'Fire or smoke'
              when 'earthquake' then 'Earthquake'
              when 'security_threat' then 'Security threat'
              else 'Emergency' end;

  insert into public.incidents (tower_id, origin_floor_id, type, action, title, triggered_by, source)
  values (v_me.tower_id, v_floor.id, p_type, 'evacuate',
          v_what || ' reported on ' || v_floor.label || ', ' || v_tower.name,
          auth.uid(), 'occupant_report')
  returning id into v_id;

  insert into public.incident_occupants (incident_id, user_id, home_floor_id)
  select v_id, p.id, p.floor_id
  from public.profiles p
  where p.tower_id = v_me.tower_id and p.employment_status = 'active';

  return jsonb_build_object('incident_id', v_id, 'created', true);
exception
  when unique_violation then
    select id into v_id from public.incidents where tower_id = v_me.tower_id and status = 'active';
    return jsonb_build_object('incident_id', v_id, 'created', false);
end;
$$;

-- ---------------------------------------------------------------------------
-- Guidance: short steps plus one detail line each. People who need help have
-- their request sent automatically, so their steps say "stay there".
-- ---------------------------------------------------------------------------

create temporary table _g (incident_type public.incident_type, audience text, title text, steps text[], details text[]);
insert into _g values
  ('fire', 'everyone', 'Evacuate now',
   array['Leave now by the nearest stairwell', 'Don''t use the lifts', 'Go to Assembly point A and check in', 'Don''t go back inside'],
   array['Stairwell A or B. Keep left so others can pass.', 'The Bomba lift is for firefighters only.', 'Front plaza on Jalan Kerinchi, outside the main entrance.', 'Leave your belongings behind.']),
  ('fire', 'needs_help', 'Go to your waiting point',
   array['Go to the Stairwell B waiting point', 'Stay there', 'Don''t use the lifts'],
   array['Your agreed spot, beside Stairwell B.', 'Your help request is sent. Rescuers will come to you.', 'The Bomba lift is for firefighters only.']),
  ('fire', 'management', 'You’re on duty',
   array['Watch your help alerts', 'Go to people at waiting points', 'Then leave by the stairs'],
   array['Answer On my way or Can''t help.', 'Stay with them. Don''t carry anyone without training and a chair.', 'Check in at Assembly point A.']),
  ('earthquake', 'everyone', 'Drop, cover, hold on',
   array['Drop, cover and hold on', 'When it stops, leave by the stairs', 'Don''t use the lifts', 'Go to Assembly point A and check in'],
   array['Get under a desk, away from windows.', 'Watch for falling objects. Aftershocks are likely.', 'The Bomba lift is for firefighters only.', 'Front plaza on Jalan Kerinchi.']),
  ('earthquake', 'needs_help', 'Take cover, then wait',
   array['Take cover where you are', 'When it stops, go to your waiting point', 'Stay there'],
   array['Protect your head and neck.', 'Stairwell B, if it is safe to get there.', 'Your help request is sent. Rescuers will come to you.']),
  ('earthquake', 'management', 'You’re on duty',
   array['Wait until the shaking stops', 'Watch your help alerts', 'Check stairwells are clear'],
   array['Then move.', 'Answer On my way or Can''t help.', 'Before you send people into them.']),
  (null, 'everyone', 'Evacuate now',
   array['Leave now by the nearest stairwell', 'Don''t use the lifts', 'Go to Assembly point A and check in', 'Don''t go back inside'],
   array['Stairwell A or B. Keep left so others can pass.', 'The Bomba lift is for firefighters only.', 'Front plaza on Jalan Kerinchi, outside the main entrance.', 'Leave your belongings behind.']),
  (null, 'needs_help', 'Go to your waiting point',
   array['Go to the Stairwell B waiting point', 'Stay there', 'Don''t use the lifts'],
   array['Your agreed spot, beside Stairwell B.', 'Your help request is sent. Rescuers will come to you.', 'The Bomba lift is for firefighters only.']);

insert into public.guidance_templates (incident_type, action, audience, title, steps, details)
select incident_type, 'evacuate', audience, title, steps, details from _g
on conflict on constraint guidance_templates_type_action_audience_key
do update set title = excluded.title, steps = excluded.steps, details = excluded.details;

drop table _g;

-- ---------------------------------------------------------------------------
-- get_active_incident: now also returns the assembly point position and the
-- caller's own floor.
-- ---------------------------------------------------------------------------

create or replace function public.get_active_incident() returns jsonb
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
      'role', v_me.role,
      'floor_level', (select level from public.floors where id = v_me.floor_id),
      'safe_at', v_occ.safe_at,
      'gps_verified', coalesce(v_occ.gps_verified, false)
    ),
    'help_request', v_help,
    'assembly_point', (
      select jsonb_build_object('id', bp.id, 'label', bp.label, 'lat', bp.lat, 'lng', bp.lng, 'radius_m', bp.radius_m)
      from public.building_points bp
      where bp.tower_id = v_inc.tower_id and bp.kind = 'assembly_point'
      order by bp.label limit 1
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- "You're safe" screen: who from your own company has checked in.
-- Names and here / not yet only. No health or help-request details.
-- ---------------------------------------------------------------------------

create function public.get_my_office_status(p_incident_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_me public.profiles;
begin
  select * into v_me from public.profiles where id = auth.uid();
  if not found then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if not exists (select 1 from public.incident_occupants where incident_id = p_incident_id and user_id = v_me.id) then
    raise exception 'You are not on this incident''s roll call';
  end if;

  return (
    select jsonb_build_object(
      'company', (select name from public.companies where id = v_me.company_id),
      'people', coalesce(jsonb_agg(jsonb_build_object('name', p.full_name, 'me', p.id = v_me.id, 'safe', o.state = 'safe')
                                   order by (p.id <> v_me.id), (o.state = 'safe'), p.full_name), '[]'::jsonb)
    )
    from public.incident_occupants o
    join public.profiles p on p.id = o.user_id
    where o.incident_id = p_incident_id and p.company_id = v_me.company_id
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- "All clear" screen: the caller's own timeline for the latest incident.
-- ---------------------------------------------------------------------------

create function public.get_my_incident_summary() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_me public.profiles;
  v_inc public.incidents;
  v_occ public.incident_occupants;
  v_help public.help_requests;
begin
  select * into v_me from public.profiles where id = auth.uid();
  if not found then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select * into v_inc from public.incidents where tower_id = v_me.tower_id order by started_at desc limit 1;
  if not found then
    return null;
  end if;

  select * into v_occ from public.incident_occupants where incident_id = v_inc.id and user_id = v_me.id;
  select * into v_help from public.help_requests
  where incident_id = v_inc.id and requester_id = v_me.id order by created_at desc limit 1;

  return jsonb_build_object(
    'id', v_inc.id,
    'type', v_inc.type,
    'status', v_inc.status,
    'started_at', v_inc.started_at,
    'resolved_at', v_inc.resolved_at,
    'floor_label', (select label from public.floors where id = v_inc.origin_floor_id),
    'tower_name', (select name from public.towers where id = v_inc.tower_id),
    'help', case when v_help.id is null then null else jsonb_build_object(
      'created_at', v_help.created_at, 'status', v_help.status,
      'acknowledged_at', v_help.acknowledged_at, 'arrived_at', v_help.arrived_at,
      'resolved_at', v_help.resolved_at, 'cancelled_at', v_help.cancelled_at) end,
    'safe_at', v_occ.safe_at,
    'safe_method', v_occ.safe_method,
    'assembly_point', (select label from public.building_points where id = v_occ.assembly_point_id)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke execute on function public.report_incident(public.incident_type) from public, anon;
revoke execute on function public.get_my_office_status(uuid) from public, anon;
revoke execute on function public.get_my_incident_summary() from public, anon;
grant execute on function public.report_incident(public.incident_type) to authenticated;
grant execute on function public.get_my_office_status(uuid) to authenticated;
grant execute on function public.get_my_incident_summary() to authenticated;
