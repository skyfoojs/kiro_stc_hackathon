import { DEMO_TOWER_ID, isCounted } from '@/lib/command/demo-data';
import { nowSec } from '@/lib/command/selectors';
import type { CommandState, Person, Team, TeamStatus } from '@/types/command';

import { ACCESS_POINT, ASSEMBLY, assemblySlot, at, deskPos, LIFT, LOBBY, ROAD_MID, ROAD_START, STAIR_B, unknownSlot, WAIT_B } from './geometry';
import { freshness, teamCategory } from './status';
import type { BPos, HelpView, OccStatus, OccupantView, Snapshot, TeamView, TimelineEvent } from './types';

const SHORT: Record<string, string> = {
  pantai: 'Pantai',
  hangtuah: 'Hang Tuah',
  seputeh: 'Seputeh',
  highrise: 'High-rise',
  emrs: 'EMRS',
  ert: 'ERT',
  pdrm: 'PDRM',
};

const RESCUE = new Set(['pantai', 'hangtuah', 'seputeh', 'highrise']);

const toSec = (s: string | null): number | null => {
  if (!s) return null;
  const [h, m, sec] = s.split(':').map(Number);
  return h * 3600 + m * 60 + (sec || 0);
};

function personPos(p: Person, safeIndex: number, unknownIndex: number): BPos {
  if (p.status === 'safe') return assemblySlot(safeIndex);
  if (p.status === 'wait') return at(p.floor, WAIT_B);
  if (!p.time) return unknownSlot(p.floor, unknownIndex);
  return deskPos(p.id, p.floor);
}

/** Position implied by a team's reported status. Approximate: Relay does not track responders. */
function teamPos(t: Team, fireFloor: number, staging: number): BPos {
  const s: TeamStatus = t.status;
  if (t.id === 'ert') return s === 'at-staging' ? at(staging, { x: 4.6, z: -2.6 }) : at(1, LOBBY);
  if (t.id === 'emrs') return s === 'sent' || s === 'acknowledged' ? at(1, ROAD_START) : at(1, { x: ASSEMBLY.x + 4.5, z: ASSEMBLY.z });
  switch (s) {
    case 'en-route':
      return at(1, ROAD_MID);
    case 'at-staging':
      return at(staging, LIFT);
    case 'on-floor':
      return at(fireFloor, STAIR_B);
    case 'person-reached':
      return at(fireFloor, { x: WAIT_B.x + 0.6, z: WAIT_B.z });
    case 'done':
      return at(1, ACCESS_POINT);
    default:
      return at(1, ROAD_START);
  }
}

function tone(type: string): TimelineEvent['tone'] {
  if (type === 'trig' || type === 'esc') return 'urgent';
  if (type === 'help') return 'help';
  if (type === 'safe') return 'safe';
  if (type === 'ack' || type === 'send') return 'team';
  return 'info';
}

/** The live Command store, mapped onto the 3D snapshot. Positions on a floor are approximate. */
export function liveSnapshot(state: CommandState): Snapshot {
  const now = nowSec(state);
  const inc = state.incident;
  const fireFloor = inc?.floor ?? 22;
  const staging = fireFloor - 2;
  let safeIdx = 0;
  let unknownIdx = 0;

  const occupants: OccupantView[] = state.people.filter(isCounted).map((p) => {
    const pos = personPos(p, p.status === 'safe' ? safeIdx++ : 0, !p.time ? unknownIdx++ : 0);
    const updated = toSec(p.time);
    const safe = p.status === 'safe';
    const fr = freshness(updated, now, safe);
    const h = state.help.find((x) => x.personId === p.id);
    let status: OccStatus;
    if (!inc) status = p.assist === 'Yes' ? 'assist' : 'active';
    else if (safe) status = 'safe';
    else if (p.status === 'wait') status = 'waiting';
    // Keep the store's accounting so the 3D counts always match the dashboard; freshness is shown separately.
    else status = 'unacc';

    let help: HelpView | null = null;
    if (h && p.status === 'wait') {
      const rescue = h.acks.find((k) => k.rescue);
      help = {
        atSec: h.atSec,
        where: h.where,
        auto: h.auto,
        ackBy: rescue?.by ?? null,
        ackAtSec: rescue?.atSec ?? null,
        seenByControlRoom: h.acks.some((k) => !k.rescue),
        escalated: h.escalated,
        teamId: rescue ? (state.teams.find((t) => t.name === rescue.by)?.id ?? null) : null,
      };
    }
    const history = updated !== null ? [{ label: p.source ?? p.place, sec: updated }] : [];
    return {
      id: p.id,
      name: p.name,
      company: p.company,
      towerId: p.towerId,
      homeFloor: p.floor,
      status,
      assist: p.assist,
      condition: p.condition,
      need: p.need,
      note: p.note,
      pos,
      outside: safe,
      place: p.place,
      source: p.source ?? (updated ? 'Relay app' : 'No location update'),
      updatedSec: updated,
      freshness: inc ? fr : updated === null ? 'unknown' : 'fresh',
      moving: false,
      history,
      help,
      simulated: false,
    };
  });

  const teams: TeamView[] = inc
    ? state.teams
        .filter((t) => t.status !== 'not-sent')
        .map((t) => {
          const pos = teamPos(t, fireFloor, staging);
          return {
            id: t.id,
            name: t.name,
            short: SHORT[t.id] ?? t.name,
            category: teamCategory(t.id),
            status: t.status,
            pos,
            outside: Math.abs(pos.z) > 6 || Math.abs(pos.x) > 8.5,
            assignedFloor: t.id === 'ert' ? staging : RESCUE.has(t.id) ? fireFloor : null,
            task: t.id === 'ert' ? 'Lobby control, fire lift access, staging' : t.id === 'emrs' ? 'EMRS: assembly point' : 'As reported by the team',
            words: t.words,
            eta: null,
            updated: t.updated,
            targetId: null,
          };
        })
    : [];

  const events: TimelineEvent[] = state.log.map((e) => ({
    id: `l-${e.id}`,
    sec: toSec(e.t) ?? now,
    text: `${e.title}. ${e.detail}`,
    tone: tone(e.type),
    floor: e.floor === 'all' ? null : Number(e.floor),
  }));

  return {
    mode: 'live',
    nowSec: now,
    towerId: inc?.towerId ?? DEMO_TOWER_ID,
    incident: inc
      ? {
          kind: inc.kind,
          towerId: inc.towerId,
          floor: inc.floor,
          startSec: inc.startSec,
          affectedFloors: [inc.floor],
          stagingFloor: staging,
          blocked: [],
          liftChoice: state.plan.liftChoice
            ? state.plan.liftChoice.value === 'lift'
              ? `Fire lift from Level ${staging} (commander’s choice)`
              : 'Stairs (commander’s choice)'
            : null,
        }
      : null,
    occupants,
    teams,
    events,
  };
}
