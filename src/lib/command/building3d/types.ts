import type { AssistLevel, IncidentKind, TeamStatus } from '@/types/command';

/** A point in building coordinates: fractional floor number (1 = ground / lobby) plus a schematic x/z on the floor plate. */
export interface BPos {
  f: number;
  x: number;
  z: number;
}

/**
 * Status shown in the 3D view. Derived from Relay's safe / wait / unacc plus location freshness:
 * active = inside with a fresh location but not checked in yet, assist = self-declared stair-help profile.
 */
export type OccStatus = 'active' | 'assist' | 'waiting' | 'unacc' | 'safe';

export type Freshness = 'fresh' | 'stale' | 'unknown' | 'checked-in';

export interface HelpView {
  atSec: number;
  where: string;
  auto: boolean;
  /** First rescue-team acknowledgement, if any. */
  ackBy: string | null;
  ackAtSec: number | null;
  seenByControlRoom: boolean;
  escalated: boolean;
  teamId: string | null;
}

export interface HistoryEntry {
  label: string;
  sec: number;
}

export interface OccupantView {
  id: string;
  name: string;
  company: string;
  towerId: string;
  /** Assigned floor from the profile. */
  homeFloor: number;
  status: OccStatus;
  assist: AssistLevel;
  condition?: string;
  need?: string;
  note?: string;
  /** Current or last known position. f is fractional while moving between floors. */
  pos: BPos;
  outside: boolean;
  place: string;
  source: string;
  updatedSec: number | null;
  freshness: Freshness;
  moving: boolean;
  history: HistoryEntry[];
  help: HelpView | null;
  /** Simulated people are not in the Relay roster. */
  simulated: boolean;
}

export type TeamCategory = 'bomba' | 'specialist' | 'emrs' | 'ert' | 'police';

export interface TeamView {
  id: string;
  name: string;
  short: string;
  category: TeamCategory;
  status: TeamStatus;
  pos: BPos;
  outside: boolean;
  assignedFloor: number | null;
  task: string;
  words: string;
  eta: string | null;
  updated: string | null;
  /** Occupant this team is tasked with, for drawing a link. */
  targetId: string | null;
}

export interface IncidentView {
  kind: IncidentKind;
  towerId: string;
  floor: number;
  startSec: number;
  affectedFloors: number[];
  stagingFloor: number;
  /** Reported constraints only, e.g. "Stairwell A blocked on L22". Empty when none were reported. */
  blocked: string[];
  liftChoice: string | null;
}

export interface TimelineEvent {
  id: string;
  sec: number;
  text: string;
  tone: 'urgent' | 'help' | 'safe' | 'team' | 'info';
  floor: number | null;
}

export interface Snapshot {
  mode: 'live' | 'sim';
  nowSec: number;
  towerId: string;
  incident: IncidentView | null;
  occupants: OccupantView[];
  teams: TeamView[];
  events: TimelineEvent[];
}

export type Selection =
  | { kind: 'floor'; floor: number }
  | { kind: 'occupant'; id: string }
  | { kind: 'team'; id: string }
  | { kind: 'waiting'; floor: number };

export type LayerKey =
  | 'occupants'
  | 'assistance'
  | 'unaccounted'
  | 'teams'
  | 'trails'
  | 'hazards'
  | 'stairwells'
  | 'lifts'
  | 'waiting'
  | 'floorStatus';

export type Layers = Record<LayerKey, boolean>;

export type FilterKey = 'all' | 'help' | 'waiting' | 'unacc' | 'stale' | 'teams' | 'incident';
