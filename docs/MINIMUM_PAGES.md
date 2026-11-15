# Minimum pages for the 3-minute demo

The demo covers the whole system (customer app and management console) in 3 minutes. It opens with a short setup segment (profile and building map), then follows the MVP demo flow in `PROJECT_BRIEF.md`: trigger, help request, responders alerted, assistant on the way, assembly-point check-in, dashboard, Bomba report.

Cut screens are **not deleted**. They stay in the prototype as backup for Q&A.

---

## Customer side (20 built screens, show 10)

### Show live (mandatory)

| Screen | Time | Why it earns its place |
|---|---|---|
| Login (one tap as Aisyah) | 3s | Sets the character and gets into the app. Pre-login if you can. |
| **Profile** | 12s | The key idea. "Would you need help on stairs?" asks about function, not age. Shows Yes, a temporary leg injury, and the note for assistants. |
| Alert, then Incident | 16s | The moment a fire is declared. Guidance and the big orange "I need help" button. |
| Help sent, then Help status | 16s | Undo bar and live acknowledgements. Proves nobody is left behind. |
| Assistant alert | 12s | Shows that only assigned people are alerted, with the "don't carry her" safety line. |
| **Assistant "on the way"** | 12s | The assistant taps "On my way" and sees where Aisyah is waiting and what she needs. Aisyah's Help status flips to "On the way" at the same moment. Closes the loop on the help request. |
| **Assembly-point map, then Check-in and Safe** | 12s | Daniel reaches Assembly point A and checks in. The dashboard's safe count goes up live. Shows how "unaccounted" becomes "safe". |

### Say out loud, don't show

| Screen | What to say |
|---|---|
| Support team | "Each person who may need help has assigned trained helpers, and the floor's management is alerted too." Flash it for 3 seconds after Profile if you are ahead of time. |
| Warden | "Management on the floor sees the same counts on their phone." The dashboard already shows the 1 / 9 / 3 counts, so this screen moved here to make time for the two mandatory screens above. |

### Cut from the live demo (keep as backup)

| Screen | Keep ready for |
|---|---|
| Signup | "How do people join?" |
| Consent | "Is this PDPA compliant?" Health data needs explicit consent. |
| Home | Everyday use. |
| Floor map | "Where do people wait?" |
| Your profile | "Can people see who viewed their data?" |
| All clear | After-incident timeline. |
| Visitor check-in | "What about visitors and hotel guests?" |
| Visitor during incident | Same as above. |

---

## Management side (10 planned screens, show 4)

| Screen | Show? | Notes |
|---|---|---|
| **Building map setup** | Show (13s) | Stairwells, Bomba lift lobby, waiting point and assembly point for UOA Corporate Tower. Point out the "no evacuation chairs installed (recommended)" callout. |
| Trigger incident | Show (8s) | "Fire, UOA Corporate Tower, Level 22." |
| Live dashboard (with the person drawer) | Show (26s) | L22 shows 1 waiting, 9 safe, 3 unaccounted. Open Aisyah's drawer. |
| Share with Bomba | Show (16s) | Copy report, then mark as shared. |
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
| 0:00 to 0:10 | Spoken | The problem. Stairs are the only route, and nobody knows who is still inside. |
| 0:10 to 0:25 | Customer | Profile: Aisyah says she needs help on stairs (leg injury). |
| 0:25 to 0:38 | Management | Building map setup: stairwells, Bomba lift, waiting point, assembly point. |
| 0:38 to 0:46 | Management | Trigger "Fire, UOA Corporate Tower, Level 22." |
| 0:46 to 1:02 | Customer | Alert, then guidance. |
| 1:02 to 1:18 | Customer | Aisyah taps "I need help". Acknowledgements appear. |
| 1:18 to 1:30 | Customer | Assistant phone alert. |
| 1:30 to 1:42 | Customer | Assistant taps "On my way". Aisyah's phone shows "On the way". |
| 1:42 to 1:54 | Customer | Daniel's phone: assembly-point map, then check-in. "Safe" confirmed. |
| 1:54 to 2:20 | Management | Dashboard: L22 shows 1 waiting, 9 safe, 3 unaccounted, then Aisyah's drawer. |
| 2:20 to 2:36 | Management | Share with Bomba. |
| 2:36 to 3:00 | Spoken | Close: the app shows who needs help but cannot move anyone, so pair it with evacuation chairs and trained assistants. Mention PDPA consent in one line. |

This run has no spare time. If you overrun, shorten the dashboard drawer first, then the alert screen. Don't cut the two mandatory screens.

---

## Setup tips

- Log in on all phones and the console before you start: `aisyah` (customer phone), `management` (assistant phone and console), `daniel` (check-in phone). All passwords are `test@123`. Sign the console in first and the assistant phone last, so push alerts land on the assistant phone.
- Open the Profile and Building map setup screens first, and have the incident ready to trigger.
- Before the run, press the console's demo control "Simulate evacuation" so 8 of the L22 staff are already safe. Daniel's live check-in then takes the safe count from 8 to 9 on stage.
- Use the demo controls "Trigger on L22" and "Send Aisyah's help request" to skip clicking.
- Put the phones and the console side by side. Supabase Realtime keeps every screen in sync, so no manual triggering is needed on the other side.
- Offline mode is optional. It is a good reliability point, but it is not part of the core story.
