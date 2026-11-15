import { SIM_SPEEDS, type SimSpeed } from '@/hooks/use-sim-clock';
import type { TimelineEvent } from '@/lib/command/building3d/types';
import { hm } from '@/lib/command/time';

interface Props {
  mode: 'sim' | 'live';
  onMode: (m: 'sim' | 'live') => void;
  t: number;
  end: number;
  playing: boolean;
  speed: SimSpeed;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSeek: (t: number) => void;
  onSpeed: (s: SimSpeed) => void;
  events: TimelineEvent[];
  onEventFloor: (n: number) => void;
}

/** Playback controls (simulation only) and a compact event timeline, newest first. */
export default function SimBar(p: Props) {
  const recent = [...p.events].reverse().slice(0, 12);
  return (
    <section className="b3d-simbar" aria-label="Simulation and timeline">
      <div className="b3d-sim-controls">
        <div className="b3d-seg" role="group" aria-label="Data source">
          <button type="button" aria-pressed={p.mode === 'sim'} onClick={() => p.onMode('sim')}>
            Simulation
          </button>
          <button type="button" aria-pressed={p.mode === 'live'} onClick={() => p.onMode('live')}>
            Live Command data
          </button>
        </div>
        {p.mode === 'sim' ? (
          <>
            {p.playing ? (
              <button type="button" className="b3d-btn" onClick={p.onPause}>
                Pause
              </button>
            ) : (
              <button type="button" className="b3d-btn b3d-btn-go" onClick={p.onPlay}>
                {p.t >= p.end ? 'Replay' : p.t > 0 ? 'Resume' : 'Play scenario'}
              </button>
            )}
            <button type="button" className="b3d-btn b3d-btn-sec" onClick={p.onStep} disabled={p.t >= p.end}>
              Step forward
            </button>
            <button type="button" className="b3d-btn b3d-btn-sec" onClick={p.onReset}>
              Reset
            </button>
            <div className="b3d-seg" role="group" aria-label="Simulation speed">
              {SIM_SPEEDS.map((s) => (
                <button key={s} type="button" aria-pressed={p.speed === s} onClick={() => p.onSpeed(s)}>
                  {s}x
                </button>
              ))}
            </div>
            <label className="b3d-scrub">
              <span className="sr-only">Scenario time</span>
              <input type="range" min={0} max={p.end} step={0.5} value={p.t} onChange={(e) => p.onSeek(Number(e.target.value))} />
            </label>
          </>
        ) : (
          <span className="b3d-sub">Showing the live Command state. Trigger the fire from the dashboard to see it here.</span>
        )}
      </div>
      <ol className="b3d-timeline" aria-label="Event timeline, newest first">
        {recent.map((e) => (
          <li key={e.id} className={`tone-${e.tone}`}>
            <span className="tab">{hm(e.sec)}</span>
            {e.floor ? (
              <button type="button" className="b3d-link" onClick={() => p.onEventFloor(e.floor as number)}>
                {e.text}
              </button>
            ) : (
              <span>{e.text}</span>
            )}
          </li>
        ))}
        {recent.length === 0 && <li className="b3d-empty">No events yet. Press Play scenario to start the Level 22 fire.</li>}
      </ol>
    </section>
  );
}
