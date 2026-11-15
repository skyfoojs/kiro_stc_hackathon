# Relay Command view (desktop): what the management / firemen side needs

For the teammate building the non-customer side. Read it together with PROJECT_BRIEF.md, which is the source of truth for what the screens contain. This replaces the phone-first COMMAND_VIEW_SPEC.md and MANAGEMENT_SIDE_PROMPT.md (that one is out of date: it still has assistants, wardens and a 3D tower).

**What changed from the phone spec:** Command is now a **desktop view** for the fire command centre screen and the demo laptop or projector. The content, rules, demo data and timings are unchanged. The layout moves from one stacked phone column to a multi-panel desktop screen. The five-line plan stays five lines: it is still the thing teams receive on their phones, so its length rule does not change.

## 1. What it is

One **desktop web view called Command**, used by two people who sit together in the fire command centre (UBBL by-law 238):

- **UOA security** (control room): triggers the incident, sees the live picture, reviews and edits the plan, sends it to teams, keeps teams updated.
- **Bomba incident commander**: sees the same picture, receives the plan **for review only**, decides lift or stairs, and replies Followed, Changed or Ignored.

There is **no separate firemen screen** and no responder app (brief: "Out of scope"). A role switch in the top bar changes which of the two you are, on the same live data.

**The one-line pitch it must prove:** Relay tells you where everyone is, and hands responders a short plan. Bomba decides how many people to send.

## 2. Hard rules (do not break these)

1. **No rescuer headcounts, anywhere (G1, FR16 removed).** Never show or suggest how many firemen, units, engines or vehicles to send. Not in the plan, tiles, tooltips, team table or report. Teams may say when they will arrive and where they are going, in their own words. Relay shows that as reported and never asks for a number.
2. **The plan is advice for review only (FR20).** Wording and buttons say "Send for review", "Followed", "Changed", "Ignored". Never "Approve", "Order" or "Dispatch orders".
3. **Lift or stairs is the Bomba commander's choice (G4).** Show both options. Never pre-select one.
4. **Only Bomba or specialist rescue are named for entering the fire floor or carrying (G5).** The building ERT never is.
5. **The plan is five lines, each about 15 words or fewer (FR17).** It uses floors, stairwells, lifts and team names. It does not name people. Names appear only inside **Details**. On desktop the plan card shows all five lines at once with no scrolling inside the card.
6. **Occupant counts come from live data (G7).** The AI never writes a count. If the AI is unavailable, show the template plan (Section 6) and nothing breaks.
7. **No customer screens.** Those already exist.
8. **No wardens, assistants or buddies** anywhere in copy or data (brief: "Agreed decisions").

## 3. Deliverable

- One self-contained HTML file, `command.html`. Inline CSS and JS, no build step, no backend. All data mocked in a JS object at the top.
- **Desktop-first.** Designed at **1440 x 900**, works from **1280 x 800** (demo laptop and projector) up to 1920 wide. No horizontal scrolling at 1280. Below 1024 px, panels stack into one column so it still works if opened on a tablet, but do not design for phones.
- Hash routing so any screen can be opened directly: `#signin`, `#dashboard`, `#dispatch`, plus backup screens (`#map`, `#teams`, `#log`, `#people`, `#visitors`, `#audit`).
- No remote images. Inline SVG for icons.
- Page title: "Relay – Command".

## 4. Desktop layout system

**App frame (every screen after sign-in):**

```
+--------------------------------------------------------------------------------+
| Top bar: logo badge, "Relay Command" | incident banner (orange) | timer | role |
+------+-------------------------------------------------------------------------+
| Nav  |                                                                         |
| rail |                      Screen content (panels)                            |
|      |                                                                         |
+------+-------------------------------------------------------------------------+
| Status strip: "Updated 4 seconds ago" | offline note | channel: connected/not  |
+--------------------------------------------------------------------------------+
```

