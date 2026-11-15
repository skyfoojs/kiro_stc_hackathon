# Relay: Office Disaster Recovery App

Mascot: **Ping**. (This brief was called "AppName" in earlier versions.)

## Overview

Relay helps occupants of large offices and high-rise buildings evacuate safely during emergencies such as fires, power outages, earthquakes and security threats. Its main purpose is to make sure people who cannot use stairs quickly (OKU, elderly staff, people with injuries or temporary conditions) are never left behind or unaccounted for.

Relay is a **building-level system operated by the building owner/manager (UOA Group)**, not a per-company tool. It replaces manual roll calls with live, floor-level accountability and supports, but does not replace, existing procedures: Bomba, the building's fire command centre and the building emergency plan.

**Positioning: Relay tells you where everyone is, and hands responders a short plan.** Bomba and the other teams decide how many people to send, by their own protocol. What they lack on arrival is the picture: who is waiting, on which floor, and the way in. Relay gives management that picture, drafts a five-line plan that fits one phone screen, and lets management send it to several response teams from one screen.

In this brief, **management** means whoever uses the **Command view**: UOA security and the Bomba commander, on the same phone-first screen.

### Problem

- Standard high-rise evacuation assumes everyone can walk down many flights of stairs.
- Headcounts at assembly points are manual, slow and error-prone. Responders often don't know who is still inside, or on which floor.
- Phone GPS can't reliably tell which floor someone is on indoors, but works well outdoors.
- In a multi-tenant building, each tenant counts its own people, so no one has the whole picture.
- Responders usually arrive without knowing who is waiting for help, on which floor, or which stairwell and lift to use, so commanders spend the first minutes finding out.
- A Bomba state director said in 2019 that Bomba cannot fight a fire from outside above roughly the 16th floor, because no ladder reaches that high. High-rise operations are run from inside, so the way into the building and the order of work matter.

### Solution summary

1. Staff create a quick self-declared profile (no medical proof) saying whether they may need help on stairs.
2. When an incident is declared, everyone receives guidance suited to the event (evacuate, shelter or lockdown).
3. People who cannot use stairs quickly can request help and mark where they are waiting.
4. Management sees a live picture of where everyone is: safe, waiting for help, or unaccounted for.
5. **AI drafts a short response plan** (five lines, one phone screen): how to get into the building, where to stage, which team goes to which floor, and in what order. It never says how many rescuers or units to send; that is Bomba's protocol.
6. **Management generates the plan and sends it to several response teams at once** (Bomba, specialist rescue, medical, building emergency team, police) **for review only**. Teams may follow it, change it or ignore it; the Bomba commander runs the response. Management sees each team's acknowledgement and progress.
7. **Management keeps a constantly updating live dashboard** (who is where, who is safe, who is waiting, who is unaccounted for) and keeps the teams on the line updated from it.
7. People confirm they are safe by a manual check-in at the assembly point outside the building (optionally assisted by GPS, which works outdoors). Every check-in updates the plan.

---

## Agreed decisions

- **Data ownership:** UOA management stores the user data.
- **Profile:** self-declared, no medical verification. It asks about functional need ("would you need help on stairs?"), not age, because age is a poor proxy (a 55-year-old may struggle where a 62-year-old does not).
- **Scope:** both Business Suites (Tower A & B) and Corporate Towers, as a building-level system.
- **Safe-zone check-in:** the person taps to check in at the outdoor assembly point, and GPS confirms the position automatically.
- **No wardens or buddy assistants (new).** Floor wardens and pre-assigned assistants are removed from the product. Rescue and search are done by Bomba and other response teams dispatched by management. Tenant HR/admin only invite staff.
- **AI is decision support (new).** AI drafts the short plan. A checker verifies it against the building map, roster and live counts, and a person in the control room reviews it before it is sent. The plan is **advice for review only**: responders are never required to follow it.
- **One Command view, no separate firemen screen (new).** UOA security and the Bomba commander use the same phone-first screen, as they sit together in the fire command centre. It is the only non-customer view in the demo.
- **Relay does not size the response (new).** It never recommends how many rescuers, units or vehicles to send. Each team decides that by its own protocol and reports back what it is sending.

---

## Pilot site: Bangsar South, The Vertical

The concept was tested against the four towers of The Vertical. The two building types need different handling.

