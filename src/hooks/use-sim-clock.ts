import { useEffect, useRef, useState } from 'react';

export const SIM_SPEEDS = [0.5, 1, 2, 4] as const;
export type SimSpeed = (typeof SIM_SPEEDS)[number];

/** Simulation clock in scenario seconds. Ticks 5 times a second so React panels are not re-rendered every frame. */
export function useSimClock(end: number, stepSize = 5) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<SimSpeed>(1);
  const [resets, setResets] = useState(0);
  const tRef = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const next = Math.min(end, tRef.current + ((now - last) / 1000) * speed);
      last = now;
      tRef.current = next;
      setT(next);
      if (next >= end) setPlaying(false);
    }, 200);
    return () => clearInterval(id);
  }, [playing, speed, end]);

  const seek = (to: number) => {
    const next = Math.max(0, Math.min(end, to));
    if (next < tRef.current) setResets((r) => r + 1);
    tRef.current = next;
    setT(next);
  };

  return {
    t,
    playing,
    speed,
    /** Increments whenever time jumps backwards, so the scene can snap markers instead of animating. */
    resets,
    play: () => {
      if (tRef.current >= end) seek(0);
      setPlaying(true);
    },
    pause: () => setPlaying(false),
    step: () => seek(tRef.current + stepSize),
    reset: () => {
      setPlaying(false);
      seek(0);
      setResets((r) => r + 1);
    },
    seek,
    setSpeed,
  };
}
