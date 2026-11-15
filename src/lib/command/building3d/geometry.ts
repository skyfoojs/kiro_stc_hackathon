import type { BPos } from './types';

/**
 * Schematic building geometry. These are NOT real floor plans: a generic rectangular plate with a
 * central core, two stairwells, a Bomba lift lobby and a waiting point, named after the building map markers.
 */
export const PLATE_W = 16;
export const PLATE_D = 11;
export const FLOOR_H = 1.1;
export const EXPLODE_GAP = 3.2;

export const CORE = { x: 0, z: 0, w: 4.2, d: 3 };
export const STAIR_A = { x: -6.6, z: -4.1 };
export const STAIR_B = { x: 6.6, z: 4.1 };
export const LIFT = { x: 3, z: -0.6 };
export const WAIT_B = { x: 5, z: 4.1 };
export const ENTRANCE = { x: 0, z: PLATE_D / 2 + 0.4 };
export const LOBBY = { x: 1.6, z: 2.6 };
export const UNKNOWN_SLOT = { x: -7.3, z: 4.6 };

/** Outdoor points sit on the ground (floor 1 level) outside the footprint. */
export const ASSEMBLY = { x: -3, z: 17 };
export const ACCESS_POINT = { x: 1, z: 8.5 };
export const ROAD_START = { x: -38, z: 30 };
export const ROAD_MID = { x: -14, z: 13 };

export const at = (f: number, p: { x: number; z: number }): BPos => ({ f, x: p.x, z: p.z });

/** Small deterministic hash so the same person always gets the same desk position. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** Approximate desk area on a floor, avoiding the core and the stairwells. */
export function deskPos(id: string, floor: number): BPos {
  const a = hash(id);
  const b = hash(id + ':z');
  let x = -6.4 + a * 12.8;
  let z = -4.2 + b * 8.4;
  if (Math.abs(x - CORE.x) < CORE.w / 2 + 0.6 && Math.abs(z - CORE.z) < CORE.d / 2 + 0.6) {
    z = z < 0 ? -3.6 : 3.4;
  }
  if (Math.hypot(x - STAIR_A.x, z - STAIR_A.z) < 1.4) x += 2;
  if (Math.hypot(x - STAIR_B.x, z - STAIR_B.z) < 1.4) x -= 2.4;
  return { f: floor, x, z };
}

/** Slot n in a loose grid at the assembly point so checked-in markers do not overlap. */
export function assemblySlot(n: number): BPos {
  const col = n % 6;
  const row = Math.floor(n / 6);
  return { f: 1, x: ASSEMBLY.x - 2.5 + col * 1, z: ASSEMBLY.z - 1.5 + row * 1 };
}

export function unknownSlot(floor: number, n: number): BPos {
  return { f: floor, x: UNKNOWN_SLOT.x + n * 0.7, z: UNKNOWN_SLOT.z };
}

export function isOutside(p: BPos): boolean {
  return Math.abs(p.x) > PLATE_W / 2 + 0.2 || Math.abs(p.z) > PLATE_D / 2 + 0.2;
}

/** Waypoints between two positions, following stairwells and the fire lift rather than cutting through slabs. */
export function route(from: BPos, to: BPos): BPos[] {
  const fromOut = isOutside(from);
  const toOut = isOutside(to);
  if (fromOut && toOut) return [to];
  if (!fromOut && toOut) {
    const pts: BPos[] = [];
    if (Math.round(from.f) !== 1) pts.push(at(from.f, STAIR_A), at(1, STAIR_A));
    pts.push(at(1, ENTRANCE), to);
    return pts;
  }
  if (fromOut && !toOut) {
    const pts: BPos[] = [at(1, ACCESS_POINT), at(1, ENTRANCE), at(1, LIFT)];
    if (Math.round(to.f) !== 1) pts.push(at(to.f, LIFT));
    pts.push(to);
    return pts;
  }
  if (Math.round(from.f) === Math.round(to.f)) return [to];
  return [at(from.f, STAIR_B), at(to.f, STAIR_B), to];
}

export function pathLength(from: BPos, pts: BPos[]): number {
  let len = 0;
  let prev = from;
  for (const p of pts) {
    len += Math.hypot(p.x - prev.x, p.z - prev.z) + Math.abs(p.f - prev.f) * 2;
    prev = p;
  }
  return len;
}
