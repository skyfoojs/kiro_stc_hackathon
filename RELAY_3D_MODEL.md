# Feature Implementation: Relay 3D Emergency Situational Awareness System

## 1. Context

We are developing **Relay**, a building-level disaster management and emergency response coordination platform for high-rise buildings.

Refer to the existing `PROJECT_BRIEF.md` as the primary source of truth. Read and understand it before making implementation decisions.

The purpose of this task is to build a **3D Emergency Situational Awareness System** for the Command dashboard.

The visualization should allow UOA security and the Bomba incident commander to understand the emergency situation across an entire skyscraper through an interactive 3D building model.

The central concept:

> A live 3D representation of the building that visualizes occupants, their approximate locations and movements, assistance requests, floor conditions, hazards, and emergency response team progress.

This should look and feel like a professional emergency operations command centre, not a generic 3D building viewer.

**Important: Do not simply produce a static 3D model. Build a functional, interactive visualization backed by simulated live data.**

---

## 2. First: Inspect the Existing Project

Before implementing anything:

1. Inspect the existing repository structure and identify the frontend framework, rendering architecture, styling conventions, existing components, routing, state management, and data structures.
2. Understand how the existing Command dashboard works.
3. Identify whether the application already has:
   - Building and tower data.
   - Floor information.
   - Occupant profiles.
   - Assistance requests.
   - Incident information.
   - Occupant status and check-in data.
   - Response team information.
4. Reuse the existing data structures and integrate with the existing application wherever possible.
5. Do not unnecessarily rewrite existing pages, authentication, application architecture, or functionality.
6. Avoid creating an isolated demo that does not connect to the rest of Relay.

If actual backend data is unavailable, implement a well-structured mock data layer that can later be replaced with real API responses.

**Prioritize a working end-to-end visualization over unnecessary abstraction or production-level complexity.**

---

# 3. Main Visual Concept: 3D Transparent Skyscraper

## 3.1 Overall appearance

Create an impressive 3D skyscraper visualization as the main attraction of the Command dashboard.

Visual direction:

- Dark background, preferably near-black / dark navy.
- Semi-transparent glass-like building exterior.
- Visible floor slabs and internal building structure.
- Subtle glowing edges and lighting.
- Clearly distinguishable floors.
- Occupant markers rendered within the building.
- Controlled use of neon colors to communicate different emergency statuses.
- Smooth camera movement and animations.

The building should resemble a digital twin used in an emergency operations centre.

It should be sophisticated, clean, futuristic, and functional.

Avoid excessive neon effects, distracting particle effects, or unnecessarily complicated visual decorations.

## 3.2 Building structure

The building should be represented as a multi-floor 3D model.

Each floor should:

- Be individually identifiable.
- Have a floor number or label.
- Display a floor-level status indicator.
- Contain occupant markers at approximate locations.
- Support selection and highlighting.
- Allow the user to inspect its occupant information.

The building exterior should be sufficiently transparent to reveal the interior.

Consider implementing:

- Glass exterior walls.
- Semi-transparent floor plates.
- Visible structural columns.
- A central building core.
- Stairwell locations.
- Bomba/fire lift locations.
- Relevant waiting points.

The model does not need architectural-level accuracy. A clean, convincing schematic building is preferable to a highly detailed model that is difficult to read.

If accurate architectural geometry or floor plans are unavailable, do not invent real room layouts. Use a clearly identified schematic representation.

## 3.3 Camera interaction

The user should be able to:

- Rotate the building.
- Zoom in and out.
- Pan around the building.
- Select a floor.
- Focus on a selected floor.
- Reset the camera to the default perspective.
- Isolate or expand a selected floor for closer inspection.

Consider an exploded-floor mode where floors are slightly separated vertically to make it easier to inspect each level.

Camera movement should be smooth, with sensible zoom limits and no accidental loss of the building from view.

---

# 4. Occupant GPS / Location Visualization

This is one of the most important features.

Every occupant should be represented by a visual node inside the 3D building.

