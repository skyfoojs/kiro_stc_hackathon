import { BASE_SEC } from './demo-data';

const pad = (n: number) => String(n).padStart(2, '0');

/** Demo clock seconds-of-day for a real timestamp. */
export function demoSec(clockZeroMs: number, nowMs: number): number {
  return BASE_SEC + Math.floor((nowMs - clockZeroMs) / 1000);
}

/** "10:41:30" */
export function hms(sec: number): string {
  const s = ((sec % 86400) + 86400) % 86400;
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}

/** "10:41" */
export function hm(sec: number): string {
  return hms(sec).slice(0, 5);
}

/** "4 min 10 s" */
export function duration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  if (m === 0) return `${s % 60} s`;
  return `${m} min ${pad(s % 60)} s`;
}

export const TODAY_LABEL = '15 Nov 2026';
