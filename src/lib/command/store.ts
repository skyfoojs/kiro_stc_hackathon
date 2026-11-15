import type {
  AccountId,
  CommandState,
  CommanderReply,
  EventType,
  IncidentKind,
  MarkerNames,
  PlanState,
  QueueItem,
  ScheduledAction,
} from '@/types/command';

import {
  ACCOUNTS,
  CHECKIN_SCRIPT,
  DEFAULT_MARKERS,
  DEMO_FLOOR,
  DEMO_TOWER_ID,
  GUIDANCE,
  HELP_SCRIPT_AFTER,
  KIND_LABEL,
  PAST_INCIDENTS,
  RECIPIENTS,
  seedPeople,
  seedTeams,
  seedVisitors,
  TEAM_SCRIPT,
  TOWERS,
  VISITOR_SCRIPT,
} from './demo-data';
import { planLines, planSignature } from './plan';
import { floorCounts, nowSec, towerName } from './selectors';
import { duration, hm, hms } from './time';

/** Teams whose acknowledgement counts as a rescue acknowledgement for a help request (FR9). */
const RESCUE_TEAMS = new Set(['pantai', 'hangtuah', 'seputeh', 'highrise']);

export type Action =
  | { type: 'tick'; nowMs: number }
  | { type: 'sign-in'; account: AccountId }
  | { type: 'sign-out' }
  | { type: 'switch-role' }
  | { type: 'trigger'; kind: IncidentKind; towerId: string; floor: number }
  | { type: 'end-incident' }
  | { type: 'toggle-team'; teamId: string }
  | { type: 'send-plan' }
  | { type: 'send-updates' }
  | { type: 'edit-line'; lineId: string; text: string }
  | { type: 'commander-reply'; value: CommanderReply }
  | { type: 'lift-choice'; value: 'lift' | 'stairs' }
  | { type: 'mark-shared' }
  | { type: 'open-person'; personId: string; where: string }
  | { type: 'control-room-seen'; personId: string }
  | { type: 'mark-left'; personId: string }
  | { type: 'remove-profile'; personId: string }
  | { type: 'set-markers'; markers: MarkerNames }
  | { type: 'live-link'; connected: boolean }
  | { type: 'external'; action: ScheduledAction }
  | { type: 'reset'; nowMs: number };

function freshPlan(at: string): PlanState {
  return {
    version: 1,
    versionAt: at,
    overrides: {},
    changedLineId: null,
    changedAt: null,
    changedUntilSec: 0,
    sentAt: null,
    sentBy: null,
    reply: null,
    liftChoice: null,
  };
}

export function initialState(nowMs: number): CommandState {
  return {
    account: null,
    clockZeroMs: nowMs,
    nowMs,
    incident: null,
    people: seedPeople(),
    help: [],
    teams: seedTeams(),
    log: [],
    audit: [
      { id: 1, t: '09:12:40', by: 'Mr. Tan Kok Wai', byRole: 'Building Management', personId: 'aisyah', where: 'People and profiles', context: 'Admin view' },
    ],
    updates: [],
    plan: freshPlan(''),
    visitors: seedVisitors(),
    markers: DEFAULT_MARKERS,
    past: PAST_INCIDENTS,
    reportSharedAt: null,
    queue: [],
    liveLink: false,
    seq: 10,
  };
}

// ---------- small immutable helpers ----------

function addLog(s: CommandState, type: EventType, title: string, detail: string, floor = 'all'): CommandState {
  const id = s.seq + 1;
  return { ...s, seq: id, log: [...s.log, { id, t: hms(nowSec(s)), type, title, detail, floor }] };
}

function addUpdate(s: CommandState, text: string): CommandState {
  const id = s.seq + 1;
  return { ...s, seq: id, updates: [...s.updates, { id, t: hm(nowSec(s)), text, sent: false }] };
}

