# Brand & Mascot Specification: Relay & Ping

## 1. Identity Overview

- **App Name:** **Relay**
- **Mascot Name:** **Ping**
- **Core Concept ("System + Signal"):** **Relay** represents a building-level chain of accountability—passing fast, accurate, floor-level status updates from occupants to their two assigned assistants, floor wardens, building management (UOA Group), and emergency responders (Bomba). **Ping** is the single, lightweight signal that keeps that chain moving.

### Why This Pairing Works for Office Workers
- **Familiar Workplace Vernacular:** Corporate and strata office workers already use *"ping"* daily on Slack, Microsoft Teams, and email to check in with colleagues. Framing emergency readiness and assembly check-ins around a friendly "ping" lowers friction and anxiety.
- **Universal Corporate Appeal:** Rather than leaning on regional motifs or stern, heavy-handed compliance imagery, **Relay** and **Ping** look and feel like a modern workplace SaaS product—equally at home in multinational corporate towers and small strata business suites.
- **Stigma-Free Support:** When occupants self-declare whether they may need help on stairs (due to injury, pregnancy, age, or disability), Ping acts as an approachable, judgment-free guide rather than a medicalized monitor.

---

## 2. Design Inspiration & Visual Direction

Ping is designed as a hybrid of everyday office hardware and friendly minimalist character design:

