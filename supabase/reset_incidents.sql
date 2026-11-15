-- Reset all incident data for a fresh demo run.
-- Run in the Supabase SQL Editor whenever you want to start over. It is not a
-- migration: it changes no tables and can be run any number of times.
--
-- Deletes: every incident, its roll call, help requests, help alerts, visitor
-- check-ins, timeline events, Bomba share links, and the access log entries made
-- during incidents.
-- Keeps: towers, floors, map points, guidance, companies, people, assistance
-- profiles, helper assignments, push tokens and demo mode.

begin;

-- Access log rows keep their incident link as null on delete, so remove them first.
delete from public.access_audit where incident_id is not null;

-- Everything else hangs off incidents and is removed by "on delete cascade":
-- incident_occupants, help_requests -> help_alerts, visitor_checkins,
-- incident_events, report_shares.
delete from public.incidents;

commit;

-- Should be all zeros.
select
  (select count(*) from public.incidents) as incidents,
  (select count(*) from public.incident_occupants) as roll_call,
  (select count(*) from public.help_requests) as help_requests,
  (select count(*) from public.help_alerts) as help_alerts,
  (select count(*) from public.incident_events) as timeline_events;
