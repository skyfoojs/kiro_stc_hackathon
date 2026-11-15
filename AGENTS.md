This is an Expo / React Native mobile app (Expo SDK 58, Expo Router, TypeScript). Prioritize mobile-first patterns and iOS + Android compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. Before writing code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/` (append `.md` to any docs URL for markdown).
3. For anything else, fetch https://docs.expo.dev/llms.txt and follow its links. Never answer from memory.

# Project Guide (7-hour hackathon)

Speed matters more than polish. Ship a working, demo-able vertical slice first, then improve. Don't over-engineer.

## Stack

- Expo SDK 58 + Expo Router (routes in `src/app/`) + TypeScript strict
- Supabase (`@supabase/supabase-js`, session stored via `expo-sqlite/localStorage`) for DB, auth, storage, and Realtime
- `expo-notifications` for push notifications (Expo Push Service)
- `expo-sensors` `Barometer` for floor-level detection
- `react-native-reanimated` for animation (already installed)
- Package manager: **npm** only (never yarn/pnpm/bun; don't mix lockfiles)

## Commands

```bash
npx expo install <package>  # ALWAYS use instead of npm install — picks SDK-compatible versions
npx expo start              # dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency/config issues
npx expo install --fix      # fix incompatible versions
```

Before declaring something done, run `npx tsc --noEmit` and `npx expo lint`.

## Native features: what needs a development build

- **Push notifications do NOT work in Expo Go on Android** (since SDK 53). Use a development build: `npx eas-cli@latest build --profile development` (or `npx expo run:ios|android` locally). Local notifications still work in Expo Go.
- Push tokens need an EAS project ID (`npx eas-cli@latest init`) and credentials (FCM v1 for Android, APNs for iOS). Test on a physical device.
- **Barometer** works in Expo Go on Android and on a physical iOS device (not the iOS Simulator). `relativeAltitude` is iOS-only; on Android, derive altitude from `pressure` (hPa). Floor = altitude delta from a ground-floor baseline / ~3 m per floor. Calibrate per building.
- `ios/` and `android/` are generated (CNG). Never create or edit them by hand; configure native behavior in `app.json` and config plugins.

## Routing

- Every file in `src/app/` is a screen; `_layout.tsx` files define navigators. Keep non-route code outside `src/app/`.
- Import `Link`, `router`, `useLocalSearchParams` from `expo-router`.

## Structure & conventions

- Shared components in `src/components/`, helpers in `src/lib/`, hooks in `src/hooks/`, types in `src/types/`. One component per file.
- Use `@/*` imports (maps to `src/`). Avoid `any`.
- Keep files small and functions simple. No premature abstractions.
- Always handle loading, empty, and error states. Never leave a spinner running forever.

## UI rules

- The UI library is not chosen yet. Before building screens, pick ONE and install it with `npx expo install`, then update this section. Suggested: NativeWind or Uniwind (Tailwind for RN) + react-native-reusables (shadcn-style components), `lucide-react-native` for icons, `sonner-native` for toasts.
- Until then: `StyleSheet.create` + shared theme constants. No hard-coded colors scattered across files.
- Support dark mode (`userInterfaceStyle: automatic` is set). Respect safe areas (`react-native-safe-area-context`).
- Never use `Alert.alert()` for routine feedback once a toast library is installed.

## Demo-readiness

- Seed realistic demo data so no screen looks empty.
- One-tap presets for anything the demo depends on (don't type under pressure).
- Test on a real phone. Push and the barometer can't be demoed on the iOS Simulator.
- Have a fallback (screen recording) in case push delivery or the venue Wi-Fi fails.

## Supabase

- Use the single client from `@/lib/supabase`. Don't create ad-hoc clients.
- The app talks to the database directly, so **Row Level Security is the only protection**. Enable RLS on every table and add policies. Keep the schema in `supabase/schema.sql`.
- Only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` may ship in the app. **Never** put the service-role/secret key in the app.
- Real-time in-app updates: Supabase Realtime. Background/closed-app alerts: push via Expo Push Service, sent from a Supabase Edge Function (or a database webhook calling one).

## AI (OpenRouter)

- LLM calls run **server-side only**, in a Supabase Edge Function (`supabase/functions/`). `OPENROUTER_API_KEY` is an Edge Function secret (`npx supabase secrets set`). It must never be `EXPO_PUBLIC_` or bundled in the app.
- Default model: `deepseek/deepseek-v4.1-flash-1017`. Define it in one place in the function code.
- Stream responses for user-facing output; handle failures with an error message and a retry.

## Secrets & env

- Secrets live in `.env.local` / `.env` (gitignored). Add every new variable name (no value) to `.env.example`.
- Expo inlines every `EXPO_PUBLIC_*` variable into the app bundle, where anyone can read it. Only public values get that prefix.
- Never commit or log keys.

## Do NOT install new packages unless needed

Check whether installed packages or Expo SDK modules already cover it. If you must add one, use `npx expo install` and say why in one line. Use native `fetch` and `Intl`/`Date`.

## Workflow & git

- **The user handles all git manually.** Never run git write commands (`add`, `commit`, `push`, `checkout -b`, `merge`, `rebase`, `reset`, etc.), and don't offer or remind to commit.
- The only exception is when the user explicitly asks for a git action in that message. Then do just that action, and never stage `.env*` files or force-push.
- Read-only git (`status`, `diff`, `log`) is fine.
- Don't spend more than ~15 minutes stuck on one bug. Stub it, move on, come back.

## Don'ts

- Don't build auth, settings pages, or admin panels unless the idea needs them.
- Don't add features after the feature freeze.
- Don't refactor for cleanliness. Only for blockers.
- Don't leave `console.log` spam, dead code, or `TODO`s in the demo path.
