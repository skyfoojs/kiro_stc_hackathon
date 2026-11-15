# Prompt: build the MANAGEMENT side of Relay

Copy everything below the line into your AI tool, and attach PROJECT_BRIEF.md with it.

---

You are building the **management (UOA / security control room) side** of Relay, an office disaster recovery app for The Vertical, Bangsar South. The full project brief is attached. A teammate has already built the **customer side** (staff, staff needing help, trained assistants, floor wardens, visitors) as a single-file HTML prototype. Your screens must look and behave like the same product, and must use the same demo data, so the two halves can be demoed back to back.

## Deliverable

- **One self-contained HTML file** (`management.html`): inline CSS and JS, no build step, no backend. All data is mocked in a JS object at the top of the file.
- A **desktop-first web console** (1280–1600px wide; it should still work down to 1024px). It runs on a control-room screen or laptop, not a phone.
- It is clickable end to end, with hash routing (`#dashboard`, `#trigger`, `#report`, …) so any screen can be opened directly during a demo.

## Visual system (must match the customer side exactly)

Use these CSS custom properties with these exact names and values:

```css
:root{
  --navy:#14213D;      /* primary: headers, primary buttons, text on light */
  --navy-2:#22335A;    /* hover / secondary navy surfaces */
  --mist:#E5ECF2;      /* support: app background */
  --mist-2:#F3F6F9;    /* raised surfaces on mist */
  --line:#C9D4DF;      /* dividers, input borders */
  --slate:#4B5B78;     /* secondary text */
  --orange:#FF5A1F;    /* POP: reserved for the most urgent thing on screen */
  --safe:#1D8A55;  --safe-bg:#DDF2E6;     /* confirmed safe */
  --wait:#9A6400;  --wait-bg:#FFF0C7;     /* waiting for help */
  --unacc:#C42B3B; --unacc-bg:#FBE0E3;    /* unaccounted for */
}
```

Rules:
- **Orange is the pop colour.** Use it only for: the "Trigger incident" action, the live-incident banner, and unacknowledged help requests or escalations. Anything that is not urgent never uses orange, so it always means "act now".
- Status colours are fixed across both apps: green = safe, amber = waiting for help, red = unaccounted for. Always pair a status colour with a text label and an icon or shape, never colour alone (WCAG 2.1 AA).
- White text on orange only at 18.66px bold or larger. For smaller text on orange, use navy.
- Typeface: **Atkinson Hyperlegible Next** (Google Fonts), falling back to `"Atkinson Hyperlegible", system-ui, sans-serif`. It is the one family for everything. Use tabular figures (`font-variant-numeric: tabular-nums`) for counts and times.
- Sentence case everywhere. No all-caps labels, no "→" on buttons, no middle-dot meta strings. Buttons say exactly what happens ("Send report to Bomba", not "Submit").
- Visible keyboard focus: a 3px navy outline with a 2px offset. Respect `prefers-reduced-motion`.
- Layout: a navy left sidebar for navigation, a mist content area, and a persistent top incident banner while an incident is live (orange, with incident type, tower, floor, elapsed timer and an "End incident" button).

## Brand: Relay and Ping

- The product is called **Relay**. Use "Relay" in the sidebar, the login screen and the page `<title>` (for example "Relay – Control room").
- **Ping** is the Relay mascot. It lives on the customer side. The management console must not show full-body Ping or any mascot scenes, because a control room needs a calm, dense screen.
- The only place Ping appears on the console is the **logo**: the compact badge below, about 40px wide, next to the word "Relay" in the navy sidebar and on the login card. Paste this inline SVG as is:

```html
<svg viewBox="20 6 120 158" width="40" height="53"><g><path d="M62 -2L76 50M98 -2L84 50" stroke="#F59E0B" stroke-width="8" fill="none"/><rect x="73" y="44" width="14" height="10" rx="3" fill="#CBD5E1"/></g><g><circle cx="80" cy="100" r="57" fill="none" stroke="#2563EB" stroke-opacity=".22" stroke-width="7"/><circle cx="80" cy="100" r="52" fill="#F8FAFC" stroke="#2563EB" stroke-width="5"/></g><circle cx="80" cy="100" r="45" fill="none" stroke="#E2E8F0" stroke-width="1.5"/><g><rect x="46" y="72" width="68" height="44" rx="22" fill="#1E293B"/><ellipse cx="66" cy="93" rx="5.5" ry="7" fill="#FBBF24"/><ellipse cx="94" cy="93" rx="5.5" ry="7" fill="#FBBF24"/><path d="M71 106q9 7 18 0" fill="none" stroke="#FBBF24" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></g></svg>
```