1. **Smart Desk Beacon & Acoustic Pod:** Ping's rounded, pocket-sized matte-white body and base ripple rings are modeled after a smart office desk pod and wireless locator beacon—visually representing a targeted digital "ping" radiating outward to the right responders.
2. **Corporate ID Badge & Lanyard:** A **safety-amber lanyard loop** clips to the top of Ping's head, referencing the access cards every high-rise worker wears to pass lobby turnstiles while subtly nodding to floor-warden high-visibility gear.
3. **High-Contrast Digital Visor:** Inspired by approachable, expressive tech companions (such as Baymax or Notion's minimalist spot illustrations), Ping features a dark slate visor screen (`#1E293B`) with glowing amber digital eyes—giving the character warmth while meeting **WCAG 2.1 AA** contrast standards.
4. **Stairwell-Ready Footwear:** Paired with simple white gloved hands and dark-slate sneakers, signaling readiness to navigate high-rise stairwells calmly and safely.
5. **Lineless 2D Flat Vector Style:** Built without heavy black ink outlines so shapes remain clean, modern, and easy to separate into lightweight SVG layers for web and mobile animations.

---

## 3. Color System & Status States

Ping communicates system status at a glance through a glowing perimeter LED band and concentric floor ripple rings:

| State | Color Token | Hex Reference | Meaning & App Context |
| :--- | :--- | :--- | :--- |
| **Standby / Prep** | **Cobalt Blue** | `#2563EB` | Normal workday mode, profile onboarding, lobby visitor QR check-ins, and floor map previews. |
| **Active Alert / Waiting** | **Safety Amber** | `#F59E0B` | Incident declared, stairwell exit guidance, or waiting at a designated point while assigned assistants and the floor warden are alerted. |
| **Confirmed Safe** | **Emerald Green** | `#10B981` | User has checked in with *"I'm safe"* at the outdoor assembly point, or the incident/drill has concluded. |

### Base Palette
- **Shell Body:** Matte Off-White (`#F8FAFC`)
- **Visor Screen & Sneakers:** Deep Slate (`#1E293B`)
- **Lanyard & Eye Glow:** Warm Amber (`#F59E0B` / `#FBBF24`)

---

## 4. SVG & Animation Architecture

Ping is structured so frontend developers can render a single modular SVG component and animate individual `<g>` layers with CSS keyframes or GSAP:

- `#lanyard`: Hinged at the top clip ring to swing gently during idle bounces or celebratory hops.
- `#visor-eyes`: Isolated inside the dark visor so eye paths can morph smoothly between happy arcs (onboarding), focused directional gazes (evacuation), calm resting eyes (waiting), and celebratory arcs (safe check-in).
- `#led-band` & `#signal-rings`: Driven by a single CSS custom property (`--ping-state-color`) that transitions between Cobalt Blue, Safety Amber (with outward radar pulse keyframes), and Emerald Green.
- `#arm-left` / `#arm-right`: Pivoted at the shoulder joints for waving, holding a checklist/coffee cup, pointing toward stairwell exits, or raising hands in celebration.
- `#legs`: Pivoted at the base for standing, sitting cross-legged at a waiting point, or mid-air jumping.

---

## 5. Page-by-Page Sprite & Action Matrix

| App Page / Screen | Ping's Pose & Action | LED & Ripple State | Purpose & Micro-Animation |
| :--- | :--- | :--- | :--- |
| **1. Sign-Up & Lobby Visitor QR** | Waving cheerfully while holding a QR pass | **Cobalt Blue** (gentle pulse) | Waving arm pivots at the shoulder; welcomes staff sign-ups and account-free visitor QR check-ins at lobby turnstiles. |
| **2. Assistance Profile Setup** | Holding a checklist and takeaway coffee cup with a warm smile | **Cobalt Blue** (steady) | Subtle idle bounce; keeps the self-declared stair assistance prompt (*Yes / Sometimes / No*) casual and stigma-free. |
| **3. Buddy & Warden Pairing** | Double thumbs-up flanked by two signal badges | **Cobalt Blue** (sync pulse) | Side badges pop in sequentially; reassures users needing stair help that two trained assistants and a floor warden are linked. |
| **4. Tower & Floor Map** | Holding a folded floor plan and pointing to a stairwell marker | **Cobalt Blue** (steady) | Pointing hand nudges toward the exit icon; helps occupants locate stairwells, Bomba lift lobbies, waiting points, and assembly zones. |
| **5. Active Incident Guidance** | **Compact header bust only:** focused eyes pointing toward an exit icon | **Safety Amber** (slow steady glow) | Minimalist micro-animation that directs attention toward stair exits without crowding emergency action buttons. |
| **6. Waiting for Help** | Seated calmly at a location pin with hands folded | **Safety Amber** (outward radar ripples) | Concentric rings expand steadily; confirms that only assigned assistants and the floor warden were pinged and have acknowledged. |
| **7. Assembly Point ("I'm Safe")** | Mid-air celebratory hop with arms raised | **Emerald Green** (bright solid glow) | Spring jump + lanyard bounce; rewards manual check-in (with optional outdoor GPS confirmation) at the assembly point. |
| **8. Offline / SMS Fallback** | Launching a paper airplane carrying an SMS envelope | **Cobalt Blue / Amber** (dashed ring) | Airplane glides across the frame; reassures users that maps are cached offline and check-ins queue via SMS if connectivity drops. |
| **9. Post-Incident / Drill Review** | Relaxed pose holding a warm mug beside a green checkmark | **Emerald Green** (soft ambient glow) | Gentle steam curl; signals "All Clear" on the post-incident timeline and review log. |

---

## 6. UX Restraint & Emergency Accessibility Rules

To keep the interface calm, legible, and usable one-handed under real emergency stress:
1. **Full-Body vs. Compact Badge Rule:** Display **full-body Ping** (`120px–160px`) only on calm, preparatory, or post-incident screens (onboarding, visitor QR standees, map previews, and drill summaries). During an active emergency, switch to a **compact header badge** (`40px–48px` visor + lanyard crop) so high-contrast *"I need help"* and *"I'm safe"* buttons dominate the viewport.
2. **No Panic Cues:** Avoid frantic flashing, alarming red sirens on the mascot, or distressed facial expressions. Ping's expressions remain calm, attentive, and reassuring across all states.
3. **Motion Sensitivity:** Respect `prefers-reduced-motion` media queries by disabling bounce and radar ripple animations while preserving clear color and icon state changes.