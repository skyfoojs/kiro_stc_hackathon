# Relay Command view: what the management / firemen side needs

For the teammate building the non-customer side. Read with PROJECT_BRIEF.md. This replaces MANAGEMENT_SIDE_PROMPT.md, which is out of date (it still has assistants, wardens and a desktop console).

## 1. What it is

One **phone-first web view called Command**, used by two people who sit together in the fire command centre:

- **UOA security** (control room): sees the live picture, reviews the plan, sends it to teams.
- **Bomba commander**: sees the same picture, receives the plan **for review only**, and replies Followed, Changed or Ignored.

There is **no separate firemen screen** and no responder app. A role switch at the top of Command changes which of the two you are.

**The one-line pitch it must prove:** Relay tells you where everyone is, and hands responders a short plan. Bomba decides how many people to send.

## 2. Hard rules (do not break these)

1. **No rescuer headcounts, anywhere.** Never show or suggest how many firemen, units, engines or vehicles to send. Not in the plan, not in tiles, not in tooltips. Teams may say when they will arrive and where they are going, in their own words. That is all.
2. **The plan is advice for review only.** Wording and buttons say "Send for review", "Followed", "Changed", "Ignored". Never "Approve", "Order" or "Dispatch orders".
3. **Lift or stairs is the Bomba commander's choice.** Show both options. Never pre-select one.
4. **Only Bomba or specialist rescue are named for entering the fire floor or carrying.** The building emergency team (ERT) never is.
5. **The plan is five lines on one phone screen, no scrolling.** Each line about 15 words or fewer. It uses floors, stairwells, lifts and team names. It does not name people. Names appear only inside **Details**.
6. **Occupant counts come from live data.** The AI never writes a count. If the AI is unavailable, show the template plan (Section 6) and nothing breaks.
7. **No customer screens.** Those already exist.

## 3. Deliverable

- One self-contained HTML file, `command.html`. Inline CSS and JS, no build step, no backend. All data mocked in a JS object at the top.
- **Phone-first, 390 px wide.** It must also look fine on a laptop (centre the phone-width column, max 480 px). Do not build a desktop console.
- Hash routing so any screen can be opened directly: `#signin`, `#dashboard`, `#dispatch`, plus backup screens.
- No remote images. Inline SVG for icons.
- Page title: "Relay – Command".

## 4. Visual system (must match the customer app)

Use these exact CSS variable names and values.

```css
:root{
  --navy:#14213D;  --navy-2:#22335A;
  --mist:#E5ECF2;  --mist-2:#F3F6F9;  --line:#C9D4DF;  --slate:#4B5B78;
  --orange:#FF5A1F;                          /* POP: urgent only */
  --safe:#1D8A55;  --safe-bg:#DDF2E6;        /* confirmed safe */
  --wait:#9A6400;  --wait-bg:#FFF0C7;        /* waiting for help */
  --unacc:#C42B3B; --unacc-bg:#FBE0E3;       /* unaccounted for */
}
```

- **Orange is reserved** for: the live-incident banner and anything urgent and unacknowledged. Nothing else is orange.
- Green, amber and red always come with a text label and an icon or shape, never colour alone.
- White text on orange only at 18.66 px bold or larger. Otherwise use navy.
- Font: **Atkinson Hyperlegible Next**, falling back to `"Atkinson Hyperlegible", system-ui, sans-serif`. Tabular figures for counts and times.
- Sentence case. No all-caps labels, no "→" on buttons, no middle-dot meta strings. Buttons say what happens.
- Touch targets at least 48 px. Visible focus: 3 px navy outline, 2 px offset. Respect `prefers-reduced-motion`.
- **Ping, the mascot, appears only as the small logo badge** (about 40 px) in the header and on the sign-in card. No full-body Ping, no scenes. Do not use Ping's blue, amber or green for status.

Logo badge, paste as is:

