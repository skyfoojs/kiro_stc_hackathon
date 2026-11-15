# Minimum pages for the 3-minute demo

The demo covers the whole system (customer app and management console) in 3 minutes. It opens with a short setup segment (profile and building map), then follows the MVP demo flow in `PROJECT_BRIEF.md`: trigger, help request, responders alerted, dashboard, Bomba report.

Cut screens are **not deleted**. They stay in the prototype as backup for Q&A.

---

## Customer side (21 built screens)

### Show live

| Screen | Time | Why it earns its place |
|---|---|---|
| **Landing** | on screen during the intro | The first screen while you speak the problem. Ping waves, with three ways in: sign in, sign up, visitor. |
| Login (one tap as Aisyah) | 3s | A separate page of one-tap demo accounts. Pre-login if you can. |
| **Profile** | 12s | The key idea. "Would you need help on stairs?" asks about function, not age. Shows Yes, a temporary leg injury, and the note for assistants. |
| Alert, then Incident | 18s | The moment a fire is declared. Guidance and the big orange "I need help" button. |
| Help sent, then Help status | 18s | Undo bar and live acknowledgements. Proves nobody is left behind. |
| Assistant alert (Mei Ling) | 14s | Shows that only assigned people are alerted, with the "don't carry her" safety line. |
| Warden | 13s | The 1 waiting / 9 safe / 3 unaccounted counts, matching the dashboard. |

### Say out loud, don't show

| Screen | What to say |
|---|---|
| Support team | "Each person who may need help has two trained assistants and a warden assigned." Flash it for 3 seconds after Profile if you are ahead of time. |
| Check-in and Safe | "People then check in at the assembly point, with optional GPS." |

### Cut from the live demo (keep as backup)

| Screen | Keep ready for |
|---|---|
| Signup | "How do people join?" |
| Consent | "Is this PDPA compliant?" Health data needs explicit consent. |
| Home | Everyday use. |
| Floor map | "Where do people wait?" |
| Assembly-point map | Same as above. |
| Your profile | "Can people see who viewed their data?" |
| All clear | After-incident timeline. |
| Assistant "on the way" | Assistant follow-up. |
| Visitor check-in | "What about visitors and hotel guests?" |
| Visitor during incident | Same as above. |

---

## Management side (10 planned screens, show 4)

| Screen | Show? | Notes |
|---|---|---|
| **Building map setup** | Show (15s) | Stairwells, Bomba lift lobby, waiting point and assembly point for UOA Corporate Tower. Point out the "no evacuation chairs installed (recommended)" callout. |
| Trigger incident | Show (10s) | "Fire, UOA Corporate Tower, Level 22." |
| Live dashboard (with the person drawer) | Show (30s) | L22 shows 1 waiting, 9 safe, 3 unaccounted. Open Aisyah's drawer. |
| Share with Bomba | Show (17s) | Copy report, then mark as shared. |
| Incident log and timeline | Cut | Backup only. Flash for 3 seconds if you finish early. |
| People and profiles | Cut | Backup only. |
| Visitors | Cut | Backup only. |
| Audit log | Cut | Backup only. |
| Login | Pre-login | Log in before the demo starts. |

If the teammate is short on time, skip building the four cut screens.

---

## Three-minute run

| Time | Side | What happens |
|---|---|---|
| 0:00 to 0:12 | Spoken, Landing screen up | The problem. Stairs are the only route, and nobody knows who is still inside. |
| 0:12 to 0:27 | Customer | Profile: Aisyah says she needs help on stairs (leg injury). |
| 0:27 to 0:42 | Management | Building map setup: stairwells, Bomba lift, waiting point, assembly point. |
| 0:42 to 0:52 | Management | Trigger "Fire, UOA Corporate Tower, Level 22." |
| 0:52 to 1:10 | Customer | Alert, then guidance. |
| 1:10 to 1:28 | Customer | Aisyah taps "I need help". Acknowledgements appear. |
| 1:28 to 1:42 | Customer | Assistant phone alert. |
| 1:42 to 1:55 | Customer | Warden phone with the counts. |
| 1:55 to 2:25 | Management | Dashboard: L22 shows 1 waiting, 9 safe, 3 unaccounted, then the drawer. |
| 2:25 to 2:42 | Management | Share with Bomba. |
| 2:42 to 3:00 | Spoken | Close: the app shows who needs help but cannot move anyone, so pair it with evacuation chairs and trained assistants. Mention PDPA consent in one line. |

This run has no spare time. If you overrun, shorten the Warden screen first, then the dashboard drawer.

---

## Setup tips

- Log in on both sides before you start.
- Open the Profile and Building map setup screens first, and have the incident ready to trigger.
- Use the demo controls "Trigger on L22" and "Send Aisyah's help request" to skip clicking.
- Put the phone and the console side by side. If both HTML files are served from one folder, the live link keeps them in sync. Otherwise, trigger each side by hand.
- Offline mode is optional. It is a good reliability point, but it is not part of the core story.
