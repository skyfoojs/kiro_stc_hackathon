-- Demo seed data. Safe to rerun (fixed IDs + on conflict do nothing).
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -1 -f supabase/seed.sql
--
-- DEMO ONLY: every account's password is test@123. Delete these accounts
-- (or change the passwords) before any real use.
-- Usernames map to emails as <username>@demo.uoa-evac.app (see src/lib/auth.ts).

-- ---------------------------------------------------------------------------
-- Tower and floors. Pilot: UOA Corporate Tower only (The Vertical, Bangsar South).
-- The other three towers can be added later as extra rows here.
-- ---------------------------------------------------------------------------

insert into public.towers (id, code, name, building_type, floors_above_ground, podium_floors, floor_height_m) values
  ('10000000-0000-4000-8000-000000000001', 'UCT', 'UOA Corporate Tower', 'corporate', 38, 0, 4.0)
on conflict (id) do nothing;

-- Level 0 is the ground floor (G), then L1 to L38. Podium levels (Business Suites) would be labelled P1-P5.
insert into public.floors (tower_id, level, label)
select t.id, l.level,
       case when l.level = 0 then 'G'
            when l.level <= t.podium_floors then 'P' || l.level
            else 'L' || l.level end
from public.towers t
cross join lateral generate_series(0, t.floors_above_ground + t.podium_floors) as l(level)
on conflict (tower_id, level) do nothing;

-- ---------------------------------------------------------------------------
-- Building points (UOA Corporate Tower)
-- ---------------------------------------------------------------------------

insert into public.building_points (tower_id, floor_id, kind, label, plan_x, plan_y, lat, lng, radius_m, qr_code)
select t.id, f.id, p.kind::public.point_kind, p.label, p.plan_x, p.plan_y, p.lat, p.lng, p.radius_m, p.qr_code
from public.towers t
cross join (values
  (22,   'stairwell',        'Stairwell A, L22',                0.150, 0.300, null::float8, null::float8, null::int, null),
  (22,   'stairwell',        'Stairwell B, L22',                0.850, 0.300, null, null, null, null),
  (22,   'waiting_point',    'Stairwell A waiting point, L22',  0.180, 0.350, null, null, null, null),
  (22,   'waiting_point',    'Stairwell B waiting point, L22',  0.820, 0.350, null, null, null, null),
  (22,   'bomba_lift_lobby', 'Bomba lift lobby, L22',           0.500, 0.500, null, null, null, null),
  (22,   'floor_qr',         'L22 lift lobby check-in',         0.500, 0.600, null, null, null, 'UCT-L22'),
  (15,   'stairwell',        'Stairwell A, L15',                0.150, 0.300, null, null, null, null),
  (15,   'stairwell',        'Stairwell B, L15',                0.850, 0.300, null, null, null, null),
  (15,   'waiting_point',    'Stairwell A waiting point, L15',  0.180, 0.350, null, null, null, null),
  (15,   'bomba_lift_lobby', 'Bomba lift lobby, L15',           0.500, 0.500, null, null, null, null),
  (15,   'floor_qr',         'L15 lift lobby check-in',         0.500, 0.600, null, null, null, 'UCT-L15'),
  (null, 'assembly_point',   'Assembly point A, Jalan Kerinchi (front plaza)', null, null, 3.1112, 101.6657, 75, 'UCT-ASSEMBLY-A')
) as p(level, kind, label, plan_x, plan_y, lat, lng, radius_m, qr_code)
left join public.floors f on f.tower_id = t.id and f.level = p.level
where t.code = 'UCT'
on conflict (tower_id, label) do nothing;

-- ---------------------------------------------------------------------------
-- Guidance (fixed, reviewed text). Never tells untrained staff to carry people.
-- ---------------------------------------------------------------------------