| | **Business Suites Tower A & B** | **Corporate Towers (UOA Corporate Tower, Vertical Corporate Tower B)** |
|---|---|---|
| Height | 35 and 32 storeys above a 5-floor podium | 38 and 40 storeys |
| Occupancy | 420 and 250 strata units; mostly small firms (units about 700 to 2,659 sq ft, roughly 5 to 25 staff) | Large tenants (multinationals, banks, law firms); floor plates about 18,000 sq ft |
| Staff database | None shared. Hundreds of separate tenants | Per-company databases, but still many companies per tower |
| Other occupants | Podium retail, medical facilities, hotel guests | Visitors; lobby turnstile and 24-hour security |
| Fit | Only works as a building-wide, opt-in system run by UOA | Better fit: larger tenants, easier onboarding, access-control data may help |

### Current-state gaps reported by the project team

- Bomba (firefighter) lifts are present.
- No evacuation chairs.
- No existing register of people who need assistance.
- Drills are sudden, with a manual check-in at the outside safe zone.
- No refuge areas or evacuation lifts. Stairs are the only route for occupants.

**Implication:** with stairs as the only route and no chairs, the app can show who needs help and where, but it cannot move anyone. The plan assumes Bomba and specialist rescue teams bring their own carry devices. Pair the app with a small physical package: evacuation chairs at stairwells, a trained building emergency team, and an agreed waiting point.

---

## Stakeholders

| Stakeholder | Role / interest |
|---|---|
| **UOA Group (building owner/manager)** | Operates the platform, stores the user data (data controller under PDPA), owns the emergency plan and the incident dashboard. |
| **THBS JMB / property management** | Already runs safety programmes at Bangsar South (e.g. AED stations, CPR classes). Natural champion and day-to-day operator. Runs the building emergency team. |
| **Tenant companies (HR / admin)** | Invite staff to sign up and remove profiles when staff leave. |
| **Staff needing assistance** | Primary users. Need a fast, private way to say they need help and where they are, while keeping independence. |
| **General staff** | Use the app for guidance and check-in. |
| **UOA security / control room** | Uses the Command view. Triggers incidents, reviews the AI plan, sends it to teams. |
| **Bomba incident commander** | Uses the same Command view with a different role. Reviews the plan, owns the response, fire attack and the decision to use fire lifts or stairs. Works from the fire command centre. |
| **Bomba crews and specialist rescue** | Receive the plan (floor, task, waiting point), search and carry. |
| **Medical (Bomba EMRS / ambulance)** | Treat and transport at the assembly point. |
| **Building emergency team (ERT)** | In-house security and fire safety staff. Lobby control, lift and stair access, staging, guiding crews. Never enter the fire floor. |
| **Police (PDRM)** | Security-threat incidents; crowd control at the assembly point. |
| **Visitors, podium tenants, hotel guests** | Not employed in the towers, but present. Need a lightweight check-in. |
| **IT / security** | Integrate with lobby access control and keep the data secure. |

---

## Response teams

Management can message and dispatch these teams from one screen. **Relay never recommends how many people or units to send.** Response strength is each team's own protocol (Bomba's operating procedures), not something Relay can know or should set. Relay gives each team what it needs to know, and shows management what each team reports back.

| Team | What it does in Relay | Who decides how many to send |
|---|---|---|
| **Bomba fire rescue** (Pantai, Hang Tuah, Seputeh stations) | Fire attack, search, occupant rescue | Bomba |
| **Bomba high-rise / specialist rescue** (MUST, STORM) | Assisted evacuation and technical rescue | Bomba |
| **Bomba EMRS / ambulance** | Medical care at the assembly point | Bomba |
| **Bomba incident commander** | Command post in the fire command centre. Reviews the plan and decides lift versus stairs | Bomba |
| **Building emergency team (ERT)** | Lobby control, fire lift and stair access, staging, guiding crews, staying with waiting people on floors that are not the fire floor. Never enters the fire floor and never carries | UOA / THBS JMB |
| **Police (PDRM)** | Security-threat incidents, crowd control at the assembly point | PDRM |

**What teams report back.** When a team acknowledges, it states in its own words what it is sending and when it expects to arrive (for example, "Pantai: on the way, 6 minutes"). Relay shows this as reported. It never asks for a number and never suggests one.

