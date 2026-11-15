import type { CommandState, Person, Role } from '@/types/command';

import { ACCOUNTS, isCounted, TOWERS } from './demo-data';
import { demoSec } from './time';

export interface Counts {
  safe: number;
  wait: number;
  unacc: number;
  total: number;
}

function count(people: Person[]): Counts {
  const c = { safe: 0, wait: 0, unacc: 0, total: 0 };
  for (const p of people) {
    if (!isCounted(p)) continue;
    c[p.status] += 1;
    c.total += 1;
  }
  return c;
}

export function floorCounts(state: CommandState, towerId: string, floor: number): Counts {
  return count(state.people.filter((p) => p.towerId === towerId && p.floor === floor));
}

export function towerCounts(state: CommandState, towerId: string): Counts {
  return count(state.people.filter((p) => p.towerId === towerId));
}

export function floorsWithUnaccounted(state: CommandState, towerId: string): number {
  const floors = new Set(
    state.people.filter((p) => isCounted(p) && p.towerId === towerId && p.status === 'unacc').map((p) => p.floor),
  );
  return floors.size;
}

export function nowSec(state: CommandState): number {
  return demoSec(state.clockZeroMs, state.nowMs);
}

export function role(state: CommandState): Role | null {
  return state.account ? ACCOUNTS[state.account].role : null;
}

export function towerName(id: string): string {
  return TOWERS.find((t) => t.id === id)?.name ?? id;
}

export function person(state: CommandState, id: string): Person | undefined {
  return state.people.find((p) => p.id === id);
}

/** Unaccounted people ranked by how recent their last known location is (G6). No update sorts last. */
export function rankUnaccounted(people: Person[]): Person[] {
  return [...people].sort((a, b) => (b.time ?? '').localeCompare(a.time ?? ''));
}

/** A help request is urgent (orange) until a rescue team acknowledges it (FR9). */
export function isRescueAcked(state: CommandState, personId: string): boolean {
  const h = state.help.find((r) => r.personId === personId);
  return !!h?.acks.some((a) => a.rescue);
}

export function activeHelp(state: CommandState) {
  return state.help.filter((h) => state.people.find((p) => p.id === h.personId)?.status === 'wait');
}

/** Names are visible to security and admin. The Bomba commander sees them only inside Details (FR21). */
export function canSeeNames(r: Role | null): boolean {
  return r === 'security' || r === 'admin';
}
