export type Role = 'security' | 'commander' | 'admin';

export type AccountId = 'hasnah' | 'razak' | 'tan';

export interface Account {
  id: AccountId;
  name: string;
  roleLabel: string;
  initials: string;
  role: Role;
  perms: string[];
}

export type IncidentKind = 'fire' | 'earthquake' | 'outage' | 'security';

export type PersonStatus = 'safe' | 'wait' | 'unacc';

export type AssistLevel = 'Yes' | 'Sometimes' | 'No';

export interface Person {
  id: string;
  name: string;
  company: string;
  towerId: string;
  floor: number;
  status: PersonStatus;
  /** Last known place, e.g. "Assembly point A" or "Last seen L22". */
  place: string;
  /** Demo clock time of the last update, null when there is none since sign-in. */
  time: string | null;
  source?: string;
  assist: AssistLevel;
  condition?: string;
  note?: string;
  need?: string;
  left?: boolean;
}

export interface Tower {
  id: string;
  name: string;
  short: string;
  meta: string;
  floors: number;
}

export interface Incident {
  kind: IncidentKind;
  towerId: string;
  floor: number;
  /** Demo clock seconds-of-day when it was triggered. */
  startSec: number;
  by: string;
}

export interface HelpAck {
  by: string;
  rescue: boolean;
  at: string;
  atSec: number;
}

export interface HelpRequest {
  personId: string;
  where: string;
  auto: boolean;
  at: string;
  atSec: number;
  acks: HelpAck[];
  escalated: boolean;
}

export type TeamStatus =
  | 'not-sent'
  | 'sent'
  | 'acknowledged'
  | 'en-route'
  | 'at-staging'
  | 'on-floor'
  | 'person-reached'
  | 'done';

export interface Team {
  id: string;
  name: string;
  channel: string;
  ticked: boolean;
  note?: string;
  status: TeamStatus;
  words: string;
  updated: string | null;
}

export type EventType = 'trig' | 'send' | 'help' | 'ack' | 'esc' | 'safe' | 'doc' | 'plan' | 'role' | 'end';

export interface LogEvent {
  id: number;
  t: string;
  type: EventType;
  title: string;
  detail: string;
  floor: string;
}

export interface AuditEntry {
  id: number;
  t: string;
  by: string;
  byRole: string;
  personId: string;
  where: string;
  context: string;
}

export interface TeamUpdate {
  id: number;
  t: string;
  text: string;
  sent: boolean;
}

export type CommanderReply = 'Followed' | 'Changed' | 'Ignored';

export interface PlanState {
  version: number;
  versionAt: string;
  /** Lines the security role edited by hand, keyed by line id. */
  overrides: Record<string, string>;
  changedLineId: string | null;
  changedAt: string | null;
  changedUntilSec: number;
  sentAt: string | null;
  sentBy: string | null;
  reply: { value: CommanderReply; at: string } | null;
  liftChoice: { value: 'lift' | 'stairs'; at: string } | null;
}

export interface PlanLine {
  id: string;
  text: string;
}

export interface Visitor {
  id: string;
  name: string;
  visiting: string;
  towerId: string;
  floor: number;
  checkedIn: string;
  status: PersonStatus | 'elsewhere';
  last: string;
}

export interface MarkerNames {
  a: string;
  b: string;
  lift: string;
  wait: string;
  asm: string;
}

export interface PastIncident {
  label: string;
  title: string;
  detail: string;
}

/** A state change scheduled on the demo clock (scripted replies and check-ins). */
export type ScheduledAction =
  | { kind: 'help-request'; personId: string; where: string; auto: boolean }
  | { kind: 'checkin'; personId: string; place: string; gps: boolean }
  | { kind: 'help-cancel'; personId: string }
  | { kind: 'help-ack'; personId: string; by: string; rescue: boolean }
  | { kind: 'visitor-checkin'; visitorId: string }
  | { kind: 'team-reply'; teamId: string; words: string }
  | { kind: 'escalation-check'; personId: string };

export interface QueueItem {
  atSec: number;
  action: ScheduledAction;
}

export interface CommandState {
  account: AccountId | null;
  /** Real ms timestamp at which the demo clock read BASE_SEC. */
  clockZeroMs: number;
  nowMs: number;
  incident: Incident | null;
  people: Person[];
  help: HelpRequest[];
  teams: Team[];
  log: LogEvent[];
  audit: AuditEntry[];
  updates: TeamUpdate[];
  plan: PlanState;
  visitors: Visitor[];
  markers: MarkerNames;
  past: PastIncident[];
  reportSharedAt: string | null;
  queue: QueueItem[];
  liveLink: boolean;
  seq: number;
}