```html
<svg viewBox="20 6 120 158" width="40" height="53"><g><path d="M62 -2L76 50M98 -2L84 50" stroke="#F59E0B" stroke-width="8" fill="none"/><rect x="73" y="44" width="14" height="10" rx="3" fill="#CBD5E1"/></g><g><circle cx="80" cy="100" r="57" fill="none" stroke="#2563EB" stroke-opacity=".22" stroke-width="7"/><circle cx="80" cy="100" r="52" fill="#F8FAFC" stroke="#2563EB" stroke-width="5"/></g><circle cx="80" cy="100" r="45" fill="none" stroke="#E2E8F0" stroke-width="1.5"/><g><rect x="46" y="72" width="68" height="44" rx="22" fill="#1E293B"/><ellipse cx="66" cy="93" rx="5.5" ry="7" fill="#FBBF24"/><ellipse cx="94" cy="93" rx="5.5" ry="7" fill="#FBBF24"/><path d="M71 106q9 7 18 0" fill="none" stroke="#FBBF24" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></g></svg>
```

## 5. The three demo screens (total about 90 seconds on screen)

### 5.1 Sign in with role (`#signin`, about 7 s)

- Logo badge, "Relay", "Command".
- Two one-tap accounts:
  - **Hasnah Yusof**, UOA Security, control room.
  - **Captain Razak Ibrahim**, Bomba incident commander (fictional).
- One tap goes to the dashboard as that role.
- A role chip at the top of every later screen shows who you are and lets you switch role in one tap. The switch must keep the same live data.

### 5.2 Live dashboard with the plan card (`#dashboard`, about 45 s)

Top to bottom, on one phone screen as far as possible:

1. **Incident banner** (orange): "Fire, Level 22, UOA Corporate Tower", elapsed timer, role chip. If no incident is live: a calm state, "No incident", with a button **"Trigger a fire on Level 22"** (security only). **This is how the demo starts the incident**: it sends `incident.start` to the staff phones, which show the alert.
2. **Three counts for Level 22**: Waiting for help **1**, Safe **9**, Unaccounted for **3**. Each tile has a label, an icon and its colour. Under them, a small line "Building: 1 waiting, 9 safe, 3 unaccounted" and "Updated 4 seconds ago" (refresh label at least every 10 s).
3. **Plan card** (Section 6), with a **Send for review** button and a **Details** link.
4. **Where people are**: a compact list for Level 22, waiting first, then unaccounted (ranked by last seen), then a collapsed "Safe (9)" group. Each row shows status, last known place and time. Names are shown to security; the Bomba commander sees names only inside Details.
5. **Live updating (must be visible).** About 15 seconds after the incident starts, Amirul Hakim checks in safe at Assembly point A. Counts become Waiting 1, Safe 10, Unaccounted 2. The plan's fifth line changes from "3 unaccounted" to "2 unaccounted", and that line is highlighted for a few seconds. If a real `checkin` message arrives from the customer app, do the same for that person.

### 5.3 Dispatch and comms (`#dispatch`, about 35 s)

- **Teams list**, each with a name, a status and one line from the team, in the team's words:
  - Bomba Pantai
  - Bomba Hang Tuah
  - Bomba Seputeh
  - Bomba high-rise rescue
  - Bomba EMRS (ambulance)
  - Building ERT (UOA / THBS JMB)
  - PDRM patrol (included, but marked "Not needed for a fire" and off by default)
- Tick boxes choose which teams get the plan. All Bomba teams and the ERT are ticked by default.
- **Send for review** sends the same five lines to all ticked teams. Statuses then change on timers (scripted replies, no real network):

| After send | Team | Status | Their words (scripted) |
|---|---|---|---|
| 2 s | Bomba Pantai | Acknowledged | "On the way, about 6 minutes." |
| 4 s | Building ERT | Acknowledged | "At the lobby. Fire lift unlocked and plans ready." |
| 6 s | Bomba Hang Tuah | Acknowledged | "On the way, about 8 minutes." |
| 8 s | Bomba high-rise rescue | Acknowledged | "On the way, about 9 minutes." |
| 10 s | Bomba EMRS | Acknowledged | "Heading to Assembly point A." |
| 12 s | Bomba Seputeh | Acknowledged | "On the way, about 11 minutes." |

- Status words: Not sent, Sent, Acknowledged, En route, At staging, On floor, Person reached, Done. The demo only reaches Acknowledged. Use a text label plus an icon.
- **Updates going out.** Below the list, an "Updates sent to teams" log. Every live change adds a line and is marked as sent, for example "10:50 Amirul Hakim checked in safe. Unaccounted on Level 22 is now 2." One tap on **Send update** sends any pending change.
- **Share report with Bomba**: a button that opens a short report: the five plan lines at the top, then people still inside by floor with stated need and last known location. Actions: Copy report (`navigator.clipboard`, in a click handler), Print (black-and-white friendly), and "Mark as shared with Bomba" (adds a line to the log).
- **Offline note** (small, always visible): "If data drops, teams get a text summary every 60 seconds."

