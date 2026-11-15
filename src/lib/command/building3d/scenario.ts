import { DEMO_FLOOR, DEMO_TOWER_ID, RECIPIENTS, seedPeople, seedTeams } from '@/lib/command/demo-data';
import { hm } from '@/lib/command/time';
import type { AssistLevel, TeamStatus } from '@/types/command';

import {
  ACCESS_POINT,
  ASSEMBLY,
  assemblySlot,
  at,
  deskPos,
  ENTRANCE,
  LIFT,
  LOBBY,
  ROAD_MID,
  ROAD_START,
  STAIR_A,
  STAIR_B,
  unknownSlot,
  WAIT_B,
} from './geometry';
import { freshness, teamCategory } from './status';
import { Track } from './track';
import type { HelpView, OccStatus, OccupantView, Snapshot, TeamView, TimelineEvent } from './types';

/**
 * Scenario: fire on Level 22, UOA Corporate Tower. Fully scripted and deterministic:
 * the snapshot is a pure function of simulation time, so play, pause, step and reset are trivial.
 * One simulation second is CLOCK_SCALE seconds on the incident clock.
 */
export const CLOCK_SCALE = 10;
export const SIM_END = 95;
const START_SEC = 10 * 3600 + 41 * 60 + 30;
const STAGING = DEMO_FLOOR - 2;
const EMRS_POINT = { x: ASSEMBLY.x + 4.5, z: ASSEMBLY.z + 0.5 };

export const clock = (t: number) => Math.round(START_SEC + t * CLOCK_SCALE);

interface HelpScript {
  at: number;
  where: string;
  seenAt: number;
  ackAt: number;
  ackBy: string;
  teamAt: number;
  teamId: string;
}

interface OccScript {
  id: string;
  name: string;
  company: string;
  homeFloor: number;
  assist: AssistLevel;
  condition?: string;
  need?: string;
  note?: string;
  simulated: boolean;
  track: Track;
  /** Clock seconds of the last update before the incident, null when none since sign-in. */
  lastSeenSec: number | null;
  checkinAt?: number;
  checkinGps?: boolean;
  help?: HelpScript;
}

interface TeamStep {
  t: number;
  status: TeamStatus;
  task: string;
  floor: number | null;
  words?: string;
  eta?: string;
  targetId?: string;
}

interface TeamScript {
  id: string;
  short: string;
  track: Track;
  steps: TeamStep[];
}

const hmToSec = (s: string) => Number(s.slice(0, 2)) * 3600 + Number(s.slice(3, 5)) * 60;

let slot = 0;
const nextSlot = () => assemblySlot(slot++);

/** Desk, Stairwell A, down to the lobby, out to the assembly point. Returns the check-in time. */
function evacuate(track: Track, floor: number, leaveAt: number, secPerFloor: number): number {
  track.until(leaveAt);
  track.keys[track.keys.length - 1].label = `Relay app reports movement on L${floor} (approximate)`;
  track.walk(STAIR_A, `QR scan, Stairwell A door, L${floor}`);
  track.stairs(STAIR_A, 1, 'QR scan, Stairwell A exit, ground floor', secPerFloor);
  track.walk(ENTRANCE).walk(nextSlot(), 'Arrived at Assembly point A (outdoor GPS)');
  return track.t + 1.2;
}