- Ping's status colours (cobalt `#2563EB`, amber `#F59E0B`, emerald `#10B981`) belong to the mascot only. Do **not** use them for console status. Console status keeps the fixed green / amber / red set above, and orange stays reserved for urgent actions.

## Users (one-tap demo login screen)

The login screen has two one-tap accounts (FR1 demo):
- **Hasnah Yusof**, UOA Security, Control Room (can trigger and end incidents).
- **Mr. Tan Kok Wai**, UOA Building Management (admin: people, maps, audit log).

Both accounts can see the dashboard and share the Bomba report.

## Screens to build

1. **Login**: the two one-tap demo accounts.
2. **Trigger incident (FR6, FR7)**: choose the type (Fire, Earthquake, Power outage, Security threat), the tower (4 towers, see data) and the origin floor. Show a **preview of the exact guidance staff will receive** for that type: evacuate via stairs / drop-cover-hold then wait / stay put / lockdown (copy below). Ask for confirmation in an in-page dialog, never `alert()`. Note on screen: "Fire alarm panel integration is simulated in this demo."
3. **Live dashboard (FR11)**: the core screen.
   - Tower selector, then a **vertical floor stack** for the tower (one row per floor; Level 22 must stand out) showing per-floor counts of safe / waiting / unaccounted.
   - Click a floor to open a panel listing each person: name, company, status, last known location, time of last update and, **only for people waiting for help**, their stated need.
   - Above the stack: building totals as three counts (safe, waiting for help, unaccounted for), plus "responders active".
   - A **help requests and escalations feed**: each request shows who was alerted, who acknowledged and when, and anything not acknowledged within 60s, flagged in orange (FR9 escalation).
   - Shows when the data was last refreshed, and refreshes at least every 10s (simulate it).
4. **Person detail drawer**: profile details are shown only during an incident. Show a line "Viewing is logged" and write an entry to the audit log when the drawer opens (non-functional requirement: access control).
5. **Share with Bomba (FR12)**: a report of everyone still inside, grouped by floor, with stated needs and last known location. Actions: "Copy report" (`navigator.clipboard`, in a click handler), "Print" (print-friendly CSS) and "Mark as shared with Bomba" (writes to the timeline). Make it readable on paper in black and white.
6. **Incident log and timeline (FR14)**: a chronological list of every event (triggered, guidance sent, help requested, acknowledged, escalated, checked in, report shared, ended), with filters by type and floor. Include a list of past incidents (one earlier mock drill).
7. **People and profiles (FR3, FR4)**: a searchable list by tenant company. A person's detail shows their assistance level (Yes / Sometimes / No), temporary condition and expiry, assigned assistants (at least 2) and warden. Admins can reassign assistants. "Remove profile" is allowed only when the person is marked as having left the company; show the reason inline when it is disabled. Show a note: "Consent withdrawal handling pending legal review (PDPA)."
8. **Building map setup (FR5)**: per tower and floor, a simple SVG floor plate with markers for Stairwell A, Stairwell B, the Bomba lift lobby, the waiting point and the assembly point. Markers are listed beside it with editable names. Show "Evacuation chairs: none installed (recommended)" as a callout, because the brief recommends chairs but none exist.
9. **Visitors (FR13)**: visitors checked in by QR today (name, visiting company, floor, check-in time, status during the incident).
10. **Audit log**: who viewed whose profile, and when.

## Demo data (must match the customer side exactly)

Incident: **Fire on Level 22, UOA Corporate Tower**, triggered at 10:41:30 by Hasnah Yusof (Security).

Towers: Business Suites Tower A (35 storeys + 5-floor podium), Business Suites Tower B (32 + podium), UOA Corporate Tower (38), Vertical Corporate Tower B (40).

Level 22, UOA Corporate Tower. Tenants: Meridian Legal and Kestrel Analytics (both fictional). Occupant counts: **1 waiting for help, 9 safe, 3 unaccounted for**. Responders are listed separately from the occupant counts.

