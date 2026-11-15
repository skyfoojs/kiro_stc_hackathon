import type { IncidentKind, Person } from '@/types/command';

import { TOWERS } from './demo-data';
import type { Action } from './store';

/**
 * Same-origin demo link to the customer app (Command spec section 9).
 * Swap this for a Supabase Realtime channel when the backend exists; the actions stay the same.
 */
export const CHANNEL_NAME = 'appname-demo';

interface Msg {
  type?: string;
  person?: string;
  where?: string;
  auto?: boolean;
  by?: string;
  role?: string;
  place?: string;
  gps?: boolean;
  incident?: { kind?: IncidentKind; tower?: string; floor?: number };
}

export function messageToAction(raw: unknown, people: Person[]): Action | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Msg;
  const p = m.person ? people.find((x) => x.name === m.person) : undefined;
  switch (m.type) {
    case 'incident.start': {
      const tower = TOWERS.find((t) => t.name === m.incident?.tower) ?? TOWERS[2];
      return { type: 'trigger', kind: m.incident?.kind ?? 'fire', towerId: tower.id, floor: m.incident?.floor ?? 22 };
    }
    case 'incident.end':
      return { type: 'end-incident' };
    case 'help.request':
      return p ? { type: 'external', action: { kind: 'help-request', personId: p.id, where: m.where ?? 'Stairwell B waiting point', auto: !!m.auto } } : null;
    case 'help.cancel':
      return p ? { type: 'external', action: { kind: 'help-cancel', personId: p.id } } : null;
    case 'help.ack':
      return p ? { type: 'external', action: { kind: 'help-ack', personId: p.id, by: m.by ?? 'Rescue team', rescue: m.role === 'rescue' } } : null;
    case 'checkin':
      return p ? { type: 'external', action: { kind: 'checkin', personId: p.id, place: m.place ?? 'Assembly point A', gps: !!m.gps } } : null;
    default:
      return null;
  }
}
