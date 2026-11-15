import { useState } from 'react';

import Icon from '@/components/command/Icon';
import { TOWERS } from '@/lib/command/demo-data';
import { FLOOR_LABEL, type FloorSummary } from '@/lib/command/building3d/status';

interface Props {
  towerId: string;
  onTower: (id: string) => void;
  floors: number;
  summaries: Map<number, FloorSummary>;
  totals: { total: number; safe: number; waiting: number; unacc: number; active: number };
  selected: number | null;
  onFloor: (n: number) => void;
}

/** Tower selector, building summary and the floor status list. Selecting a floor focuses the 3D camera. */
export default function FloorPanel({ towerId, onTower, floors, summaries, totals, selected, onFloor }: Props) {
  const [showAll, setShowAll] = useState(false);
  const list = Array.from({ length: floors }, (_, i) => floors - i).filter((n) => {
    if (showAll || n === selected) return true;
    const s = summaries.get(n);
    return !!s && (s.total > 0 || s.hazard || s.staging);
  });

  return (
    <section className="b3d-card" aria-labelledby="b3d-floors-h">
      <div className="b3d-field">
        <label htmlFor="b3d-tower" className="b3d-lbl">
          Tower
        </label>
        <select id="b3d-tower" value={towerId} onChange={(e) => onTower(e.target.value)}>
          {TOWERS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.floors} floors)
            </option>
          ))}
        </select>
      </div>

      <div className="b3d-totals" aria-label="Building occupancy">
        <span className="b3d-count c-wait">
          <Icon name="wait" size={16} color="var(--b3d-wait)" />
          <b className="tab">{totals.waiting}</b> waiting
        </span>
        <span className="b3d-count c-safe">
          <Icon name="safe" size={16} color="var(--b3d-safe)" />
          <b className="tab">{totals.safe}</b> safe
        </span>
        <span className="b3d-count c-unacc">
          <Icon name="unacc" size={16} color="var(--b3d-unacc)" />
          <b className="tab">{totals.unacc}</b> unaccounted
        </span>
        <span className="b3d-count c-active">
          <Icon name="eye" size={16} color="var(--b3d-active)" />
          <b className="tab">{totals.active}</b> inside, updating
        </span>
      </div>

      <div className="b3d-row-between">
        <h2 id="b3d-floors-h" className="b3d-h">
          Floors
        </h2>
        <button type="button" className="b3d-link" onClick={() => setShowAll((x) => !x)} aria-pressed={showAll}>
          {showAll ? 'Only floors with people' : `Show all ${floors}`}
        </button>
      </div>
      <ul className="b3d-floors">
        {list.map((n) => {
          const s = summaries.get(n);
          const state = s?.state ?? 'empty';
          return (
            <li key={n}>
              <button
                type="button"
                className={`b3d-floor fs-${state}`}
                aria-current={selected === n ? 'true' : undefined}
                onClick={() => onFloor(n)}>
                <span className="n">L{n}</span>
                <span className="mid">
                  <span className="st-line">
                    {s?.hazard && (
                      <span className="hz">
                        <Icon name="fire" size={13} /> Fire floor
                      </span>
                    )}
                    {s?.staging && <span className="st">Staging</span>}
                    <span className="lab">{FLOOR_LABEL[state]}</span>
                  </span>
                  {s && s.total > 0 && (
                    <span className="nums tab" aria-label={`${s.waiting} waiting, ${s.safe} safe, ${s.unacc} unaccounted`}>
                      <Icon name="wait" size={13} color="var(--b3d-wait)" />
                      {s.waiting}
                      <Icon name="safe" size={13} color="var(--b3d-safe)" />
                      {s.safe}
                      <Icon name="unacc" size={13} color="var(--b3d-unacc)" />
                      {s.unacc}
                      {s.active > 0 && (
                        <>
                          <Icon name="eye" size={13} color="var(--b3d-active)" />
                          {s.active}
                        </>
                      )}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
        {list.length === 0 && <li className="b3d-empty">No one on record in this tower.</li>}
      </ul>
    </section>
  );
}