function buildOccupants(): OccScript[] {
  slot = 0;
  const roster = seedPeople().filter((p) => !p.left);
  const leave: Record<string, [number, number]> = {
    farah: [0.6, 1.05],
    kevin: [0.9, 1.0],
    daniel: [1.2, 1.15],
    nurul: [1.6, 1.1],
    priya: [2.0, 1.2],
    jason: [2.4, 1.0],
    siti: [2.8, 1.25],
    hafiz: [3.3, 1.1],
    grace: [3.8, 1.2],
  };
  const out: OccScript[] = roster.map((p) => {
    const desk = p.id === 'sarah' ? unknownSlot(p.floor, 0) : deskPos(p.id, p.floor);
    const s: OccScript = {
      id: p.id,
      name: p.name,
      company: p.company,
      homeFloor: p.floor,
      assist: p.assist,
      condition: p.condition,
      need: p.need,
      note: p.note,
      simulated: false,
      track: new Track(desk),
      lastSeenSec: p.time ? hmToSec(p.time) : null,
    };
    const l = leave[p.id];
    if (l) s.checkinAt = evacuate(s.track, p.floor, l[0], l[1]);
    return s;
  });

  const aisyah = out.find((o) => o.id === 'aisyah');
  if (aisyah) {
    aisyah.track.until(0.3);
    aisyah.track.keys[aisyah.track.keys.length - 1].label = 'Barometer agrees: L22';
    aisyah.track.walk(WAIT_B, 'QR scan, Stairwell B waiting point, L22', 0.9);
    aisyah.track.until(72);
    aisyah.track.stairs(STAIR_B, STAGING, `Carried down Stairwell B to L${STAGING} by Bomba high-rise rescue`, 2.2);
    aisyah.track.lift(LIFT, 1, 'Fire lift to ground floor (commander’s choice)');
    aisyah.track.walk(ENTRANCE).walk(EMRS_POINT, 'Handed to EMRS at Assembly point A', 1.4);
    aisyah.checkinAt = 88;
    aisyah.help = {
      at: 0.3,
      where: 'Stairwell B waiting point',
      seenAt: 1.5,
      ackAt: 3.5,
      ackBy: 'Bomba Pantai',
      teamAt: 5,
      teamId: 'highrise',
    };
  }
  const amirul = out.find((o) => o.id === 'amirul');
  if (amirul) {
    amirul.track.appearAt(60, nextSlot(), 'Manual check-in at Assembly point A');
    amirul.checkinAt = 60;
    amirul.checkinGps = true;
  }

  // Simulated occupants on other floors, so the building is not empty. Not in the Relay roster.
  const sim = (id: string, name: string, company: string, floor: number, seen: string | null, extra?: Partial<OccScript>): OccScript => ({
    id,
    name,
    company,
    homeFloor: floor,
    assist: 'No',
    simulated: true,
    track: new Track(deskPos(id, floor)),
    lastSeenSec: seen ? hmToSec(seen) : null,
    ...extra,
  });
  const extra: OccScript[] = [
    sim('nadia', 'Nadia Kamal', 'Harbourline Design', 23, '10:33'),
    sim('brandon', 'Brandon Yeo', 'Harbourline Design', 23, '10:29'),
    sim('faizal', 'Faizal Rahim', 'Harbourline Design', 23, '10:36'),
    sim('joanne', 'Joanne Tay', 'Harbourline Design', 23, '10:21'),
    sim('rizal', 'Rizal Aziz', 'Tembusu Partners', 21, '10:39', { track: new Track(deskPos('rizal', 20), 'Barometer: L20 (pantry)') }),
    sim('cheryl', 'Cheryl Goh', 'Tembusu Partners', 21, '10:32'),
    sim('haziq', 'Haziq Noor', 'Tembusu Partners', 21, '10:35'),
    sim('chunhao', 'Lee Chun Hao', 'Northwind Advisory', 30, '10:30'),
    sim('amira', 'Amira Salleh', 'Northwind Advisory', 30, '10:37', {
      assist: 'Sometimes',
      note: 'Prefers a slower pace on long stairwells.',
    }),
    sim('daphne', 'Daphne Kok', 'Sentosa Media', 14, '10:31'),
    sim('vikram', 'Vikram Pillai', 'Sentosa Media', 14, '09:40'),
  ];
  const plan: Record<string, [number, number]> = {
    nadia: [1.0, 1.1],
    brandon: [1.4, 1.2],
    faizal: [2.2, 1.05],
    joanne: [3.0, 1.15],
    rizal: [0.8, 1.1],
    cheryl: [1.8, 1.0],
    haziq: [2.6, 1.2],
    chunhao: [1.5, 0.95],
    amira: [3.5, 1.45],
    daphne: [2.0, 1.1],
  };
  for (const s of extra) {
    const p = plan[s.id];
    if (!p) continue;
    const startFloor = Math.round(s.track.p.f);
    s.checkinAt = evacuate(s.track, startFloor, p[0], p[1]);
  }
  return [...out, ...extra];
}