The purpose is to allow management to understand where occupants are located during an incident.

## 4.1 Occupant nodes

Display occupants as small 3D markers, dots, or miniature person indicators.

Each node should have:

- A distinct visual identity.
- A status indicator.
- A floor location.
- An approximate position within the floor.
- A last-updated timestamp.
- A movement indicator when location history is available.

Avoid displaying a permanent text label above every occupant. This will become visually cluttered with large numbers of occupants.

Instead:

- Show compact markers by default.
- Reveal basic information when hovering.
- Open a detailed information panel when clicking.
- Highlight the selected occupant within the building.

## 4.2 Occupant status and visual distinction

Implement a consistent visual language.

Suggested statuses:

| Status             | Suggested visual treatment                 | Meaning                                                        |
| ------------------ | ------------------------------------------ | -------------------------------------------------------------- |
| Normal / Active    | Cyan or blue                               | Occupant currently inside the building                         |
| Needs Assistance   | Purple or amber, with accessibility symbol | Occupant has declared that they may need help on stairs        |
| Waiting for Rescue | Orange, with pulsing indicator             | Occupant has an active help request and is awaiting assistance |
| Unaccounted For    | Red or red-outlined marker                 | No confirmed safe check-in or sufficiently recent location     |
| Safe / Checked In  | Green                                      | Occupant manually confirmed safe at the outdoor assembly point |
| Rescue Team        | Blue shield / team icon                    | Emergency response personnel                                   |

Use icons, shapes, and labels alongside colors. Do not depend on color alone to convey important information.

**Important considerations:**

- Assistance status must reflect the self-declared functional assistance profile in Relay.
- Do not infer disabilities, medical conditions, or assistance needs from age or appearance.
- A person with a temporary injury can also require assistance.
- Safe check-in should be distinct from merely having a location inside the building.

## 4.3 Location tracking and movement

The visualization should demonstrate that occupants are moving throughout the building.

A node should be able to:

- Move between approximate positions within a floor.
- Move vertically between floors during a simulation.
- Leave a subtle movement trail.
- Display its previous and current location.
- Show the last location update time.
- Indicate whether its position is fresh or potentially outdated.

When a person moves, animate their node smoothly rather than teleporting it between locations.

Movement trails should fade over time to avoid overwhelming the visualization.

Provide a way to toggle movement trails on and off.

**Technical and accuracy constraint:**

Indoor phone GPS cannot reliably determine precise positions and floors. Do not implement or claim accurate indoor GPS tracking.

For the MVP, use simulated indoor positioning based on:

- Assigned tower and floor.
- Approximate floor-level coordinates.
- Simulated QR-code location updates.
- Simulated barometer-based floor changes.

Represent location uncertainty honestly. A node should be identifiable as an approximate or simulated location when appropriate.

When location data is missing or stale, show the last known location and its timestamp rather than presenting it as a confirmed live location.

---

# 5. Highlight People Requiring Assistance

This should be one of the most visually important features.

People who need help using stairs must be immediately distinguishable.

For occupants with an active assistance request:

- Render a prominent accessibility-related marker.
- Use a controlled pulsing animation.
- Highlight their floor.
- Show their waiting point.
- Display their assistance status.
- Show how long they have been waiting.
- Show whether a rescue team has acknowledged the request.
- Show whether a team is en route or has reached them.

Clicking the marker should open a detail panel containing:

- Occupant name, subject to the existing access-control rules.
- Floor and tower.
- Last known location.
- Assistance level.
- Optional condition or note.
- Request time.
- Waiting duration.
- Assigned response team, if applicable.
- Current response progress.

The visualization should make it easy to identify people waiting for help without requiring management to search through a long list.

Use a stronger highlight for a person whose request has not yet been acknowledged.

Do not expose personal or sensitive information indiscriminately in the overview. Detailed information should follow Relay's existing role and access-control rules.

---

# 6. Floor and Room Status Visualization

Each floor should have a visual status that allows commanders to quickly identify the overall situation.

Suggested status system:

