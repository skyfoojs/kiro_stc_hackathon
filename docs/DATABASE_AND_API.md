# Database and API plan

Source: `PROJECT_BRIEF.md`. Stack: Expo app + Supabase (Postgres, Auth, Realtime, Edge Functions). There is no separate backend server.

The plan is sized for the hackathon. Everything the demo flow needs is marked **MVP**. Everything else is marked **Later**, and the schema already leaves room for it.

---

## 1. How the pieces talk

| Need | Mechanism | Why |
|---|---|---|
| Simple reads/writes (profile, map, guidance) | `supabase-js` straight to tables, protected by RLS | No code to write or host |
| Actions that change several rows or need validation (mark safe, acknowledge help) | Postgres functions called with `supabase.rpc()` | Atomic, runs next to the data, RLS-aware |
| Actions that send push notifications or need the service-role key | Supabase Edge Functions | Push needs a server call to the Expo Push API; keys stay server-side |
| Live dashboard, live alerts in the app | Supabase Realtime (`postgres_changes`) | Instant updates; also a fallback when push is slow |
| Scheduled escalation | `pg_cron` + `pg_net` calling an Edge Function every 30 s | No server needed |

Push is the primary alert channel. Realtime is the in-app fallback: if the app is open, the user sees the alert even when push is late or fails. This matters for the demo, because push needs a development build and working credentials.

---

## 2. User types

There are only two roles.

| Role | Who | What they do in the app |
|---|---|---|
| `employee` | Staff of tenant companies. **The targeted users.** Includes OKU staff and anyone who may need help on stairs | Set their OKU status and assistance needs, get guidance, tap "I need help" or "I'm safe", check in at the assembly point |
| `management` | Everyone who helps OKU employees evacuate: UOA management and security, floor wardens, trained assistants | Get assigned to OKU employees, receive and answer help alerts, trigger and resolve incidents, see the live dashboard, mark people safe during a sweep, share the Bomba report |

Visitors and guests have no account and no role. They use the guest check-in (FR13, Later).

**Login.** Users sign in with a **username and password**. Supabase Auth only supports email (or phone) logins, so the app turns the username into an email behind the scenes: `management` → `management@demo.uoa-evac.app`. The domain is one constant, `DEMO_EMAIL_DOMAIN`, in `src/lib/auth.ts`. The seed creates the accounts already confirmed, so no email is ever sent and the domain doesn't need to exist.

**Demo accounts all use the password `test@123`.** There is exactly **one management account**, with username `management`. The login screen also has one-tap buttons that fill in the username and password, so nobody types under pressure. A shared, published password is only acceptable for demo accounts with fake data. Delete these accounts (or change the passwords) before any real use.

**OKU status** is part of each employee's assistance profile (section 4.2). An employee needs assistance if they are OKU **or** answered `yes` / `sometimes` to the stair question. The stair question stays so temporary cases count too, such as the leg injury in the demo, even though those people aren't OKU.

---

## 3. Enums

| Enum | Values |
|---|---|
| `user_role` | `employee`, `management` |
| `oku_status` | `registered`, `not_oku`, `prefer_not_to_say` |
| `oku_category` | `physical`, `visual`, `hearing`, `speech`, `learning`, `mental`, `multiple` (the JKM card categories) |
| `stair_help` | `yes`, `sometimes`, `no` |
| `employment_status` | `active`, `left` |
| `point_kind` | `stairwell`, `bomba_lift_lobby`, `waiting_point`, `evac_chair`, `assembly_point`, `floor_qr` |
| `incident_type` | `fire`, `earthquake`, `power_outage`, `security_threat` |
| `incident_action` | `evacuate`, `shelter_in_place`, `lockdown` |
| `incident_status` | `active`, `resolved` |
| `occupant_state` | `unaccounted`, `needs_help`, `help_on_way`, `responding`, `safe` |
| `safe_method` | `self_report`, `assembly_manual`, `assembly_gps`, `management_marked` |
| `help_status` | `open`, `acknowledged`, `resolved`, `cancelled` |
| `alert_kind` | `assigned`, `same_floor`, `escalation` |
| `location_source` | `profile_floor`, `floor_qr`, `barometer`, `manual` |

`responding` is for management users who accepted a help request and are still inside on purpose. It keeps them out of "unaccounted", which would mislead fire command. The brief's demo numbers (1 waiting, 9 safe, 3 unaccounted) stay the same, and responders get their own count.

---

## 4. Tables

All tables have RLS enabled. `id` is `uuid default gen_random_uuid()` unless stated otherwise. Timestamps are `timestamptz default now()`.

### 4.1 Building (reference data, readable by any signed-in user, cached offline)

**`towers`** (MVP)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| code | text unique | `UCT`, `VCTB`, `BSA`, `BSB` |
| name | text | "UOA Corporate Tower" |
| building_type | text | `corporate` or `business_suites` |
| floors_above_ground | int | 38, 40, 35, 32 |
| podium_floors | int | 0 or 5 |
| floor_height_m | numeric | Used for the barometer floor estimate. Default 4.0 |

