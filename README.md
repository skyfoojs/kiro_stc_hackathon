# Relay

Emergency check-in app for high-rise office buildings, piloted on UOA Corporate Tower (The Vertical, Bangsar South).

Anyone in the building can report a fire, earthquake or security threat. Everyone in the tower is then alerted at once with a siren, vibration and a flashing screen. People who said they'd need help on stairs (OKU staff, or anyone with a temporary injury) have a help request sent automatically. Everyone else gets step-by-step guidance and a 3D map of their floor showing the route to the nearest stairwell. People then check in at the assembly point, and the control room sees who is safe, who is waiting for help and who is unaccounted for.

## Features

- **Sign in** with a username and password, or one tap on a demo account.
- **Home**: your floor, an "all clear" or "emergency" status, your evacuation plan, the floor map, and **Report an emergency**.
- **Report an emergency**: choose Fire or smoke, Earthquake or Security threat, then press and hold to alert the whole tower. Extra reports of the same emergency join it instead of starting a new one.
- **Incident alert**:
  - The reporter sees an orange screen. Everyone else in the tower sees a red screen with a moving LED border.
  - Both have a looping siren with a mute button, vibration, and a flashing edge for people who can't hear the alarm.
  - People who need help can choose **See my help request** or **I don't need help**.
- **Help request sent**:
  - A barometer gauge "finds" your floor and sends it to the control room.
  - A 5-second Undo, and a floor picker if the reading is wrong.
- **Help on the way**: a cut-through of the tower shows the Bomba team climbing to the staging floor, then to yours. Security, Bomba and your assigned helper each show their status.
- **Guidance**:
  - A radar finds your floor, then "Evacuate now".
  - The Blender-rendered Level 22 map flies in, then shows "You are here" and an arrowed route to Stairwell A, or to the waiting point if you're waiting for help.
  - Below the map: numbered steps, and **I need help** / **I'm leaving** buttons.
- **Check in**: a GPS search, then **I'm safe**. The server confirms the check-in is inside the assembly point's radius.
- **You're safe**: the time you checked in, plus who from your own company is here or not yet (names only).
- **All clear**: opens by itself when security ends the incident, and shows your own timeline.

Simulated for the demo: the barometer and GPS readings, the security and Bomba replies, and the Bomba arrival time (6 minutes plays in about 11 seconds). The report, alert, help request, cancel, check-in, office roll call and timeline are real and stored in Supabase.

## Tech stack

- **App**: Expo SDK 58, React Native 0.88, Expo Router, TypeScript.
- **UI**: `react-native-reanimated` for animation, `react-native-svg` for drawings, `lucide-react-native` for icons, `expo-audio` for the siren, `expo-image` for the map frames.
- **Backend**: Supabase. There is no separate server.
  - Postgres with Row Level Security on every table.
  - Postgres functions (RPCs) for every action; all of them check who is calling.
  - Realtime: when someone reports an emergency, every open app gets the alert straight away.
- **3D map**: rendered in Blender. Sources are in `docs/Relay/blender/`; the fly-in frames are in `assets/images/level22/`.

## Setup

### 1. Requirements

- Node.js 22.13 or newer, and npm.
- A Supabase project (the free tier is enough).
- A phone with **Expo Go** installed. It must support SDK 58, so update it from the App Store or Play Store if it's old.
- Optional, for native builds: **Xcode 26.4 or newer** (iOS) or Android Studio (Android).

### 2. Install

```bash
npm install
```

### 3. Environment variables

Copy the example file and fill in your Supabase values. Find them in the Supabase Dashboard, under Project Settings → API.

```bash
cp .env.example .env.local
```

```
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
```

Only variables with the `EXPO_PUBLIC_` prefix are built into the app, and anyone who has the app can read them. Never put the service-role key or the database password in the app. `OPENROUTER_API_KEY` is listed in `.env.example` for a planned feature and isn't used yet.

### 4. Database

In the Supabase Dashboard, open **SQL Editor** → **New query**. Run each file below in order, pasting the whole file each time:

| Order | File | What it does |
|---|---|---|
| 1 | `supabase/schema.sql` | Tables, enums, access rules, triggers, views, Realtime |
| 2 | `supabase/seed.sql` | UOA Corporate Tower, its floors, map points, guidance, companies and demo accounts |
| 3 | `supabase/migrations/002_demo_screens.sql` | Help request, check-in, roll call and demo functions |
| 4 | `supabase/migrations/003_report_incident.sql` | Reporting an emergency from the app |
| 5 | `supabase/migrations/004_report_types_and_screens.sql` | Report types, guidance text, office roll call, timeline |