function buildTeams(occ: OccScript[]): TeamScript[] {
  const road = (arrive: number, start: number) => new Track(at(1, ROAD_START)).until(start).drive([ROAD_MID, ACCESS_POINT], arrive, 'Arrived at the Bomba access point');
  const aisyah = occ.find((o) => o.id === 'aisyah')?.track;

  const pantai = road(30, 6)
    .walk(ENTRANCE)
    .lift(LIFT, STAGING, `Fire lift to staging, L${STAGING}`)
    .until(42)
    .stairs(STAIR_B, DEMO_FLOOR, 'Stairwell B up to L22')
    .walk({ x: -3, z: -3 })
    .walk({ x: 2, z: -3.6 })
    .stairs(STAIR_B, 23, 'Stairwell B up to L23')
    .walk({ x: -4, z: -2 })
    .walk({ x: 3, z: 3 })
    .stairs(STAIR_B, STAGING, `Back to staging, L${STAGING}`);

  const ert = new Track(at(1, LOBBY)).until(8).lift(LIFT, STAGING, `Fire lift to L${STAGING}`).walk({ x: 4.6, z: -2.6 });

  const hangtuah = road(44, 7).walk(ENTRANCE).lift(LIFT, STAGING).walk({ x: 1.5, z: -3.6 });
  const seputeh = road(66, 8).walk(ENTRANCE).lift(LIFT, STAGING).walk({ x: -1.5, z: -3.6 });
  const emrs = road(28, 7).walk(EMRS_POINT);

  const highrise = road(50, 7).walk(ENTRANCE).lift(LIFT, STAGING).until(60).stairs(STAIR_B, DEMO_FLOOR).walk({ x: WAIT_B.x + 0.6, z: WAIT_B.z });
  if (aisyah) highrise.until(72).follow(aisyah, 72.01, 88);

  const s = (t: number, status: TeamStatus, task: string, floor: number | null, more?: Partial<TeamStep>): TeamStep => ({
    t,
    status,
    task,
    floor,
    ...more,
  });
  const sent = (task: string) => s(3, 'sent', task, null);

  return [
    {
      id: 'pantai',
      short: 'Pantai',
      track: pantai,
      steps: [
        sent('Plan received for review'),
        s(3.5, 'acknowledged', 'Bomba search: Level 22 then 23', 22, { words: 'On the way, about 6 minutes.', eta: 'about 6 minutes' }),
        s(6, 'en-route', 'Bomba search: Level 22 then 23', 22),
        s(40, 'at-staging', `At staging, Level ${STAGING}`, STAGING, { words: `At staging, Level ${STAGING}.` }),
        s(48, 'on-floor', 'Searching Level 22', 22, { words: 'On Level 22, searching.' }),
        s(66, 'on-floor', 'Searching Level 23', 23, { words: 'Level 22 searched. Moving to Level 23.' }),
        s(84, 'done', 'Search of Level 22 and 23 reported done', STAGING, { words: 'Level 22 and 23 searched. Back at staging.' }),
      ],
    },
    {
      id: 'ert',
      short: 'ERT',
      track: ert,
      steps: [
        sent('Plan received for review'),
        s(4, 'acknowledged', 'Lobby control and fire lift access', 1, { words: 'At the lobby. Fire lift unlocked and plans ready.' }),
        s(14, 'at-staging', `Hands over floor plans and lift control, Level ${STAGING}`, STAGING, { words: `At Level ${STAGING} with plans and lift keys.` }),
      ],
    },
    {
      id: 'hangtuah',
      short: 'Hang Tuah',
      track: hangtuah,
      steps: [
        sent('Plan received for review'),
        s(4.5, 'acknowledged', 'Reported: heading to staging', STAGING, { words: 'On the way, about 8 minutes.', eta: 'about 8 minutes' }),
        s(7, 'en-route', 'Reported: heading to staging', STAGING),
        s(54, 'at-staging', `At staging, Level ${STAGING}. Commander assigns tasks`, STAGING, { words: `At staging, Level ${STAGING}.` }),
      ],
    },
    {
      id: 'highrise',
      short: 'High-rise',
      track: highrise,
      steps: [
        sent('Plan received for review'),
        s(5, 'acknowledged', 'Bomba rescue: Level 22 waiting point', 22, { words: 'On the way, about 9 minutes.', eta: 'about 9 minutes', targetId: 'aisyah' }),
        s(7, 'en-route', 'Bomba rescue: Level 22 waiting point', 22, { targetId: 'aisyah' }),
        s(60, 'at-staging', 'Bomba rescue: Level 22 waiting point', STAGING, { words: `At staging, Level ${STAGING}. Going up Stairwell B.`, targetId: 'aisyah' }),
        s(66, 'on-floor', 'Bomba rescue: Level 22 waiting point', 22, { words: 'On Level 22.', targetId: 'aisyah' }),
        s(69, 'person-reached', 'With the person at the waiting point', 22, { words: 'With the person at Stairwell B waiting point.', targetId: 'aisyah' }),
        s(72, 'person-reached', `Moving the person: Stairwell B to L${STAGING}, then fire lift`, 22, {
          words: `Bringing her down to Level ${STAGING}, then the fire lift, as the commander chose.`,
          targetId: 'aisyah',
        }),
        s(88, 'done', 'Person handed to EMRS at Assembly point A', null, { words: 'Handed over to EMRS.' }),
      ],
    },
    {
      id: 'emrs',
      short: 'EMRS',
      track: emrs,
      steps: [
        sent('Plan received for review'),
        s(5.5, 'acknowledged', 'EMRS: assembly point', null, { words: 'Heading to Assembly point A.' }),
        s(7, 'en-route', 'EMRS: assembly point', null),
        s(34, 'at-staging', 'Standing by at Assembly point A', null, { words: 'At Assembly point A.' }),
        s(86, 'person-reached', 'Receiving the person from Bomba high-rise rescue', null, { words: 'Patient received.', targetId: 'aisyah' }),
      ],
    },
    {
      id: 'seputeh',
      short: 'Seputeh',
      track: seputeh,
      steps: [
        sent('Plan received for review'),
        s(6, 'acknowledged', 'Reported: heading to staging', STAGING, { words: 'On the way, about 11 minutes.', eta: 'about 11 minutes' }),
        s(8, 'en-route', 'Reported: heading to staging', STAGING),
        s(76, 'at-staging', `At staging, Level ${STAGING}`, STAGING, { words: `At staging, Level ${STAGING}.` }),
      ],
    },
  ];
}