- **Top bar** (64 px): logo badge, "Relay Command", then the incident banner filling the middle, elapsed timer, and the **role chip** on the right ("Hasnah Yusof, UOA security" with "Switch to Bomba commander").
- **Left nav rail** (88 px, icon plus text label under each): Dashboard, Dispatch, then a divider and the backup screens. The current screen is marked with a navy bar and bold label, not colour alone.
- **Status strip** (36 px, bottom): refresh label, the offline note, and whether the live link to the customer app is connected.
- **Content grid:** 12 columns, 24 px gutters, 24 px outer padding. Panels are white cards on `--mist` with a 1 px `--line` border and 12 px radius.
- **Projector legibility:** body text 16 px minimum, plan lines 20 px, count numbers 56 px, panel titles 20 px. The most important number on each screen is the largest thing on it.
- **Keyboard first:** everything reachable by Tab in visual order. Shortcuts shown next to their buttons: `1` Dashboard, `2` Dispatch, `R` switch role, `S` Send for review. Dialogs are in-page modals (never `alert()`), trap focus and close on Escape.
- **Hover is never required.** Anything in a tooltip must also be visible on the screen or in Details.

## 5. Visual system (must match the customer app)

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

- **Orange is reserved** for: the live-incident banner, and anything urgent and unacknowledged (a help request no team has acknowledged, an escalation after 60 s). Nothing else is orange.
- Green, amber and red always come with a text label and an icon or shape, never colour alone (WCAG 2.1 AA).
- White text on orange only at 18.66 px bold or larger. Otherwise use navy.
- Font: **Atkinson Hyperlegible Next**, falling back to `"Atkinson Hyperlegible", system-ui, sans-serif`. Tabular figures for counts and times.
- Sentence case. No all-caps labels, no "→" on buttons, no middle-dot meta strings. Buttons say what happens ("Send plan to 6 teams for review", not "Submit").
- Click and touch targets at least 48 px tall (the command centre may use a touch screen). Visible focus: 3 px navy outline, 2 px offset. Respect `prefers-reduced-motion`.
- **Ping, the mascot, appears only as the small logo badge** (about 40 px) in the top bar and on the sign-in card. No full-body Ping, no scenes. Do not use Ping's blue, amber or green for status.

Logo badge, paste as is:

```html
<svg viewBox="20 6 120 158" width="40" height="53"><g><path d="M62 -2L76 50M98 -2L84 50" stroke="#F59E0B" stroke-width="8" fill="none"/><rect x="73" y="44" width="14" height="10" rx="3" fill="#CBD5E1"/></g><g><circle cx="80" cy="100" r="57" fill="none" stroke="#2563EB" stroke-opacity=".22" stroke-width="7"/><circle cx="80" cy="100" r="52" fill="#F8FAFC" stroke="#2563EB" stroke-width="5"/></g><circle cx="80" cy="100" r="45" fill="none" stroke="#E2E8F0" stroke-width="1.5"/><g><rect x="46" y="72" width="68" height="44" rx="22" fill="#1E293B"/><ellipse cx="66" cy="93" rx="5.5" ry="7" fill="#FBBF24"/><ellipse cx="94" cy="93" rx="5.5" ry="7" fill="#FBBF24"/><path d="M71 106q9 7 18 0" fill="none" stroke="#FBBF24" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></g></svg>
```

## 6. The three demo screens (about 90 seconds on screen)

### 6.1 Sign in with role (`#signin`, about 7 s)

- Centred card (480 px wide) on `--mist`: logo badge, "Relay", "Command".
- Two large one-click account tiles side by side:
  - **Hasnah Yusof**, UOA Security, control room.
  - **Captain Razak Ibrahim**, Bomba incident commander (fictional).
- One click goes to the dashboard as that role. Small line under the tiles: "Demo accounts. In real use, each person signs in with their own UOA or Bomba account."
- After sign-in, the role chip in the top bar shows who you are and switches role in one click. The switch keeps the same live data and is written to the incident log ("Now viewing as Bomba commander").

### 6.2 Live dashboard with the plan card (`#dashboard`, about 45 s)

Brief FR11, FR17, FR19. Everything below fits on one 1440 x 900 screen without page scrolling. At 1280 x 800 only the people list may scroll inside its own panel.

```
+-------------------+-----------------------------------------+------------------------+
| Floors            | Level 22 counts                         | Help requests          |
| (tower selector)  | [Waiting 1] [Safe 9] [Unaccounted 3]    | Aisyah Rahman, L22     |
|                   | Building: 1 waiting, 9 safe, 3 unacc.   | waiting 4 min 10 s     |
| L23  0 / 0 / 0    +-----------------------------------------+ Not yet acknowledged   |
| L22  1 / 9 / 3  * | Plan card (five lines)                  +------------------------+
| L21  0 / 0 / 0    | 1. ...                                  | Where people are, L22  |
| L20  staging      | 5. ...                                  | Waiting (1)            |
| ...               | [Send for review]  [Details]  [Edit]    | Unaccounted (3)        |
|                   |                                         | Safe (9), collapsed    |
+-------------------+-----------------------------------------+------------------------+
   3 columns               6 columns                               3 columns
```

1. **Incident banner** (top bar, orange): "Fire, Level 22, UOA Corporate Tower", elapsed timer since 10:41:30. If no incident is live: a calm navy-on-mist state, "No incident. All towers normal.", with a button "Trigger a fire on Level 22" (security only; same as the customer app's demo control, FR6). The commander role sees "No incident" without the button.
2. **Floors panel (left, FR11 "by tower and floor").** Tower selector (the four towers) above a vertical floor list for UOA Corporate Tower, top floor at the top. Each row: floor number and three small counts with icons (waiting, safe, unaccounted). Level 22 is marked "Fire floor" with a flame icon and a navy left border (not orange; orange is the banner). Level 20 is marked "Staging" (fire floor minus 2, G2). Level 23 is marked "Above the fire". Clicking a floor changes the centre and right panels to that floor. Empty floors show "No one on record".
3. **Counts (centre top).** Three large tiles for the selected floor: Waiting for help **1**, Safe **9**, Unaccounted for **3**. Each tile has a label, an icon and its colour. Under them: "Building: 1 waiting, 9 safe, 3 unaccounted". The refresh label "Updated 4 seconds ago" sits in the status strip and refreshes at least every 10 s (brief performance target).
4. **Plan card (centre, Section 7)**, five lines at 20 px. Actions under it: **Send for review** (goes to Dispatch with the plan loaded), **Details** (expands inline under the card), **Edit a line** (security only, FR20). A small label at the card's top right: "AI draft, checked" or "Basic plan" for the template fallback, plus "Version 2, 10:50" when the plan has changed.
5. **Help requests panel (right top, FR9).** One row per help request: name (security only), floor, waiting point, "Sent automatically from her profile", **waiting time as a live timer** (brief: "Risks, show the waiting time on the dashboard"), and acknowledgement status. While no team has acknowledged, the row is orange with "Not yet acknowledged". After 60 s without an acknowledgement it adds "Escalated to control room". When a team acknowledges (a `help.ack` message, or Bomba Pantai's scripted reply on Dispatch), the row turns amber with "Acknowledged by Bomba Pantai, 10:52".
6. **Where people are (right, below).** Compact list for the selected floor: waiting first, then unaccounted (ranked by last seen, G6), then a collapsed "Safe (9)" group. Each row shows status icon and label, last known place and time. Security sees names. The Bomba commander sees "Person waiting, Stairwell B waiting point" and "Unaccounted, last seen 10:12", with names only inside Details (FR21).
7. **Live updating (must be visible, FR19).** About 15 seconds after the incident starts, Amirul Hakim checks in safe at Assembly point A. Counts become Waiting 1, Safe 10, Unaccounted 2. The floor row for L22 updates. The plan's fifth line changes from "3 unaccounted" to "2 unaccounted", and that line is highlighted (`--mist-2` fill and a "Changed 10:50" tag) for about 5 seconds. A line is added to the Dispatch updates log as pending. If a real `checkin` message arrives from the customer app, do the same for that person.

**Editing a line (security, FR20).** "Edit a line" turns one line into a text field. On save, the checker (G7) runs: if the line names a floor, stairwell, lift or team not in the building map or roster, or contains a number of rescuers, it is refused with the reason shown inline ("Level 24 stairwell C is not on the building map"). Saved edits create a new plan version and are written to the incident log.

### 6.3 Dispatch and comms (`#dispatch`, about 35 s)

Brief FR15, FR18, FR22, FR12. Two-panel layout:

```
+------------------------------------------------+-------------------------------+
| Teams (8 columns)                              | Plan being sent (4 columns)   |
| [x] Team            Status        Their words  | Five lines, read-only         |
| [x] Bomba Pantai    Acknowledged  "On the way" | [Send plan to 6 teams for     |
| ...                                            |  review]                      |
|                                                +-------------------------------+
|                                                | Updates sent to teams (log)   |
|                                                | 10:50 Amirul Hakim checked... |
|                                                | [Send update]                 |
|                                                | [Share report with Bomba]     |
+------------------------------------------------+-------------------------------+
```

- **Teams table (left).** Columns: tick box, team, channel (app, SMS fallback), status (label and icon), last update time, "Their words". Rows:
  - Bomba Pantai
  - Bomba Hang Tuah
  - Bomba Seputeh
  - Bomba high-rise rescue
  - Bomba EMRS (ambulance)
  - Building ERT (UOA / THBS JMB)
  - PDRM patrol (included, but marked "Not needed for a fire" and unticked by default)
- There is **no column for staff, units or vehicles**. Do not add one.
- Tick boxes choose which teams get the plan. All Bomba teams and the ERT are ticked by default. Security can add or remove teams (FR20).
- **Plan panel (right top).** The current plan version, read-only, with "Version 2, 10:50". The button names the count of teams ticked: **Send plan to 6 teams for review**. Under the button: "Teams receive this as advice. They may follow, change or ignore it."
- On send, every ticked team goes to Sent, then statuses change on timers (scripted replies, no real network):

| After send | Team | Status | Their words (scripted) |
|---|---|---|---|
| 2 s | Bomba Pantai | Acknowledged | "On the way, about 6 minutes." |
| 4 s | Building ERT | Acknowledged | "At the lobby. Fire lift unlocked and plans ready." |
| 6 s | Bomba Hang Tuah | Acknowledged | "On the way, about 8 minutes." |
| 8 s | Bomba high-rise rescue | Acknowledged | "On the way, about 9 minutes." |
| 10 s | Bomba EMRS | Acknowledged | "Heading to Assembly point A." |
| 12 s | Bomba Seputeh | Acknowledged | "On the way, about 11 minutes." |

- Status words (FR18): Not sent, Sent, Acknowledged, En route, At staging, On floor, Person reached, Done. The demo only reaches Acknowledged. Each status has a text label and an icon.
- Bomba Pantai's acknowledgement also clears the orange on the dashboard's help request row (it is the first team to acknowledge).
- **Updates sent to teams (right, FR22).** A log, newest at the bottom, scrolling inside its panel. Every live change adds a line marked "Pending" or "Sent", for example "10:50 Amirul Hakim checked in safe. Unaccounted on Level 22 is now 2." One click on **Send update** sends every pending change. Counts and floors go to every team; a line notes "Names go only to the team leader assigned to that person" (FR21).
- **Share report with Bomba (FR12).** Opens an in-page modal, 720 px wide, styled like a printed page: the five plan lines at the top, then people still inside by floor with stated need and last known location, then the plan version and the time. Actions: **Copy report** (`navigator.clipboard`, in a click handler), **Print** (black-and-white friendly print stylesheet, hides the app frame), **Mark as shared with Bomba** (adds a line to the log).
- **Offline note** (status strip, always visible): "If data drops, teams get a text summary every 60 seconds."

### 6.4 Bomba commander role (same screens, about 10 s)

After switching to Captain Razak Ibrahim:

- The dashboard has the same layout and live data. The plan card is titled **"Plan received for review"**, with "Sent by Hasnah Yusof, UOA security, 10:51". The Edit and Send buttons are not shown.
- Under line 4 (moving the person waiting), show the two options side by side as unselected choice cards (radio-style, nothing pre-selected):
  - "Fire lift from Level 20"
  - "Stairs"
  - Plus the note: "Your decision. Relay does not choose."
  Choosing one is optional, is shown to security, and is written to the log.
- Three reply buttons under the card: **Followed**, **Changed**, **Ignored**. Replies are optional. Clicking one adds a line to the log, and on the security role the plan card shows "Bomba commander: Changed, 10:53".
- On Dispatch, the commander sees the same teams table read-only (no tick boxes, no send).
- Names: the commander sees names only inside Details, and opening Details writes "Viewed by Bomba commander" to the audit log.

## 7. The plan card (exact content for the demo)

Five lines. Use this text exactly in the demo.

```
Fire, Level 22, UOA Corporate Tower
1. Get in: appliances to the main entrance. Command at the fire command centre.
2. Stage on Level 20. ERT hands over floor plans and lift control.
3. Crews go up Stairwell B. Occupants come down Stairwell A.
4. Bomba rescue: Level 22 waiting point, 1 person, cannot use stairs. Lift or stairs: commander decides.
5. Bomba search: Level 22 then 23, 3 unaccounted. EMRS: assembly point.
```

- Line 5's count follows the live data (3, then 2 after the live update).
- If a `help.cancel` arrives for Aisyah, drop line 4 and renumber; the plan becomes four lines.
- **Details** (expands inline under the card, on desktop it may use the full centre column) shows:
  - The person waiting: **Aisyah Rahman**, Meridian Legal, Level 22, Stairwell B waiting point, requested 10:42, sent automatically from her profile. Need: "Needs help on stairs. Leg injury, temporary, until 30 Nov. Can walk short distances with a crutch. Stairs are not possible right now."
  - The three unaccounted, ranked by last seen: Amirul Hakim (Level 22, 10:12), Lim Wei Jie (Level 22, 09:15), Sarah Chong (no update since sign-in).
  - Both movement options for the commander.
  - The guardrails, one line each: no headcounts; staging two floors below the fire; crews and occupants use different stairwells; lift or stairs is the commander's call; only Bomba or specialist rescue enter the fire floor or carry; search order is a suggestion, Bomba decides; every floor, stairwell, lift, team and count is checked against the map, roster and live data.
  - A line: "Viewing this is logged."
- **Template fallback.** If the plan text is not available, show a generic card built from the building map: way in, staging floor (fire floor minus 2), stairwells, people waiting. A small label says "Basic plan".
- **AI note.** In the demo the five lines are pre-written. If you add an AI call, it may only choose order and wording; counts, floors, stairwells and team names must come from the data, and any line that names something not in the data must be dropped (G7). The AI receives floor, need level and condition category, never names (brief: "AI inputs").

## 8. Demo data (identical to the customer app)

Incident: **Fire on Level 22, UOA Corporate Tower**, triggered at 10:41:30. Towers: Business Suites Tower A (35 storeys above a 5-floor podium), Business Suites Tower B (32 above the podium), UOA Corporate Tower (38 storeys), Vertical Corporate Tower B (40 storeys).

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

Start counts: **1 waiting, 9 safe, 3 unaccounted**. Other floors in the floors panel are empty for the demo. There are no wardens, assistants, or Mei Ling, Arjun or Ravi in the data any more.

Building map points used by the plan (FR5): main entrance (Bomba access point), fire command centre, Stairwell A, Stairwell B, fire lift lobby, Stairwell B waiting point, Assembly point A. The checker treats anything else as unknown.

## 9. Talking to the customer app (optional live link)

If both HTML files are served from the same origin, they sync over `BroadcastChannel('appname-demo')`. The customer app already sends and listens for these. The demo must still run fully on its own with scripted data when no messages arrive. Show "Live link: connected" or "Live link: not connected, running scripted demo" in the status strip.

```js
// Command -> customer (only if Command triggers the incident)
{ type:'incident.start', incident:{ kind:'fire', tower:'UOA Corporate Tower', floor:22, at:'10:41:30' } }
{ type:'incident.end' }

// customer -> Command
{ type:'help.request', person:'Aisyah Rahman', floor:22, where:'Stairwell B waiting point', auto:true, at:'10:42' }
   // auto:true means it was sent automatically from her assistance profile
{ type:'help.cancel',  person:'Aisyah Rahman', floor:22 }
   // she cancelled the automatic request: remove her from Waiting, drop plan line 4
{ type:'help.ack', person:'Aisyah Rahman', by:'UOA security', role:'security', at:'10:42' }
{ type:'help.ack', person:'Aisyah Rahman', by:'Bomba rescue team', role:'rescue', eta:'about 6 minutes', at:'10:42' }
{ type:'checkin', person:'Daniel Ong', status:'safe', place:'Assembly point A', gps:true, at:'10:49' }
```

When a message arrives, update the counts, the floors panel, the help requests panel, the plan card and the updates log. The `incident.start` message arrives from the customer app's demo control, so Command must also switch to the live incident when it receives one. A `help.ack` with `role:'security'` shows "Seen by UOA security" but does not clear the orange; only a `role:'rescue'` acknowledgement does (FR9: a rescue team must acknowledge).

## 10. Backup screens (build only if time allows; not shown in the 3 minutes)

Reached from the nav rail. On desktop each is a single panel or a list plus a detail pane.

- **Building map setup (`#map`, FR5):** per tower and floor, a simple SVG plate with markers for Stairwell A, Stairwell B, the fire lift lobby, the waiting point, the assembly point and the Bomba access point, plus the staging-floor rule (fire floor minus 2). Note: "Evacuation chairs: none installed (recommended)".
- **Team settings (`#teams`, FR15):** the list of teams, contact channel, availability. No staff counts.
- **Incident log and timeline (`#log`, FR14):** every event, newest last, with filters (type, floor, role). Include plan versions, edits, sends, acknowledgements, commander replies and the lift or stairs choice.
- **People and profiles (`#people`, FR2, FR3):** searchable by tenant; assistance level (Yes / Sometimes / No), temporary condition with expiry. "Remove profile" only when the person has left the company. Note: "Consent withdrawal handling pending legal review (PDPA)."
- **Visitors (`#visitors`, FR13):** visitors checked in by QR today, with status during the incident.
- **Audit log (`#audit`):** who viewed whose details, when, and in which role. Opening a person's details anywhere writes an entry here.

## 11. Acceptance checklist

- [ ] Opens straight to `#signin`, and each hash route opens directly.
- [ ] At 1280 x 800 and 1440 x 900 there is no horizontal scroll and the dashboard needs no page scroll.
- [ ] Sign in as Hasnah, trigger the fire, and see 1 waiting, 9 safe, 3 unaccounted.
- [ ] The plan card shows exactly five lines with no scrolling inside the card.
- [ ] The help request row is orange until a rescue team acknowledges, with a live waiting timer.
- [ ] About 15 s after the incident starts, the counts change to 1 / 10 / 2, the L22 floor row updates and line 5 is highlighted.
- [ ] Editing a line that names something not on the map is refused with a reason; a valid edit makes a new version and is logged.
- [ ] Send for review sends to the ticked teams and six scripted replies arrive over about 12 s.
- [ ] Search the whole file: no headcount of rescuers, no "approve", and no mention of wardens or assistants.
- [ ] Switch to the Bomba commander: the plan is "received for review", lift and stairs are unselected, Followed, Changed, Ignored work, and names appear only in Details.
- [ ] Share report: copy, print and mark as shared work.
- [ ] Orange appears only on the incident banner and on urgent unacknowledged items.
- [ ] Every status has a label and an icon, not colour alone. Keyboard focus is visible and Tab order follows the layout.
- [ ] Works with no channel messages and with the customer app open beside it.
- [ ] The three demo screens can be walked through in about 90 seconds.

## 12. Time budget this serves (3:00 total, from the brief)

Customer app 0:00 to 1:08, then **Command**: sign in 1:08 to 1:15, live dashboard and plan 1:15 to 2:00, dispatch and comms 2:00 to 2:35, role switch to Bomba commander 2:35 to 2:45, spoken close 2:45 to 3:00.

**Demo tip for desktop:** record the customer app in a phone-sized browser window and Command full screen, or show them side by side (customer at 390 px on the left, Command at 1280 px on the right) so the live link is visible when Amirul checks in.