**`floors`** (MVP)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tower_id | uuid FK towers | |
| level | int | Unique with tower_id |
| label | text | "L22", "P3" |
| plan_image_path | text null | Supabase Storage path (Later) |

**`building_points`** (FR5; MVP for waiting points and assembly points, Later for the full map)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tower_id | uuid FK | |
| floor_id | uuid FK null | Null for outdoor points |
| kind | point_kind | |
| label | text | "Stairwell B waiting point, L22" |
| plan_x, plan_y | numeric null | 0 to 1, position on the floor plan image |
| lat, lng | float8 null | Assembly points only |
| radius_m | int null | GPS check-in radius for assembly points |
| qr_code | text unique null | Printed QR for floor check-in or guest check-in |

**`guidance_templates`** (FR7, MVP)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| incident_type | incident_type | |
| action | incident_action | |
| audience | text | `everyone` or `needs_help` |
| title | text | |
| steps | text[] | Short imperative steps |

Reviewed, fixed text. Nothing is generated live, so it is safe to cache offline. Steps must never tell untrained staff to carry people or move against the evacuation flow (NFR Safety). Examples:
- Fire / evacuate / everyone: "Use the nearest stairwell. Do not use lifts. Go to the assembly point and check in."
- Fire / evacuate / needs_help: "Go to your waiting point at Stairwell B. Tap I need help. Your assigned helpers have been told where you are."
- Management users get the `everyone` steps plus a line pointing them to their alerts and the dashboard.
- Security / lockdown: steps tell users to stay put and silence their phone. That push is sent silent (vibrate only).

### 4.2 People

**`companies`** (MVP)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| tower_id | uuid FK | |

**`profiles`** (FR1, FR3, MVP). One row per `auth.users` row.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK = auth.users.id | |
| username | text unique | Lowercase, used to log in (`management`, `aisyah`) |
| full_name | text | |
| phone | text null | Needed for the Bomba list and the later SMS fallback |
| avatar_url | text null | |
| company_id | uuid FK | |
| tower_id | uuid FK | |
| floor_id | uuid FK | Home floor |
| role | user_role | `employee` or `management`. Users can't change this themselves (enforced by a trigger) |
| employment_status | employment_status | Default `active` |
| created_at, updated_at | timestamptz | |

**`assistance_profiles`** (FR2, MVP). Holds each employee's OKU status and assistance needs. This is sensitive personal data under PDPA, so it lives in its own table and access can be locked down separately.
| Column | Type | Notes |
|---|---|---|
| user_id | uuid PK FK profiles | Employees only |
| oku_status | oku_status | Self-declared. No OKU card number or proof is collected |
| oku_categories | oku_category[] | Optional. Changes how help is given: `hearing` → vibration and flashing alerts, `visual` → helper guides by voice, `physical` → flagged for Bomba as likely needing a carry-down or the Bomba lift |
| stair_help | stair_help | "Would you need help on stairs in an emergency?" |
| note | text null | Max 280 chars, optional ("Uses a wheelchair", "Left leg in cast") |
| is_temporary | bool | Injury, pregnancy, etc. |
| temporary_until | date null | Prompt to review after this date |
| consent_at | timestamptz not null | Explicit consent; the row can't exist without it |
| consent_version | text | Which privacy notice they agreed to |
| updated_at | timestamptz | |

A row exists only for employees who are OKU (`registered`) or answered `yes` / `sometimes` to the stair question. Anyone else answering "not OKU" and "no" has their row deleted, so no health-related data is stored for them.

Derived flag used everywhere: **needs assistance** = `oku_status = 'registered' or stair_help in ('yes', 'sometimes')`. The dashboard shows an "OKU" badge separately from "needs help on stairs", so responders know which it is.

**`assistance_assignments`** (FR4, MVP)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| person_id | uuid FK profiles | Employee who needs assistance |
| helper_id | uuid FK profiles | Must have role `management`, in the same tower |
| created_at | timestamptz | |
| | | Unique (person_id, helper_id) |

`set_my_helpers()` checks that each employee who needs assistance has at least `MIN_HELPERS` management helpers. The brief asks for two; the demo sets `MIN_HELPERS = 1` because there is only one management account. It's one constant in the function, so raising it to 2 later is a one-line change. Management users whose home floor is the employee's floor are also alerted automatically (they replace the "floor warden" from the brief), so they don't need assigning. A view, `assignment_gaps`, lists employees who need assistance but have fewer than `MIN_HELPERS` helpers (Later).

**`push_tokens`** (MVP)
| Column | Type | Notes |
|---|---|---|
| expo_token | text PK | Unique per device. Upsert on login, so a shared demo phone moves to the last signed-in user |
| user_id | uuid FK profiles | |
| platform | text | `ios` or `android` |
| updated_at | timestamptz | |