function schedule(s: CommandState, items: QueueItem[]): CommandState {
  return { ...s, queue: [...s.queue, ...items].sort((a, b) => a.atSec - b.atSec) };
}

function actorName(s: CommandState): string {
  return s.account ? ACCOUNTS[s.account].name : 'Control room';
}

// ---------- scheduled / external events ----------

function applyScheduled(s: CommandState, a: ScheduledAction): CommandState {
  const now = nowSec(s);
  switch (a.kind) {
    case 'help-request': {
      const p = s.people.find((x) => x.id === a.personId);
      if (!p || !s.incident) return s;
      let next: CommandState = {
        ...s,
        people: s.people.map((x) =>
          x.id === a.personId
            ? { ...x, status: 'wait', place: `L${x.floor}, ${a.where}`, time: hm(now), source: 'Barometer agrees: L' + x.floor }
            : x,
        ),
        help: [
          ...s.help.filter((h) => h.personId !== a.personId),
          { personId: a.personId, where: a.where, auto: a.auto, at: hms(now), atSec: now, acks: [], escalated: false },
        ],
      };
      const how = a.auto ? 'Sent automatically from the assistance profile.' : 'Tapped "I need help".';
      next = addLog(next, 'help', `Help requested: ${p.name}`, `L${p.floor}, ${a.where}. ${how}`, String(p.floor));
      next = addUpdate(next, `Help request on Level ${p.floor}: 1 person at the ${a.where}, cannot use stairs.`);
      return schedule(next, [{ atSec: now + 60, action: { kind: 'escalation-check', personId: a.personId } }]);
    }
    case 'help-cancel': {
      const p = s.people.find((x) => x.id === a.personId);
      if (!p || p.status !== 'wait') return s;
      const next: CommandState = {
        ...s,
        people: s.people.map((x) => (x.id === a.personId ? { ...x, status: 'unacc', source: 'Help request cancelled' } : x)),
        help: s.help.filter((h) => h.personId !== a.personId),
      };
      return addLog(next, 'help', `Help request cancelled: ${p.name}`, 'Cancelled from the phone. Still not checked in.', String(p.floor));
    }
    case 'help-ack': {
      const h = s.help.find((x) => x.personId === a.personId);
      const p = s.people.find((x) => x.id === a.personId);
      if (!h || !p) return s;
      const next = {
        ...s,
        help: s.help.map((x) =>
          x.personId === a.personId ? { ...x, escalated: a.rescue ? false : x.escalated, acks: [...x.acks, { by: a.by, rescue: a.rescue, at: hms(now), atSec: now }] } : x,
        ),
      };
      return addLog(next, 'ack', `Help request acknowledged by ${a.by}`, `${p.name}, ${duration(now - h.atSec)} after the request.`, String(p.floor));
    }
    case 'escalation-check': {
      const h = s.help.find((x) => x.personId === a.personId);
      const p = s.people.find((x) => x.id === a.personId);
      if (!h || !p || p.status !== 'wait' || h.acks.some((k) => k.rescue)) return s;
      const next = { ...s, help: s.help.map((x) => (x.personId === a.personId ? { ...x, escalated: true } : x)) };
      return addLog(next, 'esc', `Escalated to control room: ${p.name}`, 'Not acknowledged by a rescue team within 60 s.', String(p.floor));
    }
    case 'checkin': {
      const p = s.people.find((x) => x.id === a.personId);
      if (!p || p.status === 'safe') return s;
      let next: CommandState = {
        ...s,
        people: s.people.map((x) =>
          x.id === a.personId
            ? { ...x, status: 'safe', place: a.place, time: hm(now), source: a.gps ? 'GPS confirmed' : undefined }
            : x,
        ),
        help: s.help.filter((h) => h.personId !== a.personId),
      };
      const c = floorCounts(next, p.towerId, p.floor);
      next = addLog(
        next,
        'safe',
        `Checked in: ${p.name}`,
        `Safe at ${a.place}${a.gps ? ', GPS confirmed' : ''}. ${c.safe} of ${c.total} on L${p.floor} now safe.`,
        String(p.floor),
      );
      if (p.status === 'unacc') {
        next = addUpdate(next, `${p.name} checked in safe. Unaccounted on Level ${p.floor} is now ${c.unacc}.`);
      } else {
        next = addUpdate(next, `The person waiting on Level ${p.floor} checked in safe. Waiting on Level ${p.floor} is now ${c.wait}.`);
      }
      return next;
    }
    case 'visitor-checkin': {
      const v = s.visitors.find((x) => x.id === a.visitorId);
      if (!v || v.status === 'safe') return s;
      const next = {
        ...s,
        visitors: s.visitors.map((x) => (x.id === a.visitorId ? { ...x, status: 'safe' as const, last: `Assembly point A, ${hms(now)}` } : x)),
      };
      return addLog(next, 'safe', `Visitor checked in: ${v.name}`, 'Safe at Assembly point A.', String(v.floor));
    }
    case 'team-reply': {
      const team = s.teams.find((t) => t.id === a.teamId);
      if (!team) return s;
      let next: CommandState = {
        ...s,
        teams: s.teams.map((t) => (t.id === a.teamId ? { ...t, status: 'acknowledged', words: a.words, updated: hm(now) } : t)),
      };
      next = addLog(next, 'ack', `Acknowledged by ${team.name}`, `"${a.words}"`);
      if (RESCUE_TEAMS.has(a.teamId)) {
        const waiting = next.help.filter((h) => !h.acks.some((k) => k.rescue));
        for (const h of waiting) {
          const p = next.people.find((x) => x.id === h.personId);
          if (!p || p.status !== 'wait') continue;
          next = {
            ...next,
            help: next.help.map((x) =>
              x.personId === h.personId
                ? { ...x, escalated: false, acks: [...x.acks, { by: team.name, rescue: true, at: hms(now), atSec: now }] }
                : x,
            ),
          };
          next = addLog(next, 'ack', `Help request acknowledged by ${team.name}`, `${p.name}, ${duration(now - h.atSec)} after the request.`, String(p.floor));
        }
      }
      return next;
    }
  }
}

