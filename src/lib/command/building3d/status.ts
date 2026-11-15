import type { TeamStatus } from '@/types/command';

import type { IncidentView, OccStatus, OccupantView, TeamCategory } from './types';

/** Colours for the dark 3D viewport. Always paired with a shape and a label, never colour alone. */
export const VIZ = {
  bg: '#0a1222',
  glass: '#7fa6e0',
  edge: '#3c6aa8',
  slab: '#5b7bb0',
  active: '#38bdf8',
  assist: '#a78bfa',
  waiting: '#f2b33d',
  urgent: '#ff5a1f',
  unacc: '#ff5c6c',
  safe: '#3fcf8e',
  team: '#5b8cff',
  staging: '#5b8cff',
  stair: '#9fb3c8',
  lift: '#e86a6a',
  nodata: '#6b7a90',
  hazardFire: '#ff4d2e',
  hazardQuake: '#f2b33d',
  hazardOutage: '#1a2233',
  hazardSecurity: '#b16cff',
} as const;

export const OCC_LABEL: Record<OccStatus, string> = {
  active: 'Inside, location updating',
  assist: 'May need help on stairs',
  waiting: 'Waiting for rescue',
  unacc: 'Unaccounted for',
  safe: 'Safe, checked in',
};

export const OCC_SHAPE: Record<OccStatus, string> = {
  active: 'Dot',
  assist: 'Diamond',
  waiting: 'Dot with pulsing ring',
  unacc: 'Hollow ring',
  safe: 'Small dot at the assembly point',
};

export function occColor(o: Pick<OccupantView, 'status' | 'help'>): string {
  if (o.status === 'waiting') return o.help?.ackBy ? VIZ.waiting : VIZ.urgent;
  return VIZ[o.status];
}

export const TEAM_STATUS_LABEL: Record<TeamStatus, string> = {
  'not-sent': 'Not sent',
  sent: 'Sent',
  acknowledged: 'Acknowledged',
  'en-route': 'En route',
  'at-staging': 'At staging',
  'on-floor': 'On floor',
  'person-reached': 'Person reached',
  done: 'Done',
};

export const TEAM_STEPS: TeamStatus[] = ['sent', 'acknowledged', 'en-route', 'at-staging', 'on-floor', 'person-reached', 'done'];

export const CATEGORY_LABEL: Record<TeamCategory, string> = {
  bomba: 'Bomba fire station',
  specialist: 'Specialist rescue',
  emrs: 'EMRS ambulance',
  ert: 'Building ERT',
  police: 'Police',
};

export const CATEGORY_MARK: Record<TeamCategory, string> = {
  bomba: 'B',
  specialist: 'SR',
  emrs: '+',
  ert: 'ERT',
  police: 'P',
};

export function teamCategory(id: string): TeamCategory {
  if (id === 'highrise') return 'specialist';
  if (id === 'emrs') return 'emrs';
  if (id === 'ert') return 'ert';
  if (id === 'pdrm') return 'police';
  return 'bomba';
}

export type FloorState = 'empty' | 'normal' | 'clear' | 'assist' | 'unacc' | 'partial' | 'nodata';

export interface FloorSummary {
  floor: number;
  state: FloorState;
  total: number;
  safe: number;
  waiting: number;
  unacc: number;
  active: number;
  stale: number;
  hazard: boolean;
  staging: boolean;
}

export const FLOOR_LABEL: Record<FloorState, string> = {
  empty: 'No one on record',
  normal: 'Normal, no incident',
  clear: 'All accounted for',
  assist: 'Assistance required',
  unacc: 'Unaccounted occupants',
  partial: 'Partial: people still reporting',
  nodata: 'No recent data',
};

export const FLOOR_COLOR: Record<FloorState, string> = {
  empty: VIZ.slab,
  normal: VIZ.slab,
  clear: VIZ.safe,
  assist: VIZ.waiting,
  unacc: VIZ.unacc,
  partial: VIZ.active,
  nodata: VIZ.nodata,
};

/**
 * Floor status from occupant data, counted by home floor (the floor a person belongs to).
 * Green only when every counted person has a confirmed safe check-in; an empty floor is never green.
 */
export function floorSummary(floor: number, occupants: OccupantView[], incident: IncidentView | null): FloorSummary {
  const people = occupants.filter((o) => o.homeFloor === floor);
  const s: FloorSummary = {
    floor,
    state: 'empty',
    total: people.length,
    safe: 0,
    waiting: 0,
    unacc: 0,
    active: 0,
    stale: 0,
    hazard: !!incident && incident.affectedFloors.includes(floor),
    staging: !!incident && incident.stagingFloor === floor,
  };
  for (const p of people) {
    if (p.status === 'safe') s.safe += 1;
    else if (p.status === 'waiting') s.waiting += 1;
    else if (p.status === 'unacc') s.unacc += 1;
    else s.active += 1;
    if (p.freshness === 'stale' || p.freshness === 'unknown') s.stale += 1;
  }
  if (!people.length) s.state = 'empty';
  else if (!incident) s.state = 'normal';
  else if (s.waiting) s.state = 'assist';
  else if (s.safe === s.total) s.state = 'clear';
  else if (people.every((p) => p.freshness === 'unknown')) s.state = 'nodata';
  else if (s.unacc) s.state = 'unacc';
  else s.state = 'partial';
  return s;
}

export function towerSummary(occupants: OccupantView[]) {
  const c = { total: 0, safe: 0, waiting: 0, unacc: 0, active: 0 };
  for (const o of occupants) {
    c.total += 1;
    if (o.status === 'safe') c.safe += 1;
    else if (o.status === 'waiting') c.waiting += 1;
    else if (o.status === 'unacc') c.unacc += 1;
    else c.active += 1;
  }
  return c;
}

/** Freshness from the age of the last location update (seconds on the incident clock). */
export function freshness(updatedSec: number | null, nowSec: number, safe: boolean): OccupantView['freshness'] {
  if (safe) return 'checked-in';
  if (updatedSec === null) return 'unknown';
  return nowSec - updatedSec <= 300 ? 'fresh' : 'stale';
}

export const FRESH_LABEL: Record<OccupantView['freshness'], string> = {
  fresh: 'Recently updated',
  stale: 'Outdated, last known only',
  unknown: 'Unknown, no update since sign-in',
  'checked-in': 'Confirmed by safe check-in',
};