function buildEvents(occ: OccScript[], teams: TeamScript[]): TimelineEvent[] {
  const ev: TimelineEvent[] = [
    { id: 'e-fire', sec: 0, text: 'Fire declared on Level 22, UOA Corporate Tower.', tone: 'urgent', floor: 22 },
    { id: 'e-guid', sec: 0.1, text: `Guidance sent: Fire, evacuate. ${RECIPIENTS} people in the tower.`, tone: 'info', floor: null },
    { id: 'e-help', sec: 0.3, text: 'Help request sent automatically from an assistance profile: L22, Stairwell B waiting point.', tone: 'urgent', floor: 22 },
    { id: 'e-seen', sec: 1.5, text: 'Help request seen by UOA security. Waiting for a rescue team to acknowledge.', tone: 'help', floor: 22 },
    { id: 'e-plan', sec: 3, text: 'Plan version 1 sent to 6 teams for review. Advice only.', tone: 'team', floor: null },
    { id: 'e-ack', sec: 3.5, text: 'Help request acknowledged by Bomba Pantai.', tone: 'help', floor: 22 },
    { id: 'e-reach', sec: 69, text: 'Bomba high-rise rescue reports: with the person at L22 Stairwell B waiting point.', tone: 'help', floor: 22 },
    { id: 'e-lift', sec: 71, text: 'Bomba commander chose: fire lift from Level 20. The commander decides; Relay does not.', tone: 'info', floor: 20 },
    { id: 'e-search', sec: 84, text: 'Bomba Pantai reports Level 22 and 23 searched. Unaccounted people stay unaccounted until they check in.', tone: 'team', floor: 22 },
  ];
  for (const team of teams) {
    const name = seedTeams().find((x) => x.id === team.id)?.name ?? team.id;
    for (const st of team.steps) {
      if (st.status === 'sent') continue;
      const words = st.words ? `: "${st.words}"` : '';
      ev.push({ id: `t-${team.id}-${st.t}`, sec: st.t, text: `${name}, ${st.status.replace('-', ' ')}${words}`, tone: 'team', floor: st.floor });
    }
  }
  for (const o of occ) {
    if (o.checkinAt === undefined) continue;
    ev.push({ id: `c-${o.id}`, sec: o.checkinAt, text: `Checked in safe: ${o.name} (L${o.homeFloor}), Assembly point A.`, tone: 'safe', floor: o.homeFloor });
  }
  return ev.sort((a, b) => a.sec - b.sec);
}

interface Scenario {
  occupants: OccScript[];
  teams: TeamScript[];
  events: TimelineEvent[];
}

let cached: Scenario | null = null;
function scenario(): Scenario {
  if (!cached) {
    const occupants = buildOccupants();
    const teams = buildTeams(occupants);
    cached = { occupants, teams, events: buildEvents(occupants, teams) };
  }
  return cached;
}