| Floor status          | Appearance         | Description                                                            |
| --------------------- | ------------------ | ---------------------------------------------------------------------- |
| All Accounted For     | Green              | All occupants have a confirmed safe status                             |
| Assistance Required   | Amber              | One or more occupants are waiting for help                             |
| Unaccounted Occupants | Red / Orange       | One or more occupants have not been accounted for                      |
| Incident Affected     | Red hazard overlay | The floor is affected by the incident                                  |
| No Recent Data        | Grey               | Current occupant status cannot be confirmed                            |
| Partial Status        | Blue / Neutral     | Some occupants have reported, but the floor is not fully accounted for |

The floor status should be derived from the underlying occupant and incident data.

### Green floor / room visualization

I particularly want a green-out effect for floors or rooms that are fully accounted for.

When all occupants in a mapped floor or zone have a confirmed safe status:

- Highlight the floor or zone with a subtle green glow.
- Display an "ALL ACCOUNTED FOR" label.
- Optionally animate the floor transitioning into its cleared state.

However, do not mark a floor green simply because no occupant markers are visible.

Do not claim that Bomba has declared an area safe unless that has actually been reported.

A floor being fully accounted for is not the same thing as an official hazard-clearance declaration.

### Room-level visualization

Room-level status would be useful, but only implement it when the available building or floor map contains suitable zone information.

If no real room geometry exists, use approximate floor-level locations instead of inventing precise room coordinates.

---

# 7. Incident and Hazard Visualization

The building should visually communicate what is happening during the emergency.

For a fire incident, consider:

- Highlighting the affected floor with a red or orange hazard overlay.
- Displaying the incident origin or affected zone when known.
- Showing a subtle warning effect around the affected area.
- Highlighting adjacent floors if the incident data indicates they are affected.
- Displaying blocked stairwells or unavailable lifts when this information is provided.
- Displaying the fire floor prominently in the building overview.

Other incident types should have their own visual treatments:

- Fire: orange/red hazard visualization.
- Earthquake: affected-zone or structural-warning visualization.
- Power outage: darkened or disabled floor sections.
- Security threat: highlighted restricted or affected zones.

Do not invent incident spread or structural damage. Only display information provided by the incident data or clearly identified simulation scenarios.

Include a layer toggle so the user can enable or disable hazard visualizations.

---

# 8. Rescue Team Visualization

The 3D building should also display the approximate progress of emergency response teams.

Represent response teams differently from ordinary occupants.

For example:

- Bomba rescue: red/blue emergency team marker.
- Specialist rescue: distinct specialist-team icon.
- EMRS / ambulance: medical icon.
- Building ERT: building-team icon.
- Police: police icon.

Their progress should be visually understandable.

Suggested statuses:

1. Sent.
2. Acknowledged.
3. En route.
4. At staging.
5. On floor.
6. Person reached.
7. Done.

When a team is assigned to a floor:

- Highlight its target floor.
- Display its destination.
- Show an approximate movement animation when appropriate.
- Display its reported status.
- Connect its marker to the relevant task or occupant.

The system should not pretend to know a responder's real-time location if that information is unavailable.

For the demo, scripted responses and simulated movement are sufficient.

**Safety constraints from the project brief:**

- Relay does not decide how many rescuers, units, or vehicles to send.
- Bomba or specialist rescue teams handle occupant carrying and entry onto the fire floor.
- The building ERT must not be represented as entering the fire floor or carrying occupants.
- The lift-versus-stairs decision belongs to the Bomba commander.
- The 3D visualization is situational awareness and decision support, not autonomous rescue instruction.

---

# 9. Simulation Mode

This is essential for demonstrating the feature.

Build a functional simulation mode that allows the presenter to demonstrate the system without depending on real GPS devices, real occupants, or external integrations.

The simulation should make the building feel alive.

## 9.1 Simulation controls

Provide a control panel containing:

- Play.
- Pause.
- Reset.
- Simulation speed.
- Step forward.
- Optional scenario selection.
- Toggle movement trails.
- Toggle occupant markers.
- Toggle response teams.
- Toggle hazard visualization.