**Response times.** Bomba's national average response was 8 min 45 s in 2025, with 67.5% of calls reached within 10 minutes. People who cannot use stairs may wait that long. See "Risks" below.

### Demo roster (names only, replies scripted)

Bomba Pantai, Bomba Hang Tuah, Bomba Seputeh, Bomba high-rise rescue team, Bomba EMRS, Bomba incident commander, Building ERT (UOA / THBS JMB), PDRM patrol.

---

## Response plan (short, built for the phone)

### What it does

For the live incident, the AI planner produces two things and keeps them current:

1. **Where everyone is.** A picture by floor: people waiting for help (with stated need and waiting point), people confirmed safe, and unaccounted people ranked by how recent their last known location is.
2. **A short response plan.** How to get into the building, where to stage, which team goes to which floor, how the person waiting could be moved, and in what order. **It never says how many rescuers or units to send.**

### Format rule: one phone screen

- Five numbered lines at most, each about 15 words or fewer. No scrolling, no tables.
- It sits as a card on the **live dashboard** in the mobile view, with one **Send for review** button and a **Details** link that opens the people list.
- The same five lines open the report shared with Bomba.
- The plan uses floors, stairwells, lifts, team names and need type. It names a person only inside Details, and only for dispatched team leaders (FR21).

### Inputs

- Incident type, tower and floor, and time since trigger.
- Per floor: counts and status of occupants, last known location and time of each unaccounted person.
- For each person waiting: assistance level (Yes / Sometimes), temporary condition, note, floor, waiting point. The planner works on floor and need level, not names.
- Building map: stairwells, fire (Bomba) lifts, lift lobbies, waiting points, assembly point, Bomba access point.
- Response roster: which teams exist and whether each is available.
- Constraints: fire lift in service, stairwell blocked, incident commander decisions.

### Plan guardrails (shown in Details)

| # | Rule | Basis |
|---|---|---|
| G1 | No headcounts. The plan never states how many rescuers, units or vehicles to send. | Response strength is Bomba's protocol. |
| G2 | Stage **two floors below** the fire floor. | Standard high-rise practice; fire services stage two floors below and assign a lift-control firefighter. |
| G3 | Crews use one stairwell going up, occupants another going down. | Avoids head-on meetings in the stairs. Demo assumption. |
| G4 | **Lift or stairs for moving a person is the commander's call.** The plan shows both options and never picks. | Fire-service sources disagree on using lifts near a fire. UBBL requires a fire lift where the top occupied floor is over 18 m. |
| G5 | Only Bomba or specialist rescue are assigned to enter the fire floor or carry. The building ERT never does. | Safety rule. |
| G6 | Unaccounted people are listed by last-known-location recency. Search order is a suggestion; Bomba decides. | Fire-service practice searches the fire area first, then the floor above. |
| G7 | A checker confirms every floor, stairwell, lift and team named in the plan exists in the building map and roster, and that the occupant counts match the live data. | Stops the AI inventing places or numbers. |

### How the pieces fit

```
Live status (check-ins, help requests, team replies)
        |
        v
  AI planner drafts the five lines  -->  checker (G1 to G7)
        |
        v
  Plan card on the live dashboard (mobile)
        |
        v
  Control room reviews / edits  -->  send to teams FOR REVIEW  -->  replies
        |                                                |
        +--------- update the plan on every change <-----+
```

- The occupant counts come straight from live data and are never written by the AI. The AI chooses the order, picks wording and explains in Details.
- If the AI service is unavailable, the checker's template still produces a basic plan from the building map (way in, staging floor, people waiting).

### Worked example: fire on Level 22, UOA Corporate Tower

Live picture on Level 22: **1 waiting for help (leg injury, cannot use stairs), 9 safe, 3 unaccounted.**

The plan card, as the commander sees it on the phone:

```
Fire, Level 22, UOA Corporate Tower
1. Get in: appliances to the main entrance. Command at the fire command centre.
2. Stage on Level 20. ERT hands over floor plans and lift control.
3. Crews go up Stairwell B. Occupants come down Stairwell A.
4. Bomba rescue: Level 22 waiting point, 1 person, cannot use stairs. Lift or stairs: commander decides.
5. Bomba search: Level 22 then 23, 3 unaccounted. EMRS: assembly point.
```