Run `schema.sql` and each migration **once**; running them again fails without changing anything. `seed.sql` is safe to run again.

### 5. Run

```bash
npx expo start
```

Scan the QR code with Expo Go: on iPhone use the Camera app, on Android use the scanner in Expo Go.

- **Phone can't connect** (common on venue Wi-Fi): run `npx expo start --tunnel`.
- **iPhone shows "No usable data found"**: Expo Go isn't installed or needs updating.
- **Native build over USB**: run `npx expo run:ios --device` or `npx expo run:android --device`. iOS needs Xcode 26.4 or newer; with an older Xcode, the build fails in `expo-modules-jsi`.

## Demo accounts

Every account's password is **`test@123`**. The **Use a demo account** screen signs in with one tap.

| Username | Who | Notes |
|---|---|---|
| `aisyah` | Aisyah Rahman, L22 | Needs help on stairs (leg in a cast, not OKU). Her help request is sent automatically. |
| `daniel` | Daniel Tan, L22 | Standard staff. Gets the evacuation route and checks in. |
| `lim` | Lim Wei Jie, L15 | OKU wheelchair user. |
| `management` | UOA Security Control | The only management account. Use it for the Command view, or to answer help alerts. |
| `employee01`–`employee11` | Background staff on L22 | Fill the roll call. They aren't on the quick-login screen. |

The shared password is for fake demo data only. Delete these accounts or change their passwords before any real use. Also set `demo_mode` to `false` in the `app_config` table.

## Running the demo

1. Sign in on two phones: one as `daniel`, one as `aisyah`.
2. On Daniel's phone: **Report an emergency**, choose **Fire or smoke**, then hold the button.
3. Daniel sees the orange alert. Aisyah's phone switches to the red alarm, and her help request is sent automatically.
4. Aisyah taps **See my help request**. She sees the barometer, then the Bomba team climbing the tower.
5. Daniel taps **Show me what to do**. He sees the radar, the 3D route to Stairwell A, then **I'm leaving**, check in, and **You're safe** with his office list.

**Reset between runs:** paste `supabase/reset_incidents.sql` into the SQL Editor and run it. It deletes all incidents, roll calls, help requests and timelines, and keeps people, profiles and the building map. You can run it as often as you like.

**Ending an incident** (to show the All clear screen): while signed in as `management`, call `resolve_incident(<incident id>)`. Alternatively, in the Supabase table editor, set the incident's `status` to `resolved`.

## Project structure

```
src/
  app/                  Screens (Expo Router: each file is a route)
    welcome.tsx         Landing
    sign-in.tsx         Username and password
    demo.tsx            One-tap demo accounts
    (app)/              Signed-in screens
      index.tsx         Home
      report.tsx        Report an emergency
      alert.tsx         Alert for the reporter (orange)
      alarm.tsx         Alert for everyone else (red, LED border)
      evacuate.tsx      Radar, guidance and the 3D map
      help.tsx          Help request sent (barometer)
      help-status.tsx   Help on the way (Bomba climb)
      checkin.tsx       Check in at the assembly point
      safe.tsx          You're safe, plus your office list
      ended.tsx         All clear and your timeline
      map.tsx           Floor map
  components/           Shared UI (buttons, Ping mascot, Level22Map, FloorRadar, ...)
  lib/                  Supabase client, auth, incident state, API calls, siren
  constants/theme.ts    Colours, spacing, type
  types/                Shared TypeScript types
supabase/               schema.sql, seed.sql, migrations/, reset_incidents.sql
assets/                 Icons, Level 22 map frames, siren sound
docs/
  DATABASE_AND_API.md   Database and API design
  MINIMUM_PAGES.md      3-minute demo plan
  Relay/                Brief, Command view spec, prototype HTML, Blender sources
```

## Checks

```bash
npx tsc --noEmit     # typecheck
npx expo lint        # lint
npx expo-doctor      # dependency and config checks
```

## Privacy

Whether someone needs help on stairs is health-related, so it counts as sensitive personal data under PDPA 2010 (amended 2024).

- It's stored in its own table, and only the person can read it directly.
- Responders see it only during an active incident, through database functions that log every view.
- The consent wording needs legal review before real use.

## Not built yet

- Push notifications for apps that are closed. Alerts currently reach open apps through Realtime.
- Real barometer and GPS readings, QR floor check-in, offline caching, and an SMS fallback.
- Visitor check-in.
- AI-written responder briefings.
- The management console, which a teammate is building from `docs/Relay/docs/COMMAND_VIEW_SPEC.md`.
