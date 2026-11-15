import { duration, hms } from '@/lib/command/time';

import type { OccupantView } from './types';

/** Names follow Relay's rule: security and admin see names; the Bomba commander only after opening details (logged). */
export function displayName(o: OccupantView, canSee: boolean): string {
  if (canSee) return o.name;
  if (o.status === 'waiting') return 'Person waiting';
  if (o.status === 'unacc') return 'Unaccounted person';
  if (o.status === 'safe') return 'Person, checked in';
  return 'Person';
}

export function updatedText(sec: number | null, now: number): string {
  if (sec === null) return 'No update since sign-in';
  return `${hms(sec)}, ${duration(now - sec)} ago`;
}