### 4.3 Incidents

**`incidents`** (FR6, MVP)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tower_id | uuid FK | |
| origin_floor_id | uuid FK null | "Level 22" |
| type | incident_type | |
| action | incident_action | Defaults from type; management can override |
| title | text | "Fire on Level 22, UOA Corporate Tower" |
| status | incident_status | |
| triggered_by | uuid FK profiles | |
| started_at, resolved_at | timestamptz | |
| resolved_by | uuid FK null | |
| bomba_shared_at | timestamptz null | Set by "Mark as shared" on the Share with Bomba screen. **Migration 002** |
| bomba_shared_by | uuid FK null | **Migration 002** |
| | | Partial unique index: one `active` incident per tower |

**`incident_occupants`** (FR8, FR10, FR11, MVP). The live roll call. When an incident starts, it gets one row for every active profile in the tower.
| Column | Type | Notes |
|---|---|---|
| incident_id | uuid FK | PK with user_id |
| user_id | uuid FK | |
| home_floor_id | uuid FK | Copied from the profile at trigger time |
| state | occupant_state | Default `unaccounted` |
| last_floor_id | uuid FK null | Last known floor |
| last_floor_source | location_source | |
| barometer_floor_estimate | numeric null | e.g. 21.6, shown as "about L22" |
| last_seen_at | timestamptz | |
| safe_method | safe_method null | |
| safe_at | timestamptz null | |
| assembly_point_id | uuid FK null | |
| gps_lat, gps_lng | float8 null | Only sent outdoors at check-in |
| gps_verified | bool | Inside the assembly point radius |
| marked_by | uuid FK null | Management user who marked them |

**`help_requests`** (FR8, FR9, MVP)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| incident_id | uuid FK | |
| requester_id | uuid FK | |
| floor_id | uuid FK | |
| waiting_point_id | uuid FK null | Where they are waiting |
| barometer_floor_estimate | numeric null | |
| note | text null | "Left leg in cast, near Stairwell B" |
| status | help_status | |
| escalation_level | int | 0 = assigned helpers + same-floor management, 1 = all management in the tower, 2 = critical on the dashboard |
| created_at, acknowledged_at, resolved_at | timestamptz | |
| acknowledged_by | uuid FK null | Management user who tapped "On my way" |
| arrived_at | timestamptz null | Helper reached the person ("Assistant on the way" screen → "I'm with her"). **Migration 002** |
| cancelled_at | timestamptz null | Set by the Undo bar. **Migration 002** |
| | | Partial unique: one open request per requester per incident |

**`help_alerts`** (FR9, MVP). One row per person alerted. This is how escalation knows who was alerted and whether anyone responded.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| help_request_id | uuid FK | |
| recipient_id | uuid FK | |
| kind | alert_kind | |
| sent_at | timestamptz | |
| push_ticket_id | text null | From the Expo Push API, for debugging |
| responded_at | timestamptz null | |
| response | text null | `on_my_way` or `cannot_help` |

**`visitor_checkins`** (FR13, Later)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| incident_id | uuid FK | |
| assembly_point_id | uuid FK | From the scanned QR |
| full_name | text | |
| phone | text null | |
| visiting_company | text null | |
| floor_level | int null | Where they were |
| created_at | timestamptz | |

### 4.4 Logs

**`incident_events`** (FR14, MVP). Append-only timeline, written only by functions and triggers.
| Column | Type | Notes |
|---|---|---|
| id | bigint identity PK | |
| incident_id | uuid FK | |
| actor_id | uuid FK null | Null for system events |
| subject_user_id | uuid FK null | |
| type | text | `incident_triggered`, `guidance_sent`, `help_requested`, `alert_sent`, `alert_acknowledged`, `escalated`, `location_updated`, `marked_safe`, `visitor_checked_in`, `report_shared`, `incident_resolved` |
| payload | jsonb | |
| created_at | timestamptz | |

**`access_audit`** (NFR Access control, MVP). Records every view of someone's assistance details.
| Column | Type | Notes |
|---|---|---|
| id | bigint identity PK | |
| viewer_id | uuid FK null | Null when viewed through a Bomba share link |
| subject_user_ids | uuid[] | Everyone whose details appeared in that view |
| incident_id | uuid FK null | |
| context | text | `helper_view`, `dashboard`, `bomba_report` |
| created_at | timestamptz | |

**`report_shares`** (FR12, Later; MVP uses the share sheet, see 6.3)
| Column | Type | Notes |
|---|---|---|
| token | text PK | Random, 32+ chars |
| incident_id | uuid FK | |
| created_by | uuid FK | |
| expires_at | timestamptz | Incident end + 24 h |

### 4.5 Views

