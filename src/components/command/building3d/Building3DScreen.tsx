import { useMemo, useRef, useState } from 'react';

import { useCommand } from '@/hooks/use-command';
import { useSimClock } from '@/hooks/use-sim-clock';
import { liveSnapshot } from '@/lib/command/building3d/live';
import { SIM_END, simSnapshot } from '@/lib/command/building3d/scenario';
import { floorSummary, OCC_LABEL, towerSummary, type FloorSummary } from '@/lib/command/building3d/status';
import type { FilterKey, LayerKey, Layers, OccupantView, Selection, Snapshot } from '@/lib/command/building3d/types';
import { DEMO_TOWER_ID, TOWERS } from '@/lib/command/demo-data';
import { canSeeNames, role } from '@/lib/command/selectors';

import BuildingCanvas, { type SceneApi } from './BuildingCanvas';
import type { HoverInfo, SceneView } from './BuildingScene';
import FloorDetail from './FloorDetail';
import FloorPanel from './FloorPanel';
import HoverCard from './HoverCard';
import InfoBar from './InfoBar';
import LayerControls from './LayerControls';
import OccupantDetail from './OccupantDetail';
import Overview from './Overview';
import SearchFilter, { type SearchResult } from './SearchFilter';
import SimBar from './SimBar';
import TeamDetail from './TeamDetail';
import WaitingDetail from './WaitingDetail';

import './building3d.css';

const ALL_LAYERS: Layers = {
  occupants: true,
  assistance: true,
  unaccounted: true,
  teams: true,
  trails: true,
  hazards: true,
  stairwells: true,
  lifts: true,
  waiting: true,
  floorStatus: true,
};

function passesFilter(o: OccupantView, f: FilterKey, s: Snapshot): boolean {
  switch (f) {
    case 'all':
      return true;
    case 'help':
      return o.assist !== 'No' || o.status === 'waiting';
    case 'waiting':
      return o.status === 'waiting';
    case 'unacc':
      return o.status === 'unacc';
    case 'stale':
      return o.status !== 'safe' && (o.freshness === 'stale' || o.freshness === 'unknown');
    case 'teams':
      return false;
    case 'incident':
      return !!s.incident && (s.incident.affectedFloors.includes(o.homeFloor) || s.incident.affectedFloors.includes(Math.round(o.pos.f)));
  }
}

