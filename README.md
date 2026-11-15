# kiro_stc_hackathon

Expo (SDK 58) + Expo Router + Supabase mobile app.

## Run

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go for quick UI work. Push notifications need a development build (see `AGENTS.md`).

## Env

Copy `.env.example` to `.env.local` and fill in the values. `OPENROUTER_API_KEY` is server-only; set it as a Supabase Edge Function secret.
