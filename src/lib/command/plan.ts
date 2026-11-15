import type { CommandState, PlanLine } from '@/types/command';

import { KIND_LABEL, MAP_PLACES, TOWERS } from './demo-data';
import { floorCounts } from './selectors';

export function planTitle(state: CommandState): string {
  const inc = state.incident;
  if (!inc) return '';
  const tower = TOWERS.find((t) => t.id === inc.towerId);
  return `${KIND_LABEL[inc.kind]}, Level ${inc.floor}, ${tower?.name ?? ''}`;
}

/**
 * The five-line plan, built from the building map and live counts (G7: counts never come from the AI).
 * Hand edits from the control room replace a line until the incident ends.
 */
export function planLines(state: CommandState): PlanLine[] {
  const inc = state.incident;
  if (!inc) return [];
  const c = floorCounts(state, inc.towerId, inc.floor);
  const staging = Math.max(1, inc.floor - 2);
  const above = inc.floor + 1;
  const lines: PlanLine[] = [
    { id: 'in', text: 'Get in: appliances to the main entrance. Command at the fire command centre.' },
    { id: 'stage', text: `Stage on Level ${staging}. ERT hands over floor plans and lift control.` },
    { id: 'stairs', text: 'Crews go up Stairwell B. Occupants come down Stairwell A.' },
  ];
  if (c.wait > 0) {
    const who = c.wait === 1 ? '1 person' : `${c.wait} people`;
    lines.push({
      id: 'rescue',
      text: `Bomba rescue: Level ${inc.floor} waiting point, ${who}, cannot use stairs. Lift or stairs: commander decides.`,
    });
  }
  const unacc = c.unacc === 0 ? 'none unaccounted' : `${c.unacc} unaccounted`;
  lines.push({ id: 'search', text: `Bomba search: Level ${inc.floor} then ${above}, ${unacc}. EMRS: assembly point.` });
  return lines.map((l) => ({ ...l, text: state.plan.overrides[l.id] ?? l.text }));
}

/** Plain text used to detect when a live change rewrites a line. */
export function planSignature(state: CommandState): Record<string, string> {
  return Object.fromEntries(planLines(state).map((l) => [l.id, l.text]));
}

const HEADCOUNT = /\b\d+\s*(fire\s*fighters?|firemen|rescuers?|units?|engines?|appliances?|vehicles?|crews?|officers?|men|personnel)\b/i;
const LEVEL = /\blevel\s+(\d+)\b/gi;
const STAIRWELL = /\bstairwell\s+([a-z])\b/gi;

/** G7 checker for hand-edited lines. Returns a reason when the line is refused, otherwise null. */
export function checkLine(state: CommandState, text: string): string | null {
  const inc = state.incident;
  if (!inc) return 'No live incident.';
  const trimmed = text.trim();
  if (!trimmed) return 'A line cannot be empty.';
  if (trimmed.split(/\s+/).length > 20) return 'Keep each line to about 15 words so it fits one phone screen.';
  if (HEADCOUNT.test(trimmed)) return 'The plan never says how many rescuers, units or vehicles to send. Bomba decides that.';
  const tower = TOWERS.find((t) => t.id === inc.towerId);
  for (const m of trimmed.matchAll(LEVEL)) {
    const n = Number(m[1]);
    if (!tower || n < 1 || n > tower.floors) return `Level ${n} is not on the building map for ${tower?.name ?? 'this tower'}.`;
  }
  for (const m of trimmed.matchAll(STAIRWELL)) {
    const s = m[1].toUpperCase();
    if (s !== 'A' && s !== 'B') return `Stairwell ${s} is not on the building map.`;
  }
  if (/\b(warden|assistant|buddy)\b/i.test(trimmed)) return 'Wardens and assistants are not part of the response. Name a response team instead.';
  if (/\bERT\b.*\b(carry|carries|enter|fire floor)\b/i.test(trimmed)) return 'Only Bomba or specialist rescue enter the fire floor or carry. The building ERT never does.';
  const lower = trimmed.toLowerCase();
  const unknownPlace = /\b(refuge area|evacuation lift|helipad|roof)\b/.exec(lower);
  if (unknownPlace && !MAP_PLACES.includes(unknownPlace[1])) return `"${unknownPlace[1]}" is not on the building map.`;
  return null;
}