**Details** lists the person waiting (with name for dispatched leaders only), the three unaccounted people ranked by last-seen time (Amirul Hakim 10:12, Lim Wei Jie 09:15, Sarah Chong with no update since sign-in), and both movement options for the commander.

Each check-in removes a person from the unaccounted list, and the plan updates.

---

## Requirements

### Functional

**Profiles**
- FR1: Sign-up through the tenant company or lobby QR code, linked to a tower and floor. **Demo:** pre-made demo accounts with one-tap quick login (staff, staff needing help, UOA admin).
- FR2: Self-declared assistance profile with no medical proof or age checks. Use a plain question such as "Would you need help on stairs in an emergency? Yes / Sometimes / No", with an optional note and a temporary-condition flag (e.g. injury, pregnancy). Age alone is not a reliable signal.
- FR3: Each person can edit their profile at any time. A profile can only be deleted once the person has left the company and no longer works there (done by the tenant admin or UOA).
- FR4: **Removed.** Assistant and warden assignment no longer exists. (The number is kept so other documents still match.)
- FR5: Map stairwells, Bomba lift lobbies, waiting points, chairs, assembly points, the Bomba access point and the staging-floor rule per tower. The AI planner reads this map.

**During an emergency**
- FR6: UOA or security triggers an incident and picks its type (fire, earthquake, outage, security threat).
- FR7: Push guidance for that incident type (evacuate via stairs, wait at a designated point, or shelter in place).
- FR8: "I need help" and "I'm safe" buttons. **Location is found automatically by the phone:** GPS finds the tower and the barometer works out the floor from air pressure (about 86 m up means Level 22). The person is not asked where they are; a small link lets them correct the floor. **Who has to tap:** a person whose profile says they need help on stairs (Yes, or Sometimes with a temporary condition) has their help request **sent automatically** when an incident is declared. They see "Help request sent" with a 10-second Cancel and can add a note or move their waiting point. A **standard user must tap "I need help" manually**; nothing is sent for them otherwise.
- FR9: **Changed.** A help request (automatic for people with an assistance profile, manual for everyone else) alerts management at once and appears in the live plan. The assigned rescue team is pinged, and the request escalates to the control room if no team acknowledges within 60 seconds.
- FR10: Check-in at the outdoor assembly point. **GPS runs automatically** (no toggle) and confirms the person is within about 12 m of the point before the check-in button turns on. If there is no signal, the check-in is saved with the last position and sent later.
- FR11: **Changed.** Live dashboard by tower and floor: safe, waiting for help, unaccounted for, with last known location and time, plus the **plan card** (FR17) and each team's reported status.
- FR12: Share an incident report with Bomba (remaining occupants, floor, stated needs, and the plan as sent).
- FR13: Visitor and guest check-in by QR code, without an account.
- FR15: **Response team directory.** Management keeps a roster of teams (Bomba fire rescue, specialist rescue, EMRS/ambulance, building ERT, police) with contact channel and availability. No staff counts.
- FR16: **Removed.** Relay does not estimate or recommend how many rescuers or units to send. (The number is kept so other documents still match.)
- FR17: **Short AI response plan.** Five lines or fewer, one phone screen, shown as a card on the live dashboard and at the top of the Bomba report. It covers the way in, the staging floor, which team goes to which floor, movement options for each person waiting (the commander chooses), and the order. No headcounts.
- FR18: **Dispatch and two-way communication with multiple teams.** Send the plan to several teams at once, marked **for review only**. See each team's status (sent, acknowledged, en route, at staging, on floor, person reached, done) and what each team reports it is sending. Send updates and receive messages. SMS or radio-style fallback if the data connection drops.
- FR19: **Live re-planning.** When a check-in, help request or team status changes, the plan updates within about 10 seconds, with the changed line highlighted.
- FR20: **Review, not approval.** Management (security or the control room) generates the plan and checks it before sending. They can edit any line and add or remove teams from the send list. Every team receives it as **advice for review**, with a **Followed / Changed / Ignored** reply that is optional. Nothing the plan says is binding, and the Bomba commander can override any line. Every edit and reply is logged.
- FR22: **Live updates to teams.** The management dashboard updates continuously, and management sends updates to the teams on the line from it (a new check-in, a person reached, a change to the plan). Counts and floors go to every team; names go only to the team leader assigned to that person (FR21). Fallback: an SMS summary every 60 seconds if the data connection drops. **Demo: management side only; there is no separate responder screen.**
- FR23: **Office roll on the check-in confirmation.** After checking in, the person sees "You're safe!" with when and where they checked in, then who else from **their own company** has checked in and who has not yet (names and a here / not yet status only, never help-request or health details). It helps them tell security if a colleague is missing.
- FR24: **Report an emergency.** Anyone, signed in or not, can report an emergency from Home or the first screen. They pick what is happening (fire or smoke, someone hurt or ill, security threat, something else), the phone adds the location by itself (GPS for the tower, barometer for the floor), and the report goes to the security control room, who decide whether to start an incident. The confirmation reminds the person to call 999 (994 for a fire) if they are in danger. Relay never replaces calling the emergency number.
- FR21: **Limited data for responders.** A team leader sees only the assigned person's name, location, need and note, for the task assigned. Every view is logged.

**After an emergency**
- FR14: Incident log and timeline for review, including plan versions, dispatches, acknowledgements and commander edits.

### Non-functional

- **Privacy and compliance:** UOA is the data controller under the Personal Data Protection Act 2010 as amended in 2024. Information about a person's physical or mental health is sensitive personal data and needs explicit consent. A self-declared "may need help on stairs" answer is health-related, so treat it as sensitive. Collect only what is needed, give a clear notice, and have legal review before launch. The consent notice must name emergency responders, not assistants or wardens. Note: limiting deletion to people who have left the company (FR3) may clash with a person's right to withdraw consent, so confirm this with legal before real use.
- **AI inputs:** the planner receives floor, need level and condition category, not names. Names are shown only to dispatched team leaders (FR21). If the AI model is hosted outside Malaysia, check PDPA cross-border transfer rules with legal.
- **AI governance:** a checker verifies every floor, stairwell, lift, team and occupant count in the plan (G1 to G7). A person reviews before sending, and responders receive the plan as advice only (FR20). If the AI is down, a template plan from the building map still works.
- **Access control:** profile details visible only to dispatched team leaders and management during an incident. Audit log of every view.
- **Reliability:** work with poor connectivity. Cache floor plans and guidance offline, queue check-ins, and offer an SMS fallback. Dispatch to teams also has an SMS or radio-style fallback.
- **Accessibility:** WCAG 2.1 AA, screen-reader support, large touch targets, vibration and flashing alerts for deaf users, one-handed use.
- **Performance:** alerts delivered within about 5 seconds; dashboard refresh at least every 10 seconds; plan drafted within about 10 seconds of the trigger and updated within about 10 seconds of a change (targets chosen by the team, not from a standard).
- **Battery:** location sensing only during an incident or drill.
- **Safety:** the app must never tell untrained staff to carry people or move against the evacuation flow. Only Bomba or specialist rescue are assigned to carry or to enter the fire floor. The building ERT is limited to non-hazard tasks.

### Out of scope (hackathon MVP)

- Integration with the fire alarm panel (simulate with an admin trigger).
- Real indoor positioning hardware (simulate with QR codes).
- Procurement of evacuation chairs and refuge areas (recommend, but not build).
- Real integration with Bomba dispatch or radio. The roster, acknowledgements and progress are simulated, and the team's own reply is scripted.
- Any responder-facing screen or app. In the demo, everything happens in the Command view, and team replies are simulated there.
- Control of real fire lifts.
- Estimating or recommending how many rescuers or units to send. That is Bomba's protocol.
- Training or tuning an AI model. The demo uses the guardrails above with an AI layer for route order, priorities and wording.

---

## Risks

- **Gap before Bomba arrives.** Without wardens or buddies, no one is assigned to stay with a person waiting for help until a crew reaches them (national average 8 min 45 s). Mitigation: dispatch the building ERT first to non-hazard waiting points to stay with them, without carrying. Show the waiting time on the dashboard.
- **Assumed conventions.** The one-stairwell-up, one-down rule (G3) and the building ERT's task list are demo assumptions. Validate them with Bomba and THBS JMB before real use.
- **Lift versus stairs.** Fire-service guidance differs on lift use near a fire. The incident commander decides; Relay shows both options.
- **AI trust.** A wrong floor or stairwell in a rescue plan is serious. The checker, the short format that is easy to read at a glance, and the fact that responders only review it, exist for that reason.
- **Consent wording.** Sharing health-related answers with responders needs clear consent. Legal review is required.

