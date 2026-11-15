import { Fragment, useEffect, useRef } from 'react';

import { useCommand } from '@/hooks/use-command';
import { TOWERS } from '@/lib/command/demo-data';
import { floorCounts } from '@/lib/command/selectors';

import Icon from './Icon';

interface Props {
  towerId: string;
  selected: number;
  onSelect: (floor: number) => void;
}

export default function FloorStack({ towerId, selected, onSelect }: Props) {
  const { state } = useCommand();
  const tower = TOWERS.find((t) => t.id === towerId) ?? TOWERS[2];
  const inc = state.incident?.towerId === towerId ? state.incident : null;
  const floors = Array.from({ length: tower.floors }, (_, i) => tower.floors - i);
  const listRef = useRef<HTMLDivElement>(null);

  // Open with the selected floor (the fire floor by default) in the middle of the list.
  useEffect(() => {
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (list && row) list.scrollTop = row.offsetTop - list.offsetTop - list.clientHeight / 2;
  }, [towerId]);

  return (
    <section className="card" aria-labelledby="stack-h" style={{ padding: '16px 12px' }}>
      <div className="row" style={{ justifyContent: 'space-between', padding: '0 8px 10px' }}>
        <h2 id="stack-h">Floors</h2>
        <span className="sub">{tower.floors} storeys</span>
      </div>
      <div className="frow head" aria-hidden="true">
        <span className="lbl">Floor</span>
        <span className="lbl">Status mix</span>
        <Icon name="safe" size={16} strokeWidth={2.6} />
        <Icon name="wait" size={16} strokeWidth={2.6} />
        <Icon name="unacc" size={16} strokeWidth={2.6} />
      </div>
      <div className="floors-list" ref={listRef}>
        {floors.map((f) => {
          const c = floorCounts(state, towerId, f);
          const origin = inc?.floor === f;
          const tag = !inc ? null : f === inc.floor - 2 ? 'Staging, 2 floors below' : f === inc.floor + 1 ? 'Above the fire, search next' : null;
          return (
            <Fragment key={f}>
              {origin && (
                <div className="otag">
                  <Icon name="fire" size={16} color="var(--navy)" />
                  Origin floor, open below
                </div>
              )}
              <button
                type="button"
                className={origin ? 'frow origin' : 'frow'}
                aria-pressed={selected === f}
                aria-label={`Level ${f}: ${c.safe} safe, ${c.wait} waiting for help, ${c.unacc} unaccounted for${origin ? ', origin floor' : ''}`}
                onClick={() => onSelect(f)}>
                <span className="fl">L{f}</span>
                <span className="bar">
                  <span className="s" style={{ flex: `${c.safe} 1 0` }} />
                  <span className="w" style={{ flex: `${c.wait} 1 0` }} />
                  <span className="u" style={{ flex: `${c.unacc} 1 0` }} />
                </span>
                <span className={c.safe ? 'cnt' : 'cnt z'}>{c.safe}</span>
                <span className={c.wait ? 'cnt' : 'cnt z'}>{c.wait}</span>
                <span className={c.unacc ? 'cnt' : 'cnt z'}>{c.unacc}</span>
              </button>
              {tag && <span className="ftag">{tag}</span>}
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}
