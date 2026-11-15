import { FLOOR_H } from './geometry';
import type { BPos, HistoryEntry } from './types';

interface Key {
  t: number;
  p: BPos;
  /** A location update the system received at this moment (QR scan, barometer, check-in). */
  label?: string;
  /** Jump here without a known path (e.g. a check-in from someone whose location was stale). */
  appear?: boolean;
}

/** Scripted movement: keyframes in simulation seconds, linearly interpolated. */
export class Track {
  keys: Key[];

  constructor(p: BPos, label?: string, t = 0) {
    this.keys = [{ t, p, label }];
  }

  get t() {
    return this.keys[this.keys.length - 1].t;
  }

  get p() {
    return this.keys[this.keys.length - 1].p;
  }

  private push(t: number, p: BPos, label?: string, appear?: boolean) {
    this.keys.push({ t, p, label, appear });
    return this;
  }

  until(t: number) {
    return t > this.t ? this.push(t, this.p) : this;
  }

  wait(dt: number) {
    return this.push(this.t + dt, this.p);
  }

  walk(to: { x: number; z: number }, label?: string, speed = 1.6) {
    const d = Math.hypot(to.x - this.p.x, to.z - this.p.z);
    return this.push(this.t + Math.max(0.3, d / speed), { f: this.p.f, x: to.x, z: to.z }, label);
  }

  /** Walk to the stairwell, then climb or descend to a floor. */
  stairs(stair: { x: number; z: number }, toFloor: number, label?: string, secPerFloor = 1.2) {
    this.walk(stair);
    const dt = Math.abs(toFloor - this.p.f) * secPerFloor;
    return this.push(this.t + dt, { f: toFloor, x: stair.x, z: stair.z }, label);
  }

  lift(liftPos: { x: number; z: number }, toFloor: number, label?: string, secPerFloor = 0.18) {
    this.walk(liftPos);
    const dt = Math.max(1, Math.abs(toFloor - this.p.f) * secPerFloor);
    return this.push(this.t + dt, { f: toFloor, x: liftPos.x, z: liftPos.z }, label);
  }

  /** Drive along waypoints so that the last one is reached at time `arriveAt`. */
  drive(points: { x: number; z: number }[], arriveAt: number, label?: string) {
    let len = 0;
    let prev = this.p;
    for (const q of points) {
      len += Math.hypot(q.x - prev.x, q.z - prev.z);
      prev = { f: prev.f, ...q };
    }
    const start = this.t;
    let acc = 0;
    prev = this.p;
    points.forEach((q, i) => {
      acc += Math.hypot(q.x - prev.x, q.z - prev.z);
      prev = { f: prev.f, ...q };
      this.push(start + ((arriveAt - start) * acc) / (len || 1), { f: 1, x: q.x, z: q.z }, i === points.length - 1 ? label : undefined);
    });
    return this;
  }

  appearAt(t: number, p: BPos, label?: string) {
    this.until(t - 0.01);
    return this.push(t, p, label, true);
  }

  /** Copy another track's movement over a time window, with an offset (a team walking beside a person). */
  follow(other: Track, from: number, to: number, dx = 0.55) {
    for (const k of other.keys) {
      if (k.t >= from && k.t <= to) this.push(k.t, { f: k.p.f, x: k.p.x + dx, z: k.p.z });
    }
    return this;
  }

  posAt(t: number): BPos {
    const k = this.keys;
    if (t <= k[0].t) return k[0].p;
    for (let i = 0; i < k.length - 1; i += 1) {
      const a = k[i];
      const b = k[i + 1];
      if (t >= a.t && t < b.t) {
        if (b.appear) return a.p;
        const u = (t - a.t) / (b.t - a.t || 1);
        return { f: a.p.f + (b.p.f - a.p.f) * u, x: a.p.x + (b.p.x - a.p.x) * u, z: a.p.z + (b.p.z - a.p.z) * u };
      }
    }
    return k[k.length - 1].p;
  }

  movingAt(t: number): boolean {
    const k = this.keys;
    for (let i = 0; i < k.length - 1; i += 1) {
      const a = k[i];
      const b = k[i + 1];
      if (t >= a.t && t < b.t && !b.appear) {
        return a.p.f !== b.p.f || a.p.x !== b.p.x || a.p.z !== b.p.z;
      }
    }
    return false;
  }

  /** Vertical movement means the barometer is reporting floor changes. */
  climbingAt(t: number): boolean {
    const p1 = this.posAt(t);
    const p2 = this.posAt(t + 0.05);
    return Math.abs(p2.f - p1.f) * FLOOR_H > 0.0001;
  }

  /** Location updates received up to time t, newest first, mapped to clock seconds. */
  history(t: number, clock: (t: number) => number): HistoryEntry[] {
    return this.keys
      .filter((k) => k.label && k.t <= t)
      .map((k) => ({ label: k.label as string, sec: clock(k.t) }))
      .reverse();
  }

  lastUpdate(t: number): number | null {
    let last: number | null = null;
    for (const k of this.keys) if (k.label && k.t <= t) last = k.t;
    return last;
  }
}