- **`incident_floor_summary`** (MVP). Runs as the view owner so it can count OKU rows, and filters itself to management of the same tower (employees get no rows). Columns: incident_id, tower_id, floor_id, level, total, safe, waiting_help (`needs_help` + `help_on_way`), responding, unaccounted, oku_inside (OKU employees not yet safe), last_update. This view drives the dashboard tiles.
- **`assignment_gaps`** (Later): employees who need assistance but have fewer than `MIN_HELPERS` management helpers. Same owner-plus-filter approach.

---

## 5. Access rules (RLS)

Helper functions (`security definer`, `stable`): `is_management()`, `my_tower_id()`, `is_assigned_helper(person_id)`, `active_incident_for(tower_id)`.

| Table | Read | Write |
|---|---|---|
| towers, floors, building_points, guidance_templates, companies | Any signed-in user | Management |
| profiles | Self; anyone in the same tower sees name, floor, role (needed to pick helpers); management sees all in their tower | Self (limited columns); management |
| assistance_profiles | **Self only.** Management sees it only through `get_person_needs()` / `get_incident_roll()` during an active incident; both check access and write to `access_audit` | Self (employees only) |
| assistance_assignments | The employee; their assigned helpers (name only); management | Through `set_my_helpers()` |
| push_tokens | Self | Self |
| incidents | Users in that tower | Edge Function only (service role) |
| incident_occupants | Self; management in that tower | RPCs only |
| help_requests | Requester; management in that tower | Edge Function / RPCs only |
| help_alerts | Recipient; management; **the requester, for alerts on their own request** (live acknowledgements on Help status; Migration 002) | RPCs only |
| incident_events | Management | Functions only |
| access_audit | Management; **employees see rows about themselves** ("Your profile": who viewed my data; Migration 002) | Functions only |
| visitor_checkins | Management | Edge Function only |

Outside an active incident, only the employee can see their own OKU status and assistance details. Management can see who their assigned employees are (names only) so they know who they're responsible for.

With two roles, any management user can trigger incidents and see the full dashboard. That's fine for the demo. For real use, add a `can_trigger_incidents` flag later so only UOA security can start one.

---

## 6. API surface

### 6.1 Direct table calls (supabase-js)

| Call | Used by |
|---|---|
| `select` towers, floors, building_points, guidance_templates | App start; saved to expo-sqlite for offline use |
| `select/update` own `profiles` row | Profile screen (FR3) |
| `select/upsert/delete` own `assistance_profiles` row | OKU status + stair question (FR2). Delete = "not OKU" and "No", or consent withdrawn |
| `upsert` own `push_tokens` row | After login and permission grant |
| `select` incidents where `tower_id = mine and status = active` | App start, to resume if an incident is already running |
| `select` incident_floor_summary | Management dashboard |
| `select` incident_events | Timeline screen (FR14) |

### 6.2 Postgres functions (`supabase.rpc`)