Simulation speed options can include:

- 0.5x
- 1x
- 2x
- 4x

The simulation must update the visual representation as well as the underlying displayed status information.

## 9.2 Simulated events

Implement events such as:

- Occupants appearing in the building.
- Occupants moving between locations.
- Occupants moving between floors.
- Occupants requesting assistance.
- Assistance requests being acknowledged.
- Rescue teams being dispatched.
- Rescue teams reaching a floor.
- Occupants being marked as reached.
- Occupants checking in at the outdoor assembly point.
- Floor status changing as people are accounted for.

Use varied animation timings rather than having everything move simultaneously.

Some nodes should appear, some should move, and some should remain stationary.

Movement and state changes should look natural and easy to follow.

## 9.3 Scenario-based simulation

Create a realistic default demo scenario based on the existing project brief.

**Scenario: Fire on Level 22, UOA Corporate Tower.**

Initial situation:

- 1 occupant waiting for help due to a leg injury and inability to use stairs.
- 9 occupants confirmed safe.
- 3 occupants unaccounted for.

The visualization should reflect these counts.

Demonstrate the following progression:

1. Fire incident starts on Level 22.
2. Level 22 receives an incident highlight.
3. The occupant requiring assistance appears prominently.
4. The three unaccounted occupants receive distinct visual indicators.
5. A rescue request is sent.
6. Response team statuses begin updating.
7. The simulation shows teams progressing through the building.
8. Occupants begin reaching the assembly point.
9. Their safe check-ins update the building's overall status.
10. Floor indicators update accordingly.

The simulation should be repeatable and deterministic enough for a live presentation.

Keep the simulation data separate from the visualization component so that different scenarios can be introduced later.

---

# 10. Interaction and Information Panels

The 3D view should not operate in isolation.

It should provide useful information without forcing the user to navigate away from the building.

Implement contextual information panels.

### On selecting a floor

Show:

- Tower name.
- Floor number.
- Current floor status.
- Total occupants.
- Safe occupants.
- People requiring assistance.
- Unaccounted occupants.
- Active incident information.
- Relevant response teams.
- Last update time.

### On selecting an occupant

Show:

- Occupant information.
- Current status.
- Floor and approximate location.
- Assistance requirement.
- Last location update.
- Waiting duration.
- Assigned team and response progress, if applicable.

### On selecting a response team

Show:

- Team name.
- Team category.
- Current reported status.
- Assigned floor.
- Current task.
- Reported ETA, where provided.
- Latest communication.

### On selecting a waiting point

Show:

- Its floor and location.
- Number of people waiting.
- Occupant information according to access permissions.
- Associated rescue progress.

Use side panels, contextual cards, or drawers rather than placing large text blocks over the 3D visualization.

---

# 11. Dashboard Layout

Design the experience as part of the existing Relay Command dashboard.

Suggested layout:

### Main area: 3D building

The building should occupy most of the available screen space.

It should remain the primary visual focus.

### Top information bar

Display high-level incident information:

- Incident type.
- Tower name.
- Affected floor.
- Incident duration.
- Last data update.
- Current simulation / live mode indicator.

### Left-side panel: Building overview

Display:

- Tower selector.
- Floor selector.
- Building occupancy summary.
- Floor status list.
- Quick filters.

Allow the user to select a floor from the panel and immediately focus the 3D camera on it.

### Right-side panel: Selected entity

Display information relating to whichever occupant, team, floor, or waiting point the user has selected.

### Bottom panel: Simulation and timeline

When simulation mode is enabled, display its playback controls.

Also consider a compact event timeline with entries such as:

- 14:02 — Fire declared on Level 22.
- 14:02 — Assistance request automatically submitted.
- 14:03 — Rescue team acknowledged.
- 14:05 — Team arrived at staging.
- 14:07 — Occupant reached.
- 14:10 — Safe check-in recorded.

