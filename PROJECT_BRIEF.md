# AppName: Office Disaster Recovery App

## Overview

AppName helps occupants of large offices and high-rise buildings evacuate safely during emergencies such as fires, power outages, earthquakes and security threats. Its main purpose is to make sure people who cannot use stairs quickly (OKU, elderly staff, people with injuries or temporary conditions) are never left behind or unaccounted for.

The app is a **building-level system operated by the building owner/manager (UOA Group)**, not a per-company tool. It replaces manual roll calls with live, floor-level accountability and supports, but does not replace, existing procedures: fire wardens, Bomba, and a building emergency plan.

### Problem

- Standard high-rise evacuation assumes everyone can walk down many flights of stairs.
- Headcounts at assembly points are manual, slow and error-prone. Responders often don't know who is still inside, or on which floor.
- Phone GPS can't reliably tell which floor someone is on indoors, but works well outdoors.
- In a multi-tenant building, each tenant counts its own people, so no one has the whole picture.

### Solution summary

1. Staff create a quick self-declared profile (no medical proof) saying whether they may need help on stairs.
2. When an incident is declared, everyone receives guidance suited to the event (evacuate, shelter or lockdown).
3. People who cannot use stairs quickly can request help and mark where they are waiting.
4. Pre-assigned, trained assistants and floor wardens are alerted. The app does not broadcast to whole floors.
5. People confirm they are safe by a manual check-in at the assembly point outside the building (optionally assisted by GPS, which works outdoors).
6. UOA management and fire command see a live dashboard of who is confirmed safe, who is waiting for help, and who is unaccounted for.

---

## Agreed decisions

- **Data ownership:** UOA management stores the user data.
- **Profile:** self-declared, no medical verification. It asks about functional need ("would you need help on stairs?"), not age, because age is a poor proxy (a 55-year-old may struggle where a 62-year-old does not).
- **Scope:** both Business Suites (Tower A & B) and Corporate Towers, as a building-level system.
- **Safe-zone check-in:** manual, at the outdoor assembly point.

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

**Implication:** with stairs as the only route and no chairs, the app can show who needs help and where, but it cannot move anyone. Pair the app with a small physical package: evacuation chairs at stairwells, trained assistants, and an agreed waiting point.

---

## Stakeholders

| Stakeholder | Role / interest |
|---|---|
| **UOA Group (building owner/manager)** | Operates the platform, stores the user data (data controller under PDPA), owns the emergency plan and the incident dashboard. |
| **THBS JMB / property management** | Already runs safety programmes at Bangsar South (e.g. AED stations, CPR classes). Natural champion and day-to-day operator. |
| **Tenant companies (HR / admin)** | Invite staff to sign up, nominate floor wardens and assistants, join drills. |
| **Staff needing assistance** | Primary users. Need a fast, private way to say they need help and where they are, while keeping independence. |
| **General staff** | Use the app for guidance and check-in. Some volunteer as trained assistants. |
| **Floor wardens / marshals** | Sweep floors, confirm who is waiting, report to the control room. |
| **Visitors, podium tenants, hotel guests** | Not employed in the towers, but present. Need a lightweight check-in. |
| **Bomba / emergency services** | Receive an accurate list of who is still inside, by floor, and their stated needs. |
| **IT / security** | Integrate with lobby access control and keep the data secure. |

---

## Requirements

### Functional

**Profiles**
- FR1: Sign-up through the tenant company or lobby QR code, linked to a tower and floor. **Demo:** pre-made demo accounts with one-tap quick login (staff, staff needing help, assistant, floor warden, UOA admin).
- FR2: Self-declared assistance profile with no medical proof or age checks. Use a plain question such as "Would you need help on stairs in an emergency? Yes / Sometimes / No", with an optional note and a temporary-condition flag (e.g. injury, pregnancy). Age alone is not a reliable signal.
- FR3: Each person can edit their profile at any time. A profile can only be deleted once the person has left the company and no longer works there (done by the tenant admin or UOA).
- FR4: Assign at least two trained assistants and a floor warden to each person who may need help. This screen is only shown to users who declared in FR2 that they require assistance.
- FR5: Map stairwells, Bomba lift lobbies, waiting points, chairs and assembly points per tower.

**During an emergency**
- FR6: UOA or security triggers an incident and picks its type (fire, earthquake, outage, security threat).
- FR7: Push guidance for that incident type (evacuate via stairs, wait at a designated point, or shelter in place).
- FR8: "I need help" and "I'm safe" buttons. Location is the last known floor plus a barometer estimate.
- FR9: Alert only assigned assistants and the floor warden, and escalate if nobody acknowledges.
- FR10: Manual check-in at the outdoor assembly point, with optional GPS confirmation.
- FR11: Live dashboard by tower and floor: safe, waiting for help, unaccounted for, with last known location and time.
- FR12: Share an incident report with Bomba (remaining occupants, floor, stated needs).
- FR13: Visitor and guest check-in by QR code, without an account.

**After an emergency**
- FR14: Incident log and timeline for review.

### Non-functional

- **Privacy and compliance:** UOA is the data controller under the Personal Data Protection Act 2010 as amended in 2024. Information about a person's physical or mental health is sensitive personal data and needs explicit consent. A self-declared "may need help on stairs" answer is health-related, so treat it as sensitive. Collect only what is needed, give a clear notice, and have legal review before launch. Note: limiting deletion to people who have left the company (FR3) may clash with a person's right to withdraw consent, so confirm this with legal before real use.
- **Access control:** profile details visible only to assigned assistants, wardens, and emergency services during an incident. Audit log of every view.
- **Reliability:** work with poor connectivity. Cache floor plans and guidance offline, queue check-ins, and offer an SMS fallback.
- **Accessibility:** WCAG 2.1 AA, screen-reader support, large touch targets, vibration and flashing alerts for deaf users, one-handed use.
- **Performance:** alerts delivered within about 5 seconds; dashboard refresh at least every 10 seconds (targets chosen by the team, not from a standard).
- **Battery:** location sensing only during an incident or drill.
- **Safety:** the app must never tell untrained staff to carry people or move against the evacuation flow.

### Out of scope (hackathon MVP)

- Integration with the fire alarm panel (simulate with an admin trigger).
- Real indoor positioning hardware (simulate with QR codes).
- Procurement of evacuation chairs and refuge areas (recommend, but not build).

---

## Open questions (demo assumptions)

| # | Question | Demo answer |
|---|---|---|
| 1 | Are there refuge areas or evacuation lifts, and where do people who can't use stairs wait today? | No. None today; stairs are the only route. |
| 2 | Would UOA fund evacuation chairs and assistant training alongside the app? | No (out of scope for the demo). |
| 3 | Does the lobby access system keep entry logs that could feed the headcount? | No (not used in the demo). |
| 4 | Is there a data protection owner at UOA? | Yes, on the UOA side; no further detail needed for the demo. |
| 5 | Will UOA run drills that include the app? | No (no drill mode in the demo). |

---

## MVP demo flow

0. Log in with the one-tap demo accounts (UOA admin, staff, staff needing help, assistant, warden).
1. UOA security triggers a "Fire on Level 22, UOA Corporate Tower" incident.
2. Staff get evacuation guidance. A staff member with a leg injury taps "I need help".
3. Her two assigned assistants and the floor warden are alerted and acknowledge.
4. The dashboard shows Level 22: one person waiting for help, nine confirmed safe at the assembly point, and three unaccounted for.
5. UOA shares the list with Bomba.