### 5.4 Bomba commander role (same screens, about 10 s)

After switching to Captain Razak Ibrahim:

- The dashboard is the same, but the plan card is titled **"Plan received for review"**, with who sent it and when.
- Under line 4 (moving the person waiting), show the two options as unselected choices:
  - "Fire lift from Level 20" 
  - "Stairs"
  - Plus the note: "Your decision. Relay does not choose."
- Three reply buttons: **Followed**, **Changed**, **Ignored**. Replies are optional. Tapping one adds a line to the log, and on the security role the sender sees "Bomba commander: Changed".
- On Dispatch, the commander sees the same teams list read-only.

## 6. The plan card (exact content for the demo)

Five lines, one screen. Use this text exactly in the demo.

```
Fire, Level 22, UOA Corporate Tower
1. Get in: appliances to the main entrance. Command at the fire command centre.
2. Stage on Level 20. ERT hands over floor plans and lift control.
3. Crews go up Stairwell B. Occupants come down Stairwell A.
4. Bomba rescue: Level 22 waiting point, 1 person, cannot use stairs. Lift or stairs: commander decides.
5. Bomba search: Level 22 then 23, 3 unaccounted. EMRS: assembly point.
```

- Line 5's count follows the live data (3, then 2 after the live update).
- **Details** (opened inline, not a new page) shows:
  - The person waiting: **Aisyah Rahman**, Meridian Legal, Level 22, Stairwell B waiting point, requested 10:42, sent automatically from her profile. Need: "Needs help on stairs. Leg injury, temporary, until 30 Nov. Can walk short distances with a crutch. Stairs are not possible right now."
  - The three unaccounted, ranked by last seen: Amirul Hakim (Level 22, 10:12), Lim Wei Jie (Level 22, 09:15), Sarah Chong (no update since sign-in).
  - The guardrails in one line each: no headcounts, staging two floors below the fire, crews and occupants use different stairwells, lift or stairs is the commander's call.
  - A line: "Viewing this is logged."
- **Template fallback.** If the plan text is not available, show a generic card built from the building map: way in, staging floor (fire floor minus 2), stairwells, people waiting. A small label says "Basic plan".
- **AI note.** In the demo the five lines are pre-written. If you add an AI call, it may only choose order and wording; counts, floors, stairwells and team names must come from the data, and any line that names something not in the data must be dropped.

## 7. Demo data (identical to the customer app)

Incident: **Fire on Level 22, UOA Corporate Tower**, triggered at 10:41:30. Towers: Business Suites Tower A, Business Suites Tower B, UOA Corporate Tower (38 storeys), Vertical Corporate Tower B (40 storeys).

Level 22, tenants Meridian Legal and Kestrel Analytics (fictional):

| Name | Company | Status | Last known |
|---|---|---|---|
| Aisyah Rahman | Meridian Legal | Waiting for help | Stairwell B waiting point, 10:42 |
| Daniel Ong | Meridian Legal | Safe | Assembly point A, 10:49 |
| Farah Aziz | Meridian Legal | Safe | Assembly point A, 10:48 |
| Kevin Lim | Meridian Legal | Safe | Assembly point A, 10:48 |
| Nurul Huda | Meridian Legal | Safe | Assembly point A, 10:49 |
| Priya Nair | Kestrel Analytics | Safe | Assembly point A, 10:50 |
| Jason Tan | Kestrel Analytics | Safe | Assembly point A, 10:50 |
| Siti Mariam | Kestrel Analytics | Safe | Assembly point A, 10:50 |
| Hafiz Ismail | Kestrel Analytics | Safe | Assembly point A, 10:51 |
| Grace Wong | Kestrel Analytics | Safe | Assembly point A, 10:51 |
| Lim Wei Jie | Kestrel Analytics | Unaccounted | Last seen Level 22, 09:15 |
| Amirul Hakim | Meridian Legal | Unaccounted (checks in about 15 s into the demo) | Last seen Level 22, 10:12 |
| Sarah Chong | Kestrel Analytics | Unaccounted | No update since sign-in |

