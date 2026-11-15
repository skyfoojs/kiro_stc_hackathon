<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Guide (7-hour hackathon)

Speed matters more than polish. Ship a working, demo-able vertical slice first, then improve. Don't over-engineer.

## Stack

- Next.js (App Router, `src/` dir) + TypeScript + Tailwind CSS
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`) for DB/auth/storage
- shadcn/ui for components, `lucide-react` for icons, `sonner` for toasts, `framer-motion` for animation
- Vercel AI SDK (`ai`) + `@openrouter/ai-sdk-provider` for LLM features
- Package manager: **npm** only (never yarn/pnpm; don't mix lockfiles)

## UI rules (important)

- **Never hand-write a button, input, dialog, card, select, tabs, etc.** Use shadcn components from `src/components/ui/`.
- If a component is missing, add it with `npx shadcn@latest add <name>` (e.g. `input card dialog dropdown-menu select tabs textarea label skeleton badge`). Do not copy-paste or reinvent it.
- Don't edit files in `src/components/ui/` except for small theme tweaks. Compose them in your own components instead.
- Icons: only `lucide-react`. No emoji icons, no other icon libraries.
- Toasts: only `sonner` (`toast.success(...)`, `toast.error(...)`). Mount `<Toaster />` once in `src/app/layout.tsx`. Never use `alert()`.
- Animation: `framer-motion` for transitions and entrances. Keep it subtle and don't animate everything.
- Styling: Tailwind utility classes plus the `cn()` helper from `@/lib/utils`. No inline styles, no extra CSS files, no CSS-in-JS. Use theme tokens (`bg-background`, `text-muted-foreground`, `bg-primary`) instead of hard-coded colors.
- Always handle loading, empty, and error states (use shadcn `Skeleton` for loading). Make layouts responsive (mobile first).

## Frontend "wow" factor

We can't build many features in 7 hours, so the UI has to impress judges. Spend polish time on the screens shown in the demo, and nowhere else.

**Visual identity**
- Pick one strong look on day one and apply it everywhere: edit the CSS variables (theme tokens) in `src/app/globals.css` for a distinctive primary/accent color, radius, and background. Don't ship the default grey shadcn theme.
- Support dark mode and make it look good (dark often demos better). Use a deliberate type scale: big, bold hero headings, a clear hierarchy, generous whitespace.
- Use one good font via `next/font` (Geist is already set up; swap only if it adds clear value).
- Use depth sparingly: subtle gradients, soft shadows, `backdrop-blur` glass cards, a gradient or glow behind the hero. Consistent spacing and alignment beat decoration.

**Motion (framer-motion)**
- Page/section entrance: fade + slight upward slide, staggered children (`staggerChildren: 0.06`).
- Interactive feedback: `whileHover` / `whileTap` scale (1.02 / 0.98) on cards and primary actions; animated list add/remove with `AnimatePresence` and `layout`.
- Keep durations 0.2-0.5s with ease-out; respect `prefers-reduced-motion`. Never animate in a way that delays the user.
- Put reusable variants in `src/lib/motion.ts` instead of repeating them.

**AI moments (the demo's centerpiece)**
- Stream AI output token by token with a typing/shimmer indicator; never show a blank screen while waiting.
- Show skeletons or a "thinking" animation, then animate results in. Make the AI feel alive, not like a form submit.
- Provide one-click example prompts or presets so the demo never depends on typing under pressure.

**Demo-readiness**
- A real landing/hero section with a clear one-line value proposition and a primary call to action (shadcn `Button`).
- Seed realistic demo data (names, avatars, numbers) so no screen looks empty. Empty states should be friendly and show what to do next.
- Micro-interactions on success: `sonner` toast plus a small animation. Use `lucide-react` icons consistently (same size and stroke width).
- Fully responsive; the demo may be on a projector or a phone. Check at mobile and desktop widths.
- No layout shift, no unstyled flash, no console errors on the demo path. Set page `title` and metadata, and add a favicon.
- Accessibility basics still count: contrast, focus rings, alt text, keyboard-reachable controls (shadcn gives most of this for free).

## Do NOT install new packages unless needed

Before adding a dependency, check whether the installed ones already cover it. If you must add one, say why in one line. Avoid duplicates of what exists (no axios, no moment, no other UI kits, no other toast/icon libraries). Use native `fetch` and `Intl`/`Date`.

## Code conventions

- TypeScript strict; avoid `any`. Use `@/*` imports (e.g. `@/components/ui/button`).
- Server Components by default. Add `"use client"` only when you need state, effects, or browser APIs; keep client components small and push them to the leaves.
- Mutations: Server Actions or route handlers in `src/app/api/**/route.ts`. Validate input with `zod` if installed; otherwise do a minimal manual check.
- Structure: routes in `src/app/`, shared components in `src/components/`, helpers in `src/lib/`, types in `src/types/`. One component per file, PascalCase component files.
- Keep files small and functions simple. No premature abstractions, no tests-first perfectionism. Add tests only for critical logic if time allows.

## Supabase

- Browser: `createClient` from `@/lib/supabase/client`. Server (components, actions, routes): `createClient` from `@/lib/supabase/server` (async). Don't create ad-hoc clients.
- `src/proxy.ts` refreshes the auth session (Next 16 renamed `middleware` to `proxy`). Don't rename or remove it.
- Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are safe in the browser. **Never** use the service-role key in client code.
- Enable Row Level Security on every table and add policies, even quick ones. Keep the schema in a `supabase/schema.sql` file (or note migrations there) so teammates can reproduce it.
- On the server, use `supabase.auth.getUser()` for auth checks, not `getSession()`.

## AI (OpenRouter)

- Call LLMs on the **server only** (route handler or Server Action) so `OPENROUTER_API_KEY` is never exposed.
- Use `createOpenRouter` from `@openrouter/ai-sdk-provider` with `streamText` / `generateText` / `generateObject` from `ai`. Stream responses for anything user-facing.
- Import the model from `@/lib/ai` (`model`, `AI_MODEL`); never hard-code model ids elsewhere. Default is a DeepSeek model (`deepseek/deepseek-v4.1-flash-1017`); switching models is a one-line change in that file.
- Always handle API failures: show a `sonner` error toast and a retry option. Don't leave the UI spinning forever.

## Secrets & env

- Secrets live in `.env.local` only (gitignored). Add every new variable name (no value) to `.env.example`.
- Never commit keys, never log them, never prefix server secrets with `NEXT_PUBLIC_`.

## Workflow & git

- **The user handles all git manually** (staging, commits, pushes, branches, PRs). Never run git write commands (`add`, `commit`, `push`, `checkout -b`, `merge`, `rebase`, `reset`, etc.), and don't offer or remind to commit.
- The only exception is when the user explicitly asks for a git action in that message. Then do just that action, and never stage `.env*` files or force-push.
- Read-only git (`status`, `diff`, `log`) is fine.
- Before declaring something done, run `npx tsc --noEmit` and `npm run lint`. Run `npm run build` before demo time and before deploying.
- Fix root causes briefly; don't spend more than ~15 minutes stuck on one bug. Stub it, move on, and come back.

## Suggested hackathon time plan

1. **Hour 0-0.5:** Lock the idea, pick the single core user flow, set up env keys and Supabase tables.
2. **Hour 0.5-4:** Build the core flow end to end with real data, ugly is fine.
3. **Hour 4-6:** Add the AI/"wow" feature, polish UI states, animations, and seed demo data.
4. **Hour 6-7:** Freeze features. Deploy (Vercel), test the live URL, prepare the demo script and a fallback (screenshots or video) in case something fails.

## Don'ts

- Don't run git write commands (commit, push, etc.) unless the user explicitly asks; they commit manually.
- Don't build auth, settings pages, or admin panels unless the idea needs them.
- Don't add features after the feature freeze.
- Don't refactor for cleanliness. Only for blockers.
- Don't leave `console.log` spam, dead code, or `TODO`s in the demo path.
