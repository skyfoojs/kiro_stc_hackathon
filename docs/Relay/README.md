# Relay: office disaster recovery app (The Vertical, Bangsar South)

Mascot: Ping. Built for a 3-minute demo.

## What's in this folder

| Folder | Contents |
|---|---|
| `docs/` | `PROJECT_BRIEF.md` (the current brief, FR1 to FR24, 3-minute run order), `COMMAND_VIEW_SPEC.md` (what the teammate builds: the Command view for UOA security and the Bomba commander), the Ping brand spec and sprite sheet |
| `prototype/` | `relay-customer.html`: the staff app prototype. One self-contained file; open it in a browser. The left rail lists the demo path; the right panel has demo controls (trigger, end incident, offline, sound, reset) |
| `blender/` | Blender sources for the 3D Level 22 map: `level22.py` / `.blend` (still render) and `level22_flyin.py` / `.blend` (the fly-in frames used on the guidance screen). Run with `python3 level22_flyin.py` after `pip install bpy` |
| `archive/` | Earlier documents kept for reference only. **Out of date**: they still describe wardens, assistants and a desktop console |

## Linking to the Command view

The incident is triggered from the Command view (UOA security), which the teammate builds from `docs/COMMAND_VIEW_SPEC.md`. Both apps talk through `BroadcastChannel('appname-demo')`, so serve them from the same folder (for example `npx serve .`) and open each in its own tab or device window. The staff prototype also works on its own: its demo controls have a stand-in trigger for practice.

## Demo path (staff phone, about 68 seconds)

Landing, Demo login (Aisyah Rahman), Assistance profile, then Command triggers the fire, then Incident alert, Help request sent, Help on the way, then back to Command. Full timings are in `docs/PROJECT_BRIEF.md`.

## Notes

- Demo data and team replies are scripted. GPS, barometer readings and the Bomba arrival time are simulated, and the Bomba climb plays sped up.
- Relay never recommends how many rescuers to send. The plan is sent to teams for review only.
- The consent wording needs legal review before real use (PDPA).