Use the existing application's design conventions where possible. Do not disrupt the existing Command workflow.

The design must remain usable on smaller screens, especially the phone-first Command experience described in the project brief.

---

# 12. Additional Features Worth Implementing

Consider the following features where they add genuine value.

### A. Floor isolation / exploded view

Allow a selected floor to separate slightly from the rest of the building.

This makes occupant locations and floor conditions much easier to inspect.

### B. Location history

When selecting an occupant, show a short movement history.

For example:

- Last known position: Level 22.
- Previous position: Level 21.
- Updated: 14:02.

Use simulated data for the MVP.

### C. Last-known location and data freshness

Not every occupant will have an updated location.

Show whether a location is:

- Recently updated.
- Outdated.
- Unknown.
- Confirmed through a recent check-in.

Allow users to filter for stale location data.

### D. Search and filtering

Provide the ability to:

- Search for an occupant.
- Filter by assistance requirement.
- Filter by waiting-for-rescue status.
- Show only unaccounted occupants.
- Show only response teams.
- Filter by floor.
- Focus on floors affected by the incident.

Selecting a search result should automatically focus the building visualization on the corresponding occupant.

### E. Outside assembly point

The building visualization should ideally extend slightly beyond the building footprint to show the outdoor assembly point.

When occupants check in:

- Their marker should move from the building to the assembly point.
- Their status should change to Safe / Checked In.
- The occupant count should update.
- Relevant floor and incident summaries should update.

Remember: the assembly point is outside the building. Outdoor GPS may optionally assist check-in, but manual check-in remains the primary action.

### F. Visual layer controls

Create a clean layer-control menu allowing the user to toggle:

- Occupants.
- Assistance requests.
- Unaccounted occupants.
- Response teams.
- Movement trails.
- Hazard areas.
- Stairwells.
- Bomba lifts.
- Waiting points.
- Floor status.

This will help prevent the model from becoming visually overcrowded.

---

# 13. Technical Implementation Guidelines

Adapt these guidelines to the actual repository architecture.

## 3D rendering

If the existing frontend uses React, consider:

- Three.js.
- React Three Fiber.
- Drei, where useful.

If another framework is already being used, choose a compatible rendering approach.

Do not introduce a completely separate frontend framework.

Use procedural geometry where appropriate to construct the skyscraper.

Prefer reusable building components:

- Building.
- Floor.
- FloorLabel.
- OccupantNode.
- AssistanceNode.
- ResponseTeamNode.
- HazardZone.
- Stairwell.
- LiftCore.
- WaitingPoint.
- AssemblyPoint.

## Data architecture

Keep the visualization separate from the underlying simulation and incident data.

Suggested conceptual data structures:

**Building**

- id
- name
- towerType
- totalFloors
- floors

**Floor**

- id
- floorNumber
- occupants
- status
- zones
- infrastructure

**Occupant**

- id
- name
- floorId
- position
- status
- assistanceRequired
- assistanceLevel
- lastKnownLocation
- lastUpdated
- locationConfidence
- movementHistory

**ResponseTeam**

- id
- name
- category
- status
- assignedFloor
- approximatePosition
- currentTask
- reportedETA

**Incident**

- id
- type
- towerId
- affectedFloor
- affectedZones
- startedAt
- status

These are suggested structures, not instructions to duplicate data that already exists. Reuse existing project models where possible.

## Performance

A high-rise building may contain many floors and occupants.

Ensure that:

- The visualization remains responsive.
- Nodes are not unnecessarily recreated every animation frame.
- Simulation updates do not trigger excessive component re-rendering.
- Animations use appropriate frame updates.
- Floor labels and occupant labels do not overwhelm the scene.
- Unselected entities use simplified visuals when appropriate.

For the MVP, prioritize a responsive visualization over rendering every detail.

## Fallback behaviour

If the 3D visualization fails to load or WebGL is unavailable, provide a useful fallback rather than a blank screen.

A simplified floor list or 2D building overview would be appropriate.

---

# 14. Design Quality Requirements