---

## Open questions (demo assumptions)

| # | Question | Demo answer |
|---|---|---|
| 1 | Are there refuge areas or evacuation lifts, and where do people who can't use stairs wait today? | No. None today; stairs are the only route. |
| 2 | Would UOA fund evacuation chairs alongside the app? | No (out of scope for the demo). The plan assumes Bomba bring their own carry devices. |
| 3 | Does the lobby access system keep entry logs that could feed the headcount? | No (not used in the demo). |
| 4 | Is there a data protection owner at UOA? | Yes, on the UOA side; no further detail needed for the demo. |
| 5 | Will UOA run drills that include the app? | No (no drill mode in the demo). |
| 6 | Will Bomba receive the plan and report back what it is sending through the platform? | Simulated roster and scripted replies. |
| 7 | Will the Bomba commander allow fire lifts to take people down from the staging floor? | Yes, if the commander chooses. The plan shows both options. |
| 8 | Which tasks is the building emergency team trained and allowed to do (lobby control, lift access, staging, staying with waiting people)? | Those four, assumed. Confirm with THBS JMB. |

---

## MVP demo (3 minutes)

### Flow

0. Landing, then one-tap demo login as the staff member who needs help.
1. Staff member sets her profile (leg injury, needs help on stairs).
2. **Command, signed in as UOA security**, triggers "Fire on Level 22, UOA Corporate Tower". The alert reaches every staff phone.
3. The full-screen alert appears. Her help request **sends itself** because her profile says she needs help on stairs, and she **skips the guidance page entirely**: the request-sent and help-on-the-way screens follow. (A standard user sees the guidance page, which shows a 3D plan of the floor built in Blender, and taps "I need help" manually or "I'm leaving".)
4. **Back on Command.** The live dashboard shows where everyone is on Level 22: one waiting for help, nine confirmed safe, three unaccounted for. Below it, the **five-line plan card** shows the way in, the staging floor and which team goes where.
5. Security sends the plan to several teams **for review only**. Teams reply and state what they are sending. Updates keep going out as check-ins arrive.
6. **Switch role to Bomba commander** on the same screen: the commander sees the same picture and the plan as received, and replies Followed, Changed or Ignored.

### Time budget (total 3:00)

| Time | Side | Screen | What to show |
|---|---|---|---|
| 0:00 to 0:15 | Customer | Landing | Spoken: Relay tells you where everyone is and hands responders a short plan. Bomba decides how many to send. |
| 0:15 to 0:20 | Customer | Demo login | One tap as the staff member who needs help. |
| 0:20 to 0:35 | Customer | Assistance profile | "Would you need help on stairs?" Yes, leg injury. |
| 0:35 to 0:45 | Command | Sign in and trigger | UOA security signs in and triggers the fire on Level 22. |
| 0:45 to 0:53 | Customer | Incident alert | Centred, urgent full-screen alert with siren. The demo user's help request sends itself. |
| 0:53 to 1:01 | Customer | Help request sent | Skips the guidance page. The barometer needle climbs to 86 m and settles on Level 22; GPS confirms the tower. The screen moves on by itself. |
| 1:01 to 1:15 | Customer | Help on the way | Heading counts down ("Bomba are 6 min away"); a cut-through tower shows Bomba arriving and reaching staging on Level 20 (demo time sped up). Mention the guidance page and manual button for standard users. |
| 1:15 to 2:00 | Command | **Live dashboard with plan card** (mobile) | Where everyone is (L22: 1 waiting, 9 safe, 3 unaccounted), then the five-line plan. |
| 2:00 to 2:35 | Command | **Dispatch and comms** (mobile) | Send for review to several teams, replies arrive, updates go out, share the report with Bomba. |
| 2:35 to 2:45 | Command | Role switch: Bomba commander | Same screen. The plan arrives as advice, with Followed, Changed, Ignored. |
| 2:45 to 3:00 | Spoken | | Close: with chairs and a trained building team, this becomes a full plan. PDPA consent. |

Check: 15 + 5 + 15 + 10 + 8 + 8 + 14 + 45 + 35 + 10 + 15 = 180 seconds.

### Pages

**Customer (show 6):** Landing, Demo login, Assistance profile, Incident alert, Help request sent, Help on the way. **Optional flash:** Guidance and actions (standard users only; skipped for people with an assistance profile), Check in as safe, Checked in.