| Name | Company | Status | Last known location / time |
|---|---|---|---|
| Aisyah Rahman | Meridian Legal | Waiting for help | L22, Stairwell B waiting point, 10:42:05 (barometer agrees: L22) |
| Daniel Ong | Meridian Legal | Safe | Assembly point A, 10:49:12 (GPS confirmed) |
| Farah Aziz | Meridian Legal | Safe | Assembly point A, 10:48:40 |
| Kevin Lim | Meridian Legal | Safe | Assembly point A, 10:48:55 (GPS confirmed) |
| Nurul Huda | Meridian Legal | Safe | Assembly point A, 10:49:30 |
| Priya Nair | Kestrel Analytics | Safe | Assembly point A, 10:50:02 (GPS confirmed) |
| Jason Tan | Kestrel Analytics | Safe | Assembly point A, 10:50:15 |
| Siti Mariam | Kestrel Analytics | Safe | Assembly point A, 10:50:41 |
| Hafiz Ismail | Kestrel Analytics | Safe | Assembly point A, 10:51:03 (GPS confirmed) |
| Grace Wong | Kestrel Analytics | Safe | Assembly point A, 10:51:20 |
| Lim Wei Jie | Kestrel Analytics | Unaccounted for | Last seen L22, 09:15 (app opened) |
| Amirul Hakim | Meridian Legal | Unaccounted for | Last seen L22, 10:12 |
| Sarah Chong | Kestrel Analytics | Unaccounted for | No update since sign-in |

Responders on L22:
- **Mei Ling Tan**: trained assistant for Aisyah, acknowledged at 10:42:19, with Aisyah at Stairwell B.
- **Arjun Pillai**: trained assistant for Aisyah, acknowledged at 10:42:31, with Aisyah at Stairwell B.
- **Ravi Kumar**: floor warden for L22, acknowledged at 10:42:40, sweeping the floor.

Aisyah's profile: needs help on stairs = **Yes**; temporary condition = **Leg injury, until 30 Nov 2026**; note: "Can walk short distances with a crutch. Stairs are not possible right now."

Escalation example (for the feed): a mock help request on another floor (Vertical Corporate Tower B, L31, "Ahmad Zaki") that is unacknowledged after 60s and escalated to the control room. This shows the orange state.

Make up plausible counts for the other floors and towers, but keep L22 exactly as above. Visitors: 2 mock visitors on L22 (one safe, one unaccounted).

Guidance copy by incident type (identical to what staff see):
- **Fire, evacuate:** "Leave now by the nearest stairwell. Do not use lifts. Go to Assembly point A and check in. If you can't use stairs, go to the Stairwell B waiting point and tap I need help."
- **Earthquake, shelter then evacuate:** "Drop, cover and hold on until the shaking stops. Then wait for your warden's instruction. Do not use lifts."
- **Power outage, stay put:** "Stay where you are unless your warden tells you to leave. Lifts are out of service. Use your phone torch on the stairs."
- **Security threat, lockdown:** "Stay inside. Lock or block the door, silence your phone, and stay out of sight. Do not go to the assembly point until told."

## Optional live link to the customer prototype

If both HTML files are opened from the **same origin** (e.g. both served by `npx serve` from one folder), sync them with `BroadcastChannel('appname-demo')`. The customer side already posts and listens for these messages:

```js
// management -> customer
{ type:'incident.start', incident:{ kind:'fire'|'earthquake'|'outage'|'security', tower:'UOA Corporate Tower', floor:22, at:'10:41:30' } }
{ type:'incident.end' }
// customer -> management
{ type:'help.request', person:'Aisyah Rahman', floor:22, where:'Stairwell B waiting point', at:'10:42:05' }
{ type:'help.ack', person:'Aisyah Rahman', by:'Mei Ling Tan', role:'assistant', at:'10:42:19' }
{ type:'checkin', person:'Daniel Ong', status:'safe', place:'Assembly point A', gps:true, at:'10:49:12' }
{ type:'warden.report', floor:22, by:'Ravi Kumar', summary:{ waiting:1, safe:9, unaccounted:3 }, at:'10:52:00' }
```

When a message arrives, update the dashboard and the timeline. The prototype must still work fully on its own when no channel messages arrive (scripted demo data).

## Demo flow it must support (from the brief)

1. Hasnah logs in, opens Trigger incident, and triggers "Fire, UOA Corporate Tower, Level 22".
2. The banner goes live; the dashboard shows the floor stack with L22 highlighted.
3. Aisyah's help request appears in the feed, and her two assistants and the warden acknowledge it (simulate on a short timer after triggering if no channel messages come in).
4. L22 shows 1 waiting, 9 safe, 3 unaccounted.
5. Hasnah opens Share with Bomba, copies the report and marks it as shared. The timeline records it.

## Constraints

- Do not build the customer screens.
- Never show guidance telling untrained staff to carry people or move against the evacuation flow.
- No real alarm-panel or indoor-positioning integration; simulate it.
- Don't load images from remote URLs; use inline SVG for icons and floor plans.