// ---------- main reducer ----------

function reduce(s: CommandState, action: Action): CommandState {
  switch (action.type) {
    case 'tick': {
      let next: CommandState = { ...s, nowMs: action.nowMs };
      const now = nowSec(next);
      const due = next.queue.filter((q) => q.atSec <= now);
      if (due.length) {
        next = { ...next, queue: next.queue.filter((q) => q.atSec > now) };
        for (const q of due) next = applyScheduled(next, q.action);
      }
      if (next.plan.changedLineId && now > next.plan.changedUntilSec) {
        next = { ...next, plan: { ...next.plan, changedLineId: null } };
      }
      return next;
    }
    case 'sign-in':
      return { ...s, account: action.account };
    case 'sign-out':
      return { ...s, account: null };
    case 'switch-role': {
      if (s.account !== 'hasnah' && s.account !== 'razak') return s;
      const to: AccountId = s.account === 'hasnah' ? 'razak' : 'hasnah';
      const next = { ...s, account: to };
      return addLog(next, 'role', `Now viewing as ${ACCOUNTS[to].roleLabel}`, `${ACCOUNTS[to].name}. Same live data.`);
    }
    case 'trigger': {
      const now = nowSec(s);
      const tower = TOWERS.find((t) => t.id === action.towerId);
      let next: CommandState = {
        ...s,
        incident: { kind: action.kind, towerId: action.towerId, floor: action.floor, startSec: now, by: actorName(s) },
        people: seedPeople(),
        help: [],
        teams: seedTeams().map((t) => (action.kind === 'security' && t.id === 'pdrm' ? { ...t, ticked: true, note: undefined } : t)),
        updates: [],
        plan: freshPlan(hm(now)),
        visitors: seedVisitors(),
        reportSharedAt: null,
        queue: [],
      };
      next = addLog(next, 'trig', 'Incident triggered', `${KIND_LABEL[action.kind]}, ${tower?.name}, Level ${action.floor}. By ${actorName(s)}.`, String(action.floor));
      next = addLog(next, 'send', 'Guidance sent', `${GUIDANCE[action.kind].label}. Sent to ${RECIPIENTS} people in ${tower?.name}.`);
      if (action.towerId === DEMO_TOWER_ID && action.floor === DEMO_FLOOR) {
        next = schedule(next, [
          { atSec: now + HELP_SCRIPT_AFTER, action: { kind: 'help-request', personId: 'aisyah', where: 'Stairwell B waiting point', auto: true } },
          ...CHECKIN_SCRIPT.map((c) => ({
            atSec: now + c.after,
            action: { kind: 'checkin' as const, personId: c.personId, place: 'Assembly point A', gps: c.gps },
          })),
          ...VISITOR_SCRIPT.map((v) => ({ atSec: now + v.after, action: { kind: 'visitor-checkin' as const, visitorId: v.visitorId } })),
        ]);
      }
      return next;
    }
    case 'end-incident': {
      if (!s.incident) return s;
      const inc = s.incident;
      const now = nowSec(s);
      const c = floorCounts(s, inc.towerId, inc.floor);
      let next: CommandState = {
        ...s,
        queue: [],
        past: [
          {
            label: '15 Nov 2026, ended',
            title: `${KIND_LABEL[inc.kind]}, ${towerName(inc.towerId)}`,
            detail: `Origin Level ${inc.floor}. ${duration(now - inc.startSec)}. ${c.unacc} unaccounted at the end.`,
          },
          ...s.past,
        ],
      };
      next = addLog(next, 'end', 'Incident ended', `By ${actorName(s)} after ${duration(now - inc.startSec)}.`);
      return { ...next, incident: null };
    }
    case 'toggle-team':
      return { ...s, teams: s.teams.map((t) => (t.id === action.teamId ? { ...t, ticked: !t.ticked } : t)) };
    case 'send-plan': {
      const now = nowSec(s);
      const ticked = s.teams.filter((t) => t.ticked);
      if (!ticked.length || !s.incident) return s;
      const fresh = ticked.filter((t) => t.status === 'not-sent');
      let next: CommandState = {
        ...s,
        teams: s.teams.map((t) => (t.ticked && t.status === 'not-sent' ? { ...t, status: 'sent', updated: hm(now) } : t)),
        plan: { ...s.plan, sentAt: hm(now), sentBy: actorName(s) },
        updates: s.updates.map((u) => ({ ...u, sent: true })),
      };
      next = addLog(next, 'send', `Plan version ${s.plan.version} sent for review`, `To ${ticked.map((t) => t.name).join(', ')}. Advice only.`);
      const script = TEAM_SCRIPT.filter((r) => fresh.some((t) => t.id === r.teamId));
      return schedule(
        next,
        script.map((r) => ({ atSec: now + r.after, action: { kind: 'team-reply' as const, teamId: r.teamId, words: r.words } })),
      );
    }
    case 'send-updates': {
      const pending = s.updates.filter((u) => !u.sent);
      if (!pending.length) return s;
      const next = { ...s, updates: s.updates.map((u) => ({ ...u, sent: true })) };
      return addLog(next, 'send', `Update sent to teams`, `${pending.length} change${pending.length === 1 ? '' : 's'}. Counts and floors to every team.`);
    }
    case 'edit-line': {
      const now = nowSec(s);
      const lines = planLines(s);
      const idx = lines.findIndex((l) => l.id === action.lineId);
      if (idx < 0) return s;
      let next: CommandState = {
        ...s,
        plan: {
          ...s.plan,
          overrides: { ...s.plan.overrides, [action.lineId]: action.text.trim() },
          version: s.plan.version + 1,
          versionAt: hm(now),
          changedLineId: action.lineId,
          changedAt: hm(now),
          changedUntilSec: now + 6,
        },
      };
      next = addLog(next, 'plan', `Plan line ${idx + 1} edited, version ${next.plan.version}`, `${actorName(s)}: "${action.text.trim()}"`);
      if (s.plan.sentAt) next = addUpdate(next, `Plan line ${idx + 1} changed: ${action.text.trim()}`);
      return next;
    }
    case 'commander-reply': {
      const next = { ...s, plan: { ...s.plan, reply: { value: action.value, at: hm(nowSec(s)) } } };
      return addLog(next, 'plan', `Bomba commander: ${action.value}`, `Reply to plan version ${s.plan.version}. Optional, logged.`);
    }
    case 'lift-choice': {
      const next = { ...s, plan: { ...s.plan, liftChoice: { value: action.value, at: hm(nowSec(s)) } } };
      const label = action.value === 'lift' ? `Fire lift from Level ${(s.incident?.floor ?? 3) - 2}` : 'Stairs';
      return addLog(next, 'plan', `Commander chose: ${label}`, 'Moving the person waiting. The commander decides; Relay does not.');
    }
    case 'mark-shared': {
      const now = nowSec(s);
      const next = { ...s, reportSharedAt: hms(now) };
      return addLog(next, 'doc', 'Report shared with Bomba', `Marked as shared by ${actorName(s)}.`);
    }
    case 'open-person': {
      if (!s.account) return s;
      const acc = ACCOUNTS[s.account];
      const id = s.seq + 1;
      return {
        ...s,
        seq: id,
        audit: [
          {
            id,
            t: hms(nowSec(s)),
            by: acc.name,
            byRole: acc.roleLabel,
            personId: action.personId,
            where: action.where,
            context: s.incident ? 'Live incident' : 'Admin view',
          },
          ...s.audit,
        ],
      };
    }
    case 'control-room-seen': {
      const now = nowSec(s);
      return {
        ...s,
        help: s.help.map((h) =>
          h.personId === action.personId && !h.acks.some((k) => !k.rescue)
            ? { ...h, acks: [...h.acks, { by: 'UOA security', rescue: false, at: hms(now), atSec: now }] }
            : h,
        ),
      };
    }
    case 'mark-left':
      return { ...s, people: s.people.map((p) => (p.id === action.personId ? { ...p, left: true } : p)) };
    case 'remove-profile':
      return { ...s, people: s.people.filter((p) => p.id !== action.personId || !p.left) };
    case 'set-markers':
      return { ...s, markers: action.markers };
    case 'live-link':
      return { ...s, liveLink: action.connected };
    case 'external':
      return applyScheduled(s, action.action);
    case 'reset':
      return { ...initialState(action.nowMs), account: s.account };
  }
}

/** Wraps the reducer: when a live change rewrites a plan line, bump the version and highlight that line (FR19). */
export function commandReducer(s: CommandState, action: Action): CommandState {
  const next = reduce(s, action);
  if (!next.incident || !s.incident || action.type === 'edit-line' || action.type === 'trigger') return next;
  const before = planSignature(s);
  const after = planSignature(next);
  const changed = Object.keys(after).find((k) => before[k] !== after[k]) ?? Object.keys(before).find((k) => !(k in after));
  if (!changed) return next;
  const now = nowSec(next);
  // Before the plan is sent it is a live draft; only changes after sending make a new version.
  const bump = !!next.plan.sentAt;
  return {
    ...next,
    plan: {
      ...next.plan,
      version: bump ? next.plan.version + 1 : next.plan.version,
      versionAt: bump ? hm(now) : next.plan.versionAt,
      changedLineId: changed in after ? changed : null,
      changedAt: hm(now),
      changedUntilSec: now + 5,
    },
  };
}