| Function | Args | Who | What it does | FR |
|---|---|---|---|---|
| `set_my_helpers` | helper_ids uuid[] | Employee who needs assistance | Checks there are at least `MIN_HELPERS` IDs (1 for the demo), all `management` in the same tower, then replaces the assignments | FR4 |
| `report_location` | incident_id, floor_level int, source, barometer_estimate numeric | Anyone in the incident | Updates last_floor and last_seen. The client calls it when the estimated floor changes, or every 30 s | FR8 |
| `mark_safe` | incident_id, method, assembly_point_id?, lat?, lng?, client_ts? | Anyone in the incident | Sets state `safe`. When GPS coordinates are given, computes `gps_verified` (haversine distance vs the point's radius, no PostGIS needed). Cancels any open help request. Logs an event | FR8, FR10 |
| `management_mark` | incident_id, user_id, state | Management | Marks someone safe or confirms they are waiting during the floor sweep | FR11 |
| `respond_to_help` | help_request_id, response | Management alert recipient | `on_my_way`: request becomes `acknowledged`, requester becomes `help_on_way`, responder becomes `responding`. `cannot_help`: logs the response; escalation continues if nobody else accepts | FR9 |
| `cancel_help` | help_request_id | Requester, while status is `open` or `acknowledged` | The Undo bar. Sets `cancelled`, `cancelled_at`, and the requester's state back to `unaccounted`. Helpers' alert screens close through Realtime | FR8 |
| `mark_arrived` | help_request_id | Management who accepted it | Sets `arrived_at`. Aisyah's Help status shows "Management is with you" | FR9 |
| `resolve_help` | help_request_id | Management | Marks the request resolved (both reached safety, or handed over to Bomba) | FR9 |
| `get_person_needs` | person_id, incident_id | Management, during an active incident only | Returns oku_status, oku_categories, stair_help, note, is_temporary. Writes `access_audit` | NFR |
| `get_incident_roll` | incident_id, floor_id? | Management | Returns everyone not yet safe with their state, last floor, waiting point, last seen, OKU status and stated needs. Writes one `access_audit` row per call | FR11, FR12 |
| `mark_bomba_shared` | incident_id | Management | Sets `bomba_shared_at/by` and logs `report_shared`. Called after the report is copied or shared | FR12 |
| `get_my_help_status` | incident_id | Requester | Returns their open request plus each alerted helper's name, response and response time. Powers the Help status screen without exposing other people's data | FR8, FR9 |
| `resolve_incident` | incident_id | Management | Closes the incident and logs the event | FR14 |
| `demo_simulate_evacuation` | incident_id | Management, demo mode only | Marks **one more** of `employee01` to `employee08` safe at Assembly point A and returns how many are left. The console calls it every ~700 ms until it returns 0, so the tiles animate. Run before going on stage | Demo |
| `demo_reset` | none | Management, demo mode only | Deletes every incident in the tower (roll calls, help requests and timelines go with it) so the demo can be rerun | Demo |

### 6.3 Edge Functions

All of them check the caller's JWT and role first. They use the service-role key internally. Push goes to `https://exp.host/--/api/v2/push/send` in chunks of 100.

**`trigger-incident`** (MVP, FR6 + FR7). Caller: management.
```
POST { tower_id, origin_floor_id?, type, action?, title? }
-> { incident_id, notified: number }
```
1. Fills in `action` from `type` if it's missing: fire → evacuate, earthquake → evacuate (drop, cover and hold first), power outage → shelter in place, security threat → lockdown.
2. Inserts the incident. The partial unique index rejects a second active incident in the same tower.
3. Inserts an `incident_occupants` row for every active profile in the tower, employees and management alike.
4. Sends push to every token in the tower. Employees who need assistance get the `needs_help` guidance; other employees get `everyone`; management gets `everyone` plus a pointer to the dashboard. Push data: `{ incidentId }`. Lockdown pushes are silent.
5. Logs `incident_triggered` and `guidance_sent`.

Target: alerts delivered in about 5 s. One function call does the inserts plus one batched push request.

**`request-help`** (MVP, FR8 + FR9). Caller: employee.
```
POST { incident_id, requester_id?, floor_level?, waiting_point_id?, barometer_estimate?, note? }
-> { help_request_id, alerted: number }
```
1. Creates the help request and sets the requester's state to `needs_help`.
2. Alerts the employee's assigned helpers (`assigned`) and management whose home floor is the employee's floor (`same_floor`). It inserts `help_alerts` rows and sends high-priority push: "Aisyah needs help on L22, Stairwell B waiting point." The push opens the alert screen, which has "On my way" and "Can't help" buttons. For an employee with a `hearing` OKU category, the requester's own screen uses vibration and flashing instead of sound.
3. Any employee can ask for help, even without an assistance profile (for example, someone injured during the evacuation). If there are no assigned helpers, the alert escalates straight to level 1.
4. `requester_id` is accepted only from management. It logs a request on someone's behalf (for example, a person who phoned the control room). The console's demo control "Send Aisyah's help request" uses it.

**`escalate-help`** (MVP, FR9). Called by `pg_cron` every 30 s.
- Level 0 → 1: no `on_my_way` response within `ESCALATE_AFTER_SECONDS` (60 for real use, 30 for the demo). Alerts all management in the tower.
- Level 1 → 2: still no response. The request turns red on the dashboard and all management gets pushed again.
- Fallback if pg_cron is fiddly on demo day: the management dashboard calls this function every 15 s while an incident is active.

**`bomba-report`** (FR12). Caller: management.
- **MVP:** the app calls `get_incident_roll`, formats a plain-text summary grouped by floor (name, state, OKU status, waiting point, stated needs, last seen) and opens the native share sheet (WhatsApp, SMS, email). It needs no hosting and works on a poor connection.
- **Later:** this function creates a `report_shares` token and returns a link to a live, read-only web page. Supabase Edge Functions on the default domain serve HTML as plain text, so the page would be an Expo web route (`/report/[token]`) that reads JSON from this function.

**`guest-check-in`** (Later, FR13). Public, no JWT.
```
POST { qr_code, full_name, phone?, visiting_company?, floor_level? }
```
The QR code identifies the assembly point, and the function rejects check-ins unless the tower has an active incident. It needs basic rate limiting by IP and phone. The form lives in the app as a "Guest check-in" screen that doesn't need an account. An Expo web page for visitors without the app would come later, for the same plain-text reason as above.

**`ai-briefing`** (optional stretch). Caller: management. Sends the roll call to OpenRouter (key stored as a function secret) and returns a short spoken-style briefing for fire command. It isn't in the brief, so build it only if time is left.

### 6.4 Realtime subscriptions

Already set up in `supabase/schema.sql` for `incidents`, `incident_occupants`, `help_requests` and `help_alerts`.

| Screen | Channel filter | Reaction |
|---|---|---|
| Every signed-in user | `incidents` where `tower_id=eq.<mine>` | Full-screen guidance as soon as an incident starts (works even if push fails) |
| Employee who asked for help | `help_requests` where `requester_id=eq.<me>`, and `help_alerts` for that request | Help status: each acknowledgement appears live; "On the way", then "Management is with you" |
| Management: assistant on the way | `help_requests` where `id=eq.<request>` | Closes the screen if the requester taps Undo |
| Management: alerts | `help_alerts` where `recipient_id=eq.<me>` | Alert screen |
| Management: dashboard | `incident_occupants` and `help_requests` where `incident_id=eq.<id>` (Daniel's check-in bumps the safe tile live) | Refetch `incident_floor_summary` (debounced 1 s); poll every 10 s as a backup (meets the 10 s NFR) |

Realtime applies RLS, so each user only receives rows they're allowed to see.

---

## 7. Client-side logic (no API needed)

**Barometer floor estimate** (FR8). This only runs while an incident is active (NFR Battery).
- Baseline: the pressure reading at a known floor (the home floor at incident start, or a scanned floor QR, which resets the baseline and cancels weather drift).
- iOS: `relativeAltitude` from `expo-sensors` gives metres moved since the listener started.
- Android: height change = `44330 × (1 − (p / p0)^(1/5.255))` metres.
- Estimated floor = baseline floor + height change ÷ `towers.floor_height_m`. Shown as "about L21", always labelled as an estimate.
- Calls `report_location` only when the rounded floor changes or 30 s have passed.

**Offline** (NFR Reliability)
- Towers, floors, points and guidance are cached in expo-sqlite after login, so guidance shows without a network connection.
- `mark_safe` and `request-help` calls go into a local outbox table and retry when the network returns. `client_ts` keeps the real check-in time.
- SMS fallback is Later.

**Notifications and accessibility**
- Android: an `emergency` channel with max importance and a long vibration pattern.
- iOS: `interruptionLevel: timeSensitive`. Critical alerts that bypass silent mode need a special Apple entitlement, so they're out of scope.
- Employees with the `hearing` OKU category get a flashing full-screen alert plus vibration. Those with `visual` get large text and screen-reader labels on every control (NFR Accessibility).

**Two app shells.** After login the app routes by role: employees land on the "My safety" screen (status, guidance, I need help / I'm safe); management lands on the dashboard with an alerts tab.

**Assembly-point map (mandatory in the demo).** Reads the assembly point's `lat`, `lng` and `radius_m` from `building_points`. It draws the point and the user's position with `react-native-maps` (included in Expo Go). The "I'm at the assembly point" button calls `mark_safe` with `assembly_manual`. If location permission is given and the phone is inside the radius, it sends `assembly_gps` with coordinates instead. Manual check-in must always work, because GPS is optional.

**Assistant "on the way" (mandatory in the demo).** Shows the requester's floor, waiting point (from `building_points`), barometer estimate, and needs (`get_person_needs`, audited). It shows the fixed safety line: "Stay with her at the waiting point. Do not carry her unless you are trained and have an evacuation chair." Buttons: "I'm with her" (`mark_arrived`) and "Handed to Bomba" (`resolve_help`).

**Packages to add:** `expo-location` (GPS check-in) and `react-native-maps` (assembly-point map), both now needed for the mandatory screens. `expo-camera` (QR scanning) stays Later.

---

## 8. Demo seed data

`supabase/seed.sql` holds the reference data and creates the demo Auth users directly in SQL, already confirmed. Run it in the Supabase SQL Editor; no secret key is needed.

- **Tower:** UOA Corporate Tower only for now (ground floor + L1 to L38). The other three towers (Vertical Corporate Tower B, Business Suites A and B) can be added later as extra rows; the schema already supports them.
- **UOA Corporate Tower, L22:** two waiting points (Stairwell A, Stairwell B), a Bomba lift lobby, two stairwells. There is one outdoor assembly point with real Bangsar South coordinates and a 75 m radius.
- **Demo accounts.** Every account's password is `test@123`. The login screen shows one-tap buttons for the first four:
  | Username | Name | Role | Home floor | Assistance profile |
  |---|---|---|---|---|
  | `management` | UOA Security Control | management | Ground floor (security control room) | None. The **only management account**. Triggers the incident, gets Aisyah's help alert and responds, watches the dashboard, shares with Bomba |
  | `daniel` | Daniel Tan | employee | L22 | None. Gets evacuation guidance, checks in |
  | `aisyah` | Aisyah Rahman | employee | L22 | `not_oku`, stair help `yes`, temporary, "Left leg in cast". Assigned helper: `management`. The demo's help requester |
  | `lim` | Lim Wei Jie | employee | L15 | `registered`, category `physical`, stair help `yes`, "Uses a wheelchair". Assigned helper: `management`. Shows an OKU employee on the dashboard without changing the L22 numbers |
  | `employee01` to `employee11` | Realistic names and companies | employee | L22 | None. Background occupants for the roll call; not on the quick-login screen |
- **Demo numbers on L22:** 1 waiting (Aisyah), 9 safe (Daniel + `employee01` to `employee08`), 3 unaccounted (`employee09` to `employee11`). Once `management` taps "On my way", it also shows 1 responding. Its home floor is the ground floor, so it doesn't change the L22 counts. Before going on stage, press the console's demo-only "Simulate evacuation" (`demo_simulate_evacuation`), so 8 are safe. During the run, Daniel checks in live on the assembly-point screen and the safe tile goes from 8 to 9.

Demo devices: three phones (`aisyah`, `management` as the assistant, `daniel` for the check-in) plus the console signed in as `management`. A push token belongs to one device and one user, so sign the console in **first** and the assistant phone **last**. Push then goes to the assistant phone, and the console updates through Realtime.

---

## 9. Requirement coverage

| FR | Covered by | Status |
|---|---|---|
| FR1 sign-up / quick login | Auth + `profiles`, demo accounts | MVP (quick login only; QR sign-up Later) |
| FR2 assistance profile + OKU status | `assistance_profiles` | MVP |
| FR3 edit / delete profile | Direct update; delete by management once `employment_status = left` | Edit MVP, delete Later |
| FR4 assign helpers | `assistance_assignments`, `set_my_helpers`, same-floor management | MVP (pre-seeded; screen if time) |
| FR5 building map | `building_points`, `floors.plan_image_path` | Waiting + assembly points MVP, full map Later |
| FR6 trigger incident | `trigger-incident` | MVP |
| FR7 guidance push | `guidance_templates`, `trigger-incident` | MVP |
| FR8 I need help / I'm safe + location | `request-help`, `cancel_help` (Undo), `get_my_help_status`, `mark_safe`, `report_location`, barometer | MVP |
| FR9 targeted alerts + escalation | `help_alerts`, `respond_to_help`, `mark_arrived`, `resolve_help`, `escalate-help` | MVP ("on the way" is mandatory in the demo) |
| FR10 assembly check-in + GPS | Assembly-point map, `mark_safe` (method `assembly_*`) | MVP, mandatory in the demo. Manual check-in required, GPS confirmation if location is allowed |
| FR11 live dashboard | `incident_floor_summary`, Realtime, `get_incident_roll` | MVP |
| FR12 Bomba report | `get_incident_roll` + share sheet/copy, `mark_bomba_shared` | MVP; live link Later |
| FR13 guest check-in | `visitor_checkins`, `guest-check-in` | Later |
| FR14 incident timeline | `incident_events` | MVP (simple list) |

---

## 10. Build order

1. `supabase/schema.sql`: enums, tables, RLS, helper functions, views, publication. **Done** (applied).
2. `supabase/seed.sql`. Check that every quick-login account signs in with `test@123`.
3. **Migration 002** (section 12): the columns, policies and all RPCs in section 6.2. **Applied.**
3b. **Migration 003** (section 12b): anyone signed in can report an emergency. **Written and tested**; run it in the SQL Editor.
4. Edge Functions: `trigger-incident`, `request-help`, then `escalate-help` + the cron job.
5. Wire screens to Realtime first (works in Expo Go), then add push once the development build is ready.

---

## 11. Decisions to confirm

1. **`responding` state** for the management user while they're inside helping someone. It keeps the brief's 1 / 9 / 3 numbers and adds a fourth count. Is that OK?
2. **Who picks the helpers (FR4)?** This plan has the employee pick from management users in their tower, and same-floor management is alerted automatically. With one management account, the seed data simply assigns `management` to Aisyah and Encik Lim. The alternative is management assigning helpers to employees.
3. **OKU details:** the plan stores self-declared OKU status and an optional JKM category, but no OKU card number. Is the category worth collecting? It changes how alerts and help work (hearing → flashing alerts), but it's extra sensitive data.
4. **Withdrawing consent:** employees can delete their own `assistance_profiles` row at any time, even though deleting the account itself is restricted (FR3). This follows the PDPA note in the brief. Is that OK?
5. **Bomba report for the demo:** share-sheet text instead of a live web link. Is that OK?
6. **Demo personas vs one management account.** `MINIMUM_PAGES.md` names the assistant "Mei Ling" and has a separate "Warden" phone. The database has one management account (`management`, "UOA Security Control"), so the assistant phone shows that name. Either rename the account's display name to a person (for example "Mei Ling (UOA Safety)"), or add a second management account just for the assistant phone.
7. **The "two trained assistants and a warden" line.** The demo has one management helper (`MIN_HELPERS = 1`), so the spoken line in `MINIMUM_PAGES.md` now says "assigned trained helpers". Raise `MIN_HELPERS` to 2 and add accounts if you want the original line.

---

## 12. Migration 002 (changes after `schema.sql` was applied)

`schema.sql` is already in the database, so the demo screens need a small follow-up migration, `supabase/migrations/002_demo_screens.sql` (written and tested):

| Change | For screen |
|---|---|
| `help_requests.arrived_at`, `help_requests.cancelled_at` | Assistant "on the way", Help sent (Undo) |
| `incidents.bomba_shared_at`, `incidents.bomba_shared_by` | Share with Bomba ("Mark as shared") |
| Policy: requester reads `help_alerts` on their own request | Help status (live acknowledgements) |
| Policy: employee reads `access_audit` rows where they are a subject | Your profile (backup) |
| The RPCs in section 6.2 | All demo screens |
| `app_config` table with `demo_mode = true` | The `demo_*` functions refuse to run when it's false. Set it to `false` before any real use |

For a fresh project, run the files in order: `schema.sql`, `seed.sql`, then each file in `supabase/migrations/` by number.

---

## 12b. Migration 003: occupant-reported emergencies

`supabase/migrations/003_report_incident.sql`. The app's home screen has a "Hold to report emergency" button. The reporter doesn't pick a type: every report means **evacuate**, and the alert says "Emergency", not "Fire".

| Change | Why |
|---|---|
| `incidents.type` is nullable; new `source` (`management` / `occupant_report`) and `report_count` | A reported emergency has no type. Extra reports of the same emergency bump the count instead of starting a second incident |
| `guidance_templates.incident_type` nullable, unique `nulls not distinct`, new `details` column | Generic evacuation steps (type null) with one short detail line per step, for `everyone`, `needs_help` and `management` |
| `report_incident()` | Any signed-in person. Starts an evacuation of their tower from their home floor and puts everyone in the tower on the roll call. If one is already running, it joins it. Returns `{ incident_id, created }` |
| `get_active_incident()` | One call for the alert and evacuation screens: incident, floor and tower names, the right guidance for the caller, their state, their latest help request, and the assembly point. Returns null when all is clear |
| `request_help(incident_id, waiting_point_id?, note?)` | "I need help" without an Edge Function. Creates the request, alerts assigned helpers and same-floor management (or all management if there are none). Calling it twice returns the same request. Push will be added by the `request-help` Edge Function later; open apps already get it through Realtime |

Other people in the tower see the alert through Realtime on `incidents`, as long as the app is open. Push for closed apps needs the `trigger-incident` Edge Function and a development build.

---

## 13. Screen-to-API map (crosscheck with `MINIMUM_PAGES.md`)

**Shown live**

| Screen | Reads | Writes / calls | Live updates |
|---|---|---|---|
| Login (one tap) | none | `supabase.auth.signInWithPassword` (`<username>@demo.uoa-evac.app`, `test@123`), then `register_push_token` | none |
| Profile | own `profiles`, own `assistance_profiles` | upsert `assistance_profiles` (stair help, temporary flag, note, OKU status, consent) | none |
| Alert, then Incident | active `incidents`, `guidance_templates` (cached) | `report_location` (barometer) | push + `incidents` |
| Help sent, then Help status | `get_my_help_status` | `request-help`; Undo → `cancel_help` | own `help_requests`, `help_alerts` |
| Assistant alert | `help_alerts` (own), `help_requests`, requester's `profiles` | `respond_to_help` (`on_my_way` / `cannot_help`) | push + own `help_alerts` |
| **Assistant "on the way"** | `help_requests`, `building_points` (waiting point), `get_person_needs` (audited) | `mark_arrived`, `resolve_help` | that `help_requests` row (Undo closes it) |
| **Assembly-point map, then Check-in and Safe** | `building_points` (assembly point lat/lng/radius) | `mark_safe` (`assembly_manual` or `assembly_gps`) | own `incident_occupants` |
| Building map setup (console) | `towers`, `floors`, `building_points` | insert/update/delete `building_points`. The "no evacuation chairs installed" callout shows when there are no `evac_chair` points | none |
| Trigger incident (console) | `floors` | `trigger-incident` | none |
| Live dashboard + person drawer (console) | `incident_floor_summary`, `get_incident_roll`, drawer: `get_person_needs` | `management_mark` | `incident_occupants`, `help_requests` |
| Share with Bomba (console) | `get_incident_roll` | copy / share sheet, then `mark_bomba_shared` | none |

**Demo controls (console):** "Trigger on L22" → `trigger-incident` with the L22 preset. "Send Aisyah's help request" → `request-help` with `requester_id`. "Simulate evacuation" → `demo_simulate_evacuation`. Reset → `demo_reset`.

**Spoken or backup screens**

| Screen | Covered by |
|---|---|
| Support team | own `assistance_assignments` + helper names from `profiles` |
| Warden | `incident_floor_summary` filtered to the user's floor |
| Signup | Later (FR1 QR sign-up) |
| Consent | `assistance_profiles.consent_at`, `consent_version` |
| Home, Floor map | `building_points`, `floors` |
| Your profile (who viewed my data) | `access_audit` rows about the user (Migration 002 policy) |
| All clear | `incidents.status = resolved` via Realtime |
| Visitor check-in, Visitor during incident | `guest-check-in`, `visitor_checkins` (Later) |
| Incident log, People, Visitors, Audit log (console) | `incident_events`, `profiles`, `visitor_checkins`, `access_audit` |