insert into public.guidance_templates (incident_type, action, audience, title, steps) values
  ('fire', 'evacuate', 'everyone', 'Fire: evacuate now', array[
    'Leave now by the nearest stairwell. Do not use the lifts.',
    'Keep to the left side of the stairs so responders can pass.',
    'Go to Assembly point A and check in on this app.',
    'Do not go back inside for belongings.']),
  ('fire', 'evacuate', 'needs_help', 'Fire: go to your waiting point', array[
    'Go to your nearest stairwell waiting point. Do not use the lifts.',
    'Tap I need help. Your assigned helper will see where you are.',
    'Stay at the waiting point so Bomba can find you.',
    'If you can safely walk down, follow the stairs to Assembly point A and check in.']),
  ('fire', 'evacuate', 'management', 'Fire: you are on duty', array[
    'Check your help alerts and respond: On my way or Can''t help.',
    'Go to people waiting at stairwell waiting points. Stay with them; do not carry anyone unless you are trained and have an evacuation chair.',
    'Use the dashboard to see who is still unaccounted for.',
    'Share the list with Bomba when they arrive.']),

  ('earthquake', 'evacuate', 'everyone', 'Earthquake: drop, cover, hold on', array[
    'While it shakes: drop, take cover under a desk, and hold on.',
    'When the shaking stops, leave by the stairs. Do not use the lifts.',
    'Watch for falling objects and broken glass.',
    'Go to Assembly point A and check in on this app.']),
  ('earthquake', 'evacuate', 'needs_help', 'Earthquake: stay covered, then wait', array[
    'While it shakes: take cover where you are and protect your head.',
    'When it stops, go to your nearest stairwell waiting point if it is safe.',
    'Tap I need help. Your assigned helper will see where you are.',
    'Stay at the waiting point so Bomba can find you.']),
  ('earthquake', 'evacuate', 'management', 'Earthquake: you are on duty', array[
    'Wait until the shaking stops before moving.',
    'Check your help alerts and respond.',
    'Check stairwells are clear before directing people into them.',
    'Use the dashboard to see who is still unaccounted for.']),

  ('power_outage', 'shelter_in_place', 'everyone', 'Power outage: stay where you are', array[
    'Stay on your floor unless management tells you to leave.',
    'Do not use the lifts.',
    'Use your phone torch if needed and keep the line clear for updates.',
    'Tap I''m safe so management knows you are accounted for.']),
  ('power_outage', 'shelter_in_place', 'needs_help', 'Power outage: stay where you are', array[
    'Stay where you are. You do not need to move.',
    'Do not use the lifts.',
    'Tap I need help if you need anything, or I''m safe if you are fine.']),
  ('power_outage', 'shelter_in_place', 'management', 'Power outage: you are on duty', array[
    'Check that people who need help are safe where they are.',
    'Watch the dashboard for help requests.',
    'Only start an evacuation if building security instructs it.']),

  ('security_threat', 'lockdown', 'everyone', 'Security threat: lock down', array[
    'Stay inside. Lock or block the door and stay away from windows.',
    'Silence your phone.',
    'Do not leave until management or police say it is safe.',
    'Tap I''m safe when you are secure.']),
  ('security_threat', 'lockdown', 'needs_help', 'Security threat: lock down', array[
    'Stay where you are and keep out of sight.',
    'Silence your phone.',
    'Tap I need help only if you are hurt or in danger.']),
  ('security_threat', 'lockdown', 'management', 'Security threat: you are on duty', array[
    'Do not move around the building unless police ask you to.',
    'Watch the dashboard for help requests and pass them to police.',
    'Keep alerts silent.'])
on conflict (incident_type, action, audience) do nothing;

-- ---------------------------------------------------------------------------
-- Companies (UOA Corporate Tower)
-- ---------------------------------------------------------------------------

insert into public.companies (id, name, tower_id) values
  ('20000000-0000-4000-8000-000000000001', 'UOA Group',                '10000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000002', 'Meridian Capital Berhad',  '10000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000003', 'Lumen Legal LLP',          '10000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000004', 'Kinabalu Tech Sdn Bhd',    '10000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Demo users (auth + profiles). Password for all: test@123
-- ---------------------------------------------------------------------------

create temporary table demo_users (
  id uuid, username text, full_name text, phone text, company_id uuid, level int, role public.user_role
);

insert into demo_users values
  ('30000000-0000-4000-8000-000000000001', 'management', 'UOA Security Control', '+60 3-2245 0001', '20000000-0000-4000-8000-000000000001',  0, 'management'),
  ('30000000-0000-4000-8000-000000000002', 'daniel',     'Daniel Tan',           '+60 12-555 0102', '20000000-0000-4000-8000-000000000002', 22, 'employee'),
  ('30000000-0000-4000-8000-000000000003', 'aisyah',     'Aisyah Rahman',        '+60 12-555 0103', '20000000-0000-4000-8000-000000000002', 22, 'employee'),
  ('30000000-0000-4000-8000-000000000004', 'lim',        'Lim Wei Jie',          '+60 12-555 0104', '20000000-0000-4000-8000-000000000004', 15, 'employee'),
  ('30000000-0000-4000-8000-000000000101', 'employee01', 'Nurul Izzah Kamal',    '+60 12-555 0201', '20000000-0000-4000-8000-000000000002', 22, 'employee'),
  ('30000000-0000-4000-8000-000000000102', 'employee02', 'Tan Wei Ming',         '+60 12-555 0202', '20000000-0000-4000-8000-000000000002', 22, 'employee'),
  ('30000000-0000-4000-8000-000000000103', 'employee03', 'Priya Ramasamy',       '+60 12-555 0203', '20000000-0000-4000-8000-000000000003', 22, 'employee'),
  ('30000000-0000-4000-8000-000000000104', 'employee04', 'Muhammad Hafiz Osman', '+60 12-555 0204', '20000000-0000-4000-8000-000000000003', 22, 'employee'),
  ('30000000-0000-4000-8000-000000000105', 'employee05', 'Chong Li Ying',        '+60 12-555 0205', '20000000-0000-4000-8000-000000000003', 22, 'employee'),
  ('30000000-0000-4000-8000-000000000106', 'employee06', 'Siti Aminah Yusof',    '+60 12-555 0206', '20000000-0000-4000-8000-000000000002', 22, 'employee'),
  ('30000000-0000-4000-8000-000000000107', 'employee07', 'Arjun Nair',           '+60 12-555 0207', '20000000-0000-4000-8000-000000000004', 22, 'employee'),
  ('30000000-0000-4000-8000-000000000108', 'employee08', 'Lee Jia Hui',          '+60 12-555 0208', '20000000-0000-4000-8000-000000000004', 22, 'employee'),
  ('30000000-0000-4000-8000-000000000109', 'employee09', 'Faizal Hakim Ismail',  '+60 12-555 0209', '20000000-0000-4000-8000-000000000003', 22, 'employee'),
  ('30000000-0000-4000-8000-000000000110', 'employee10', 'Wong Kar Mun',         '+60 12-555 0210', '20000000-0000-4000-8000-000000000002', 22, 'employee'),
  ('30000000-0000-4000-8000-000000000111', 'employee11', 'Kavitha Subramaniam',  '+60 12-555 0211', '20000000-0000-4000-8000-000000000004', 22, 'employee');

-- Email/password users, pre-confirmed so no email is sent. Token columns must be
-- '' rather than NULL or Supabase Auth fails to load the user.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000', d.id, 'authenticated', 'authenticated',
  d.username || '@demo.uoa-evac.app',
  extensions.crypt('test@123', extensions.gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  jsonb_build_object('username', d.username, 'full_name', d.full_name),
  now(), now(), '', '', '', ''
from demo_users d
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select
  d.id, d.id, d.id::text, 'email',
  jsonb_build_object('sub', d.id::text, 'email', d.username || '@demo.uoa-evac.app', 'email_verified', true),
  now(), now(), now()
from demo_users d
on conflict do nothing;

insert into public.profiles (id, username, full_name, phone, company_id, tower_id, floor_id, role)
select d.id, d.username, d.full_name, d.phone, d.company_id, f.tower_id, f.id, d.role
from demo_users d
join public.floors f on f.tower_id = '10000000-0000-4000-8000-000000000001' and f.level = d.level
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Assistance profiles and helper assignments
-- ---------------------------------------------------------------------------

insert into public.assistance_profiles
  (user_id, oku_status, oku_categories, stair_help, note, is_temporary, temporary_until, consent_at, consent_version)
values
  ('30000000-0000-4000-8000-000000000003', 'not_oku', '{}', 'yes',
   'Left leg in cast. Can walk short distances with crutches, not down 22 floors.',
   true, (current_date + interval '6 weeks')::date, now(), 'demo-v1'),
  ('30000000-0000-4000-8000-000000000004', 'registered', '{physical}', 'yes',
   'Uses a wheelchair. Needs an evacuation chair or the Bomba lift.',
   false, null, now(), 'demo-v1')
on conflict (user_id) do nothing;

insert into public.assistance_assignments (person_id, helper_id) values
  ('30000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001'),
  ('30000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000001')
on conflict (person_id, helper_id) do nothing;

drop table demo_users;