/** Command page: live 3D situational awareness of one tower, backed by the Command store or a scripted simulation. */
export default function Building3DScreen() {
  const { state, dispatch } = useCommand();
  const canSee = canSeeNames(role(state));
  const sim = useSimClock(SIM_END);
  const api = useRef<SceneApi | null>(null);

  const [mode, setMode] = useState<'sim' | 'live'>('sim');
  const [towerId, setTowerId] = useState(DEMO_TOWER_ID);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [floor, setFloor] = useState<number | null>(null);
  const [exploded, setExploded] = useState(false);
  const [isolate, setIsolate] = useState(false);
  const [layers, setLayers] = useState<Layers>(ALL_LAYERS);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [revealed, setRevealed] = useState<string[]>([]);

  const base = useMemo(() => (mode === 'sim' ? simSnapshot(sim.t) : liveSnapshot(state)), [mode, sim.t, state]);
  const snapshot: Snapshot = useMemo(() => {
    const here = base.incident?.towerId === towerId;
    return {
      ...base,
      towerId,
      incident: here ? base.incident : null,
      teams: here ? base.teams : [],
      occupants: base.occupants.filter((o) => o.towerId === towerId),
    };
  }, [base, towerId]);

  const floors = TOWERS.find((t) => t.id === towerId)?.floors ?? 38;
  const summaries = useMemo(() => {
    const m = new Map<number, FloorSummary>();
    for (let n = 1; n <= floors; n += 1) m.set(n, floorSummary(n, snapshot.occupants, snapshot.incident));
    return m;
  }, [floors, snapshot]);
  const totals = useMemo(() => towerSummary(snapshot.occupants), [snapshot]);

  const q = query.trim().toLowerCase();
  const visibleIds = useMemo(() => {
    if (filter === 'all' && !q) return null;
    const ids = new Set<string>();
    for (const o of snapshot.occupants) {
      const text = `l${o.homeFloor} l${Math.round(o.pos.f)} ${OCC_LABEL[o.status]} ${canSee ? `${o.name} ${o.company}` : ''}`.toLowerCase();
      if (passesFilter(o, filter, snapshot) && (!q || text.includes(q))) ids.add(o.id);
    }
    for (const t of snapshot.teams) {
      const text = `${t.name} ${t.short} l${t.assignedFloor ?? ''}`.toLowerCase();
      if ((filter === 'all' || filter === 'teams' || filter === 'incident') && (!q || text.includes(q))) ids.add(t.id);
    }
    return ids;
  }, [filter, q, snapshot, canSee]);

  const results: SearchResult[] = useMemo(() => {
    if (!q) return [];
    const out: SearchResult[] = [];
    for (const o of snapshot.occupants) {
      if (!visibleIds?.has(o.id)) continue;
      out.push({ id: o.id, title: canSee ? o.name : OCC_LABEL[o.status], sub: `L${o.homeFloor}, ${o.place}` });
    }
    for (const t of snapshot.teams) if (visibleIds?.has(t.id)) out.push({ id: t.id, title: t.name, sub: t.task });
    return out;
  }, [q, snapshot, visibleIds, canSee]);

  const view: SceneView = useMemo(
    () => ({ floors, snapshot, summaries, layers, selection, floor, exploded, isolate, visibleIds }),
    [floors, snapshot, summaries, layers, selection, floor, exploded, isolate, visibleIds],
  );

  // ---------- actions ----------

  const audit = (id: string) => {
    const o = snapshot.occupants.find((x) => x.id === id);
    if (o && !o.simulated) dispatch({ type: 'open-person', personId: id, where: '3D building' });
  };

  const select = (s: Selection | null) => {
    setSelection(s);
    if (s?.kind === 'floor' || s?.kind === 'waiting') setFloor(s.floor);
    if (s?.kind === 'occupant' && canSee) audit(s.id);
  };

  const pickEntity = (id: string) => {
    const isTeam = snapshot.teams.some((t) => t.id === id);
    select(isTeam ? { kind: 'team', id } : { kind: 'occupant', id });
    api.current?.focusEntity(id);
  };

  const goFloor = (n: number) => {
    select({ kind: 'floor', floor: n });
    api.current?.focusFloor(n);
  };

  const toggleExplode = () => {
    const f = floor ?? snapshot.incident?.floor ?? null;
    if (f === null) return;
    if (floor === null) setFloor(f);
    setExploded((x) => !x);
  };

  const reveal = (id: string) => {
    audit(id);
    setRevealed((r) => (r.includes(id) ? r : [...r, id]));
  };

  const changeTower = (id: string) => {
    setTowerId(id);
    setSelection(null);
    setFloor(null);
    setExploded(false);
    setIsolate(false);
  };

  const changeMode = (m: 'sim' | 'live') => {
    sim.pause();
    setMode(m);
    setSelection(null);
  };

  // ---------- right panel ----------

  let detail;
  const sel = selection;
  const selOcc = sel?.kind === 'occupant' ? snapshot.occupants.find((o) => o.id === sel.id) : undefined;
  const selTeam = sel?.kind === 'team' ? snapshot.teams.find((t) => t.id === sel.id) : undefined;
  if (selOcc) {
    detail = (
      <OccupantDetail
        o={selOcc}
        snapshot={snapshot}
        canSee={canSee || revealed.includes(selOcc.id)}
        onReveal={() => reveal(selOcc.id)}
        onFocus={() => api.current?.focusEntity(selOcc.id)}
        onFloor={goFloor}
        onTeam={pickEntity}
      />
    );
  } else if (selTeam) {
    detail = <TeamDetail t={selTeam} onFocus={() => api.current?.focusEntity(selTeam.id)} onFloor={goFloor} />;
  } else if (sel?.kind === 'floor') {
    detail = (
      <FloorDetail
        floor={sel.floor}
        summary={summaries.get(sel.floor)}
        snapshot={snapshot}
        canSee={canSee}
        exploded={exploded}
        isolate={isolate}
        onExplode={toggleExplode}
        onIsolate={() => setIsolate((x) => !x)}
        onFocus={() => api.current?.focusFloor(sel.floor)}
        onPick={pickEntity}
        onTeam={pickEntity}
      />
    );
  } else if (sel?.kind === 'waiting') {
    detail = <WaitingDetail floor={sel.floor} snapshot={snapshot} canSee={canSee} onPick={pickEntity} />;
  } else {
    detail = <Overview snapshot={snapshot} canSee={canSee} onPick={pickEntity} onTeam={pickEntity} />;
  }

  return (
    <div
      className="b3d"
      onKeyDown={(e) => {
        if (e.key === 'Escape') setSelection(null);
      }}>
      <InfoBar snapshot={snapshot} />

      <aside className="b3d-left" aria-label="Building overview">
        <FloorPanel
          towerId={towerId}
          onTower={changeTower}
          floors={floors}
          summaries={summaries}
          totals={totals}
          selected={floor}
          onFloor={goFloor}
        />
        <SearchFilter
          filter={filter}
          onFilter={setFilter}
          query={query}
          onQuery={setQuery}
          canSearchNames={canSee}
          results={results}
          onPick={pickEntity}
        />
        <LayerControls layers={layers} onToggle={(k: LayerKey) => setLayers((l) => ({ ...l, [k]: !l[k] }))} />
      </aside>

      <div className="b3d-view">
        <BuildingCanvas view={view} resets={sim.resets} apiRef={api} onSelect={select} onHover={setHover} />
        {hover && <HoverCard hover={hover} snapshot={snapshot} summaries={summaries} canSee={canSee} />}
        <div className="b3d-view-tools" role="toolbar" aria-label="View">
          <button type="button" onClick={() => api.current?.resetCamera()}>
            Reset view
          </button>
          <button type="button" aria-pressed={exploded} onClick={toggleExplode}>
            {exploded ? 'Close floors' : 'Explode floors'}
          </button>
          <button type="button" aria-pressed={isolate} disabled={floor === null} onClick={() => setIsolate((x) => !x)}>
            Isolate floor
          </button>
          {floor !== null && (
            <button
              type="button"
              onClick={() => {
                setFloor(null);
                setExploded(false);
                setIsolate(false);
                setSelection(null);
              }}>
              Clear floor L{floor}
            </button>
          )}
        </div>
        <p className="b3d-view-hint">Drag to rotate, scroll or pinch to zoom, right-drag to pan. Positions are approximate.</p>
      </div>

      <aside className="b3d-right" aria-label="Details">
        {sel && (
          <button type="button" className="b3d-link b3d-back" onClick={() => setSelection(null)}>
            Back to overview
          </button>
        )}
        {detail}
      </aside>

      <SimBar
        mode={mode}
        onMode={changeMode}
        t={sim.t}
        end={SIM_END}
        playing={sim.playing}
        speed={sim.speed}
        onPlay={sim.play}
        onPause={sim.pause}
        onStep={sim.step}
        onReset={sim.reset}
        onSeek={sim.seek}
        onSpeed={sim.setSpeed}
        events={snapshot.events}
        onEventFloor={goFloor}
      />
    </div>
  );
}