The end result should feel like a real emergency operations command system.

Design principles:

1. Information hierarchy: important emergencies must be immediately visible.
2. Clarity: the user should understand the meaning of every marker.
3. Low cognitive load: avoid excessive visual effects and unnecessary text.
4. Consistency: statuses, colors, icons, and terminology must be consistent across the system.
5. Accessibility: use sufficient contrast, labels, large controls, and non-color indicators.
6. Responsiveness: support both desktop and phone-sized displays.
7. Responsiveness in the visual sense: the building should animate smoothly without unnecessary visual noise.

Do not make it look like a generic gaming interface.

Do not use excessive glassmorphism, unnecessary gradients, random floating particles, or decorative effects that interfere with interpreting the incident.

The purpose of the visual design is to improve emergency awareness, not merely to look futuristic.

---

# 15. Implementation Priorities

Work in the following order.

### Priority 1 — Core 3D building

- Build the transparent skyscraper.
- Render individual floors.
- Add camera controls.
- Add floor selection and highlighting.

### Priority 2 — Occupant visualization

- Add occupant nodes.
- Implement status-based appearances.
- Display assistance requests prominently.
- Implement selection and information panels.

### Priority 3 — Floor conditions

- Implement floor-status calculations.
- Add green All Accounted For visualization.
- Add incident and hazard overlays.
- Handle unknown and outdated data.

### Priority 4 — Simulation

- Implement simulated node movement.
- Implement status transitions.
- Add response team movement and progress.
- Implement playback controls and reset.

### Priority 5 — Command integration and refinement

- Integrate with the existing dashboard.
- Reuse the existing incident data.
- Add filtering and searching.
- Improve the visual hierarchy.
- Test desktop and mobile layouts.
- Optimize rendering performance.

---

# 16. Acceptance Criteria

The feature is not complete until the following can be demonstrated:

- [ ] A transparent, interactive 3D skyscraper is displayed.
- [ ] Individual floors can be identified and selected.
- [ ] Camera rotation, zooming, and panning work.
- [ ] Occupants appear as individual nodes in the building.
- [ ] Occupants requiring assistance have a distinct visual identity.
- [ ] Unaccounted occupants can be identified.
- [ ] Selecting an occupant reveals useful information.
- [ ] A floor can show a green All Accounted For state.
- [ ] Unknown or outdated location data is not incorrectly treated as safe.
- [ ] Fire and other incident overlays are visible.
- [ ] Response teams have separate visual markers.
- [ ] Simulated occupants move through the building.
- [ ] Simulation playback can be started, paused, and reset.
- [ ] Occupant statuses and floor summaries update as the simulation progresses.
- [ ] Safe check-ins at the outside assembly point are reflected in the visualization.
- [ ] The visualization works with the existing Relay Command dashboard.
- [ ] The interface does not introduce unsafe rescue instructions or invented responder headcounts.
- [ ] The project builds and runs without breaking existing functionality.

---

# 17. Final Instructions

Do not stop after providing a design proposal or implementation plan.

Actually implement the feature in the existing repository.

Make sensible decisions independently when details are missing. Prioritize a convincing and functional MVP over excessive complexity.

Do not waste time implementing features that are not essential to the visualization.

In particular:

- Do not build real indoor GPS infrastructure.
- Do not create an unrelated building management system.
- Do not create a separate responder application.
- Do not implement AI decision-making inside the 3D visualization.
- Do not invent architectural floor plans or real-world location accuracy.
- Do not duplicate existing features unnecessarily.

The most important outcome is:

**A working 3D emergency command visualization where management can see the entire building, identify people who need help, locate unaccounted occupants, understand floor conditions, and observe the progress of emergency response teams through an interactive simulation.**

After implementation:

1. Run the existing project.
2. Resolve compilation, runtime, and rendering errors.
3. Test the main interactions.
4. Verify the default Level 22 fire scenario.
5. Summarize the components implemented, files changed, and any known limitations.

Make sure the main component works end-to-end before spending time on secondary polish.