function occupantAt(o: OccScript, t: number, teams: TeamScript[]): OccupantView {
  const pos = o.track.posAt(t);
  const moving = o.track.movingAt(t);
  const safe = o.checkinAt !== undefined && t >= o.checkinAt;
  const lastKey = o.track.lastUpdate(t);
  let updatedSec = lastKey !== null ? clock(lastKey) : o.lastSeenSec;
  if (moving && o.track.climbingAt(t)) updatedSec = clock(t);
  const now = clock(t);
  const fr = freshness(updatedSec, now, safe);
  const helpOn = o.help && t >= o.help.at && !safe;

  let status: OccStatus;
  if (safe) status = 'safe';
  else if (helpOn) status = 'waiting';
  else if (fr === 'fresh') status = o.assist !== 'No' ? 'assist' : 'active';
  else status = 'unacc';

  let help: HelpView | null = null;
  if (o.help && helpOn) {
    const h = o.help;
    const team = teams.find((x) => x.id === h.teamId);
    help = {
      atSec: clock(h.at),
      where: h.where,
      auto: true,
      ackBy: t >= h.ackAt ? h.ackBy : null,
      ackAtSec: t >= h.ackAt ? clock(h.ackAt) : null,
      seenByControlRoom: t >= h.seenAt,
      escalated: false,
      teamId: team && t >= h.teamAt ? team.id : null,
    };
  }

  const history = o.track.history(t, clock);
  if (o.lastSeenSec !== null) history.push({ label: `Last update before the incident, L${o.homeFloor}`, sec: o.lastSeenSec });
  if (safe && o.checkinAt !== undefined) history.unshift({ label: 'Safe check-in, Assembly point A', sec: clock(o.checkinAt) });

  const outside = safe || (pos.f <= 1.01 && Math.abs(pos.z) > 6);
  const floorNow = Math.round(pos.f);
  let place: string;
  if (safe) place = 'Assembly point A';
  else if (helpOn) place = `L${floorNow}, ${o.help?.where}`;
  else if (fr === 'unknown') place = 'No update since sign-in';
  else if (moving && o.track.climbingAt(t)) place = `Stairwell, passing L${floorNow}`;
  else place = `${fr === 'stale' ? 'Last seen' : 'On'} L${floorNow}`;

  return {
    id: o.id,
    name: o.name,
    company: o.company,
    towerId: DEMO_TOWER_ID,
    homeFloor: o.homeFloor,
    status,
    assist: o.assist,
    condition: o.condition,
    need: o.need,
    note: o.note,
    pos,
    outside,
    place,
    source: history[0]?.label ?? 'No location update',
    updatedSec: safe && o.checkinAt !== undefined ? clock(o.checkinAt) : updatedSec,
    freshness: fr,
    moving,
    history: history.slice(0, 6),
    help,
    simulated: o.simulated,
  };
}

function teamAt(team: TeamScript, t: number): TeamView | null {
  const steps = team.steps.filter((s) => s.t <= t);
  if (!steps.length) return null;
  const cur = steps[steps.length - 1];
  const words = [...steps].reverse().find((s) => s.words)?.words ?? '';
  const eta = [...steps].reverse().find((s) => s.eta)?.eta ?? null;
  const base = seedTeams().find((x) => x.id === team.id);
  const pos = team.track.posAt(t);
  return {
    id: team.id,
    name: base?.name ?? team.id,
    short: team.short,
    category: teamCategory(team.id),
    status: cur.status,
    pos,
    outside: Math.abs(pos.z) > 6 || Math.abs(pos.x) > 8.5,
    assignedFloor: cur.floor,
    task: cur.task,
    words,
    eta,
    updated: hm(clock(cur.t)),
    targetId: cur.targetId ?? null,
  };
}

export function simSnapshot(t: number): Snapshot {
  const sc = scenario();
  return {
    mode: 'sim',
    nowSec: clock(t),
    towerId: DEMO_TOWER_ID,
    incident: {
      kind: 'fire',
      towerId: DEMO_TOWER_ID,
      floor: DEMO_FLOOR,
      startSec: START_SEC,
      affectedFloors: [DEMO_FLOOR],
      stagingFloor: STAGING,
      blocked: [],
      liftChoice: t >= 71 ? 'Fire lift from Level 20 (commander’s choice)' : null,
    },
    occupants: sc.occupants.map((o) => occupantAt(o, t, sc.teams)),
    teams: sc.teams.map((x) => teamAt(x, t)).filter((x): x is TeamView => !!x),
    events: sc.events.filter((e) => e.sec <= t).map((e) => ({ ...e, sec: clock(e.sec) })),
  };
}