**Command (show 3, all usable on a phone):** Sign in with role (UOA security or Bomba commander) and trigger the incident, **Live dashboard with the response plan card**, **Dispatch and comms** (includes the Bomba report). The Bomba commander sees the same two screens, with the plan marked as received.

**Customer, backup for Q&A:** Report an emergency, Report sent, Sign up, Privacy and consent, Home, Floor map, Your profile, Check in as safe, Checked in, All clear, Visitor check-in, Visitor during incident.

**Command, backup for Q&A:** Building map setup, Team settings (roster and contact channels, no staff counts), Incident log and timeline, People and profiles, Visitors, Audit log.

**Removed:** Your support team (FR4), Help request received (assistant), Assistant on the way, Floor sweep (warden), the separate AI response plan page (now a card on the live dashboard), and a separate firemen view (merged into Command).

### What changes in the build

- **Customer prototype (done):** the four removed screens are gone, help requests send themselves for people with an assistance profile, and the copy names rescue teams.
- **Command (new, to build):** one phone-first view for UOA security and the Bomba commander, with a role switch. Screens: sign in with role, live dashboard with the five-line plan card (Send for review, Details), and Dispatch and comms. It listens for the customer prototype's messages (incident start, help request, help cancel, check-in). No rescuer headcounts anywhere: no staffing estimate, no sizing rules, no "staff requested versus available".

---

## Sources

Malaysia
- Bomba response: 67.5% within 10 minutes, national average 8 min 45 s (The Star, Jan 2026): https://www.thestar.com.my/news/nation/2026/01/30/bomba-saved-over-rm65bil-worth-of-property-last-year-says-dg
- STORM, 481 firefighters: https://en.wikipedia.org/wiki/Special_Tactical_Operation_and_Rescue_Team_of_Malaysia
- MUST, 620 firefighters, covers high-rise rescue: https://en.wikipedia.org/wiki/FRDM_Multi-Skill_Team
- Fire lifts under UBBL by-law 243: https://ipm.my/fire-lift-requirements-design-and-functions/
- Fire command centre, UBBL by-law 238: https://ipm.my/wp-content/uploads/2025/11/Automatic-Fire-Detection-and-Alarm-System-in-Malaysia.pdf
- In-house emergency response team and 16th-floor ladder limit (Sarawak fire chief, DayakDaily, 2019): https://dayakdaily.com/state-fire-chief-on-fire-protection-of-high-rise-buildings
- Planned fire safety organisation and FER team requirement (Borneo Post, 2018; confirm whether in force): https://www.pressreader.com/malaysia/the-borneo-post/20181212/281861529591363

International benchmarks
- Staging two floors below the fire (Fire Engineering): https://www.fireengineering.com/firefighting/improper-staging-can-set-a-high-rise-operation-up-for-failure/
- Lift control firefighter, staging two floors below (FCABC): https://fcabc.com/wp-content/uploads/2019/09/FCABC-SOG-205-Medical-Evalution-for-Emergency-Workers.docx.pdf
- Search the fire area, then the floor above (Firehouse): https://www.firehouse.com/operations-training/article/10497349/back-to-basics-structural-search-and-rescue

---

## Change log (from the previous brief)

- Renamed to Relay.
- Removed floor wardens and assistants (FR4 removed; FR9 changed; stakeholder rows and demo accounts removed).
- Added response teams, the AI response plan, and FR15 to FR22.
- **Latest:** people with an assistance profile have help requested automatically; standard users tap manually (FR8, FR9). The plan is generated by management and sent to teams for review only (FR20). Management keeps the teams on the line updated from the live dashboard, with no responder screen (FR22).
- **Latest:** removed every rescuer headcount (FR16 removed, staff per unit, sizing rules, 17 and 76 examples). Response strength is Bomba's protocol; teams report back what they send.
- **Latest:** management and firemen are merged into one Command view (UOA security and Bomba commander, role switch). The demo has 3 Command screens, the incident is triggered by the demo control, and the time budget still totals 3:00.
- The plan is now five lines on one phone screen, shown as a card on the live dashboard. The separate AI plan page is gone and the demo timings were redone to total 3:00.
- Changed FR11, FR12, FR14 and the access control, privacy, reliability, performance and safety requirements.
- Added a risks section and open questions.