Start counts: **1 waiting, 9 safe, 3 unaccounted**. There are no wardens, assistants or Mei Ling, Arjun or Ravi in the data any more.

## 8. Talking to the customer app (optional live link)

If both HTML files are served from the same origin, they sync over `BroadcastChannel('appname-demo')`. The customer app already sends and listens for these. The demo must still run fully on its own with scripted data when no messages arrive.

```js
// Command -> customer (Command triggers the incident in the demo)
{ type:'incident.start', incident:{ kind:'fire', tower:'UOA Corporate Tower', floor:22, at:'10:41:30' } }
{ type:'incident.end' }

// customer -> Command
{ type:'help.request', person:'Aisyah Rahman', floor:22, where:'Stairwell B waiting point', locatedBy:'gps+barometer', auto:true, at:'10:42' }
   // floor comes from the phone's GPS (tower) and barometer (floor); the person is not asked where they are
   // auto:true means it was sent automatically from her assistance profile
{ type:'help.cancel',  person:'Aisyah Rahman', floor:22 }
   // she cancelled the automatic request: remove her from Waiting, drop plan line 4
{ type:'help.ack', person:'Aisyah Rahman', by:'UOA security', role:'security', at:'10:42' }
{ type:'help.ack', person:'Aisyah Rahman', by:'Bomba rescue team', role:'rescue', eta:'about 6 minutes', at:'10:42' }
{ type:'checkin', person:'Daniel Ong', status:'safe', place:'Assembly point A', gps:true, at:'10:49' }
{ type:'leaving', person:'Daniel Ong', floor:22, at:'10:44' }
{ type:'report', kind:'fire'|'medical'|'security'|'other', person:'Daniel Ong', floor:22, locatedBy:'gps+barometer', at:'10:40' }
   // a staff member reported an emergency before any incident exists. Show it as an urgent card on the dashboard (orange, unacknowledged) with the person, what was reported and the floor, and a button "Start incident" (security only). Do not start an incident automatically.
   // a standard user tapped I'm leaving: show them as Leaving (still unaccounted until they check in at the assembly point)
```

When a message arrives, update the counts, the plan card and the updates log. The customer prototype also has a stand-in trigger in its demo controls for practising on its own; if Command receives an `incident.start` it did not send, it should still switch to the live incident.

## 9. Backup screens (build only if time allows; not shown in the 3 minutes)

- **Building map setup**: per tower and floor, a simple SVG plate with markers for Stairwell A, Stairwell B, the fire lift lobby, the waiting point and the assembly point. Note: "Evacuation chairs: none installed (recommended)".
- **Team settings**: the list of teams, contact channel, availability. No staff counts.
- **Incident log and timeline**: every event, newest last, with filters. Include plan versions, sends, acknowledgements, replies and edits.
- **People and profiles**, **Visitors** and **Audit log**: as in the brief (FR3, FR13, access log). Opening a person's details writes an entry to the audit log.

## 10. Acceptance checklist

- [ ] Opens straight to `#signin`, and each hash route opens directly.
- [ ] Sign in as Hasnah, trigger the fire, and see 1 waiting, 9 safe, 3 unaccounted.
- [ ] The plan card is exactly five lines with no scrolling at 390 px.
- [ ] About 15 s after the incident starts, the counts change to 1 / 10 / 2 and line 5 is highlighted.
- [ ] Send for review sends to the ticked teams and six scripted replies arrive over about 12 s.
- [ ] Search the whole file: no headcount of rescuers, no "approve", and no mention of wardens or assistants.
- [ ] Switch to the Bomba commander: the plan is "received for review", lift and stairs are unselected, and Followed, Changed, Ignored work.
- [ ] Share report: copy, print and mark as shared work.
- [ ] Orange appears only on the incident banner and on urgent unacknowledged items.
- [ ] Every status has a label and an icon, not colour alone. Keyboard focus is visible.
- [ ] Works with no channel messages and with the customer app open beside it.
- [ ] The three demo screens can be walked through in about 90 seconds.

## 11. Time budget this serves (3:00 total, from the brief)

Customer app 0:00 to 0:35, **Command** sign in and trigger 0:35 to 0:45, customer app 0:45 to 1:15, then **Command**: live dashboard and plan 1:15 to 2:00, dispatch and comms 2:00 to 2:35, role switch to Bomba commander 2:35 to 2:45, spoken close 2:45 to 3:00.
