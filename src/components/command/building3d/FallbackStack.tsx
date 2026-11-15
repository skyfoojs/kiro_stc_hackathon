import { FLOOR_LABEL } from '@/lib/command/building3d/status';
import type { Selection } from '@/lib/command/building3d/types';

import type { SceneView } from './BuildingScene';

/** 2D building overview used when WebGL is not available. Same data, one bar per floor. */
export default function FallbackStack({ view, onSelect }: { view: SceneView; onSelect: (s: Selection) => void }) {
  const floors = Array.from({ length: view.floors }, (_, i) => view.floors - i);
  return (
    <ol className="b3d-stack" aria-label="Floors, top to bottom">
      {floors.map((n) => {
        const s = view.summaries.get(n);
        const state = s?.state ?? 'empty';
        return (
          <li key={n}>
            <button type="button" className={`b3d-stack-row fs-${state}`} onClick={() => onSelect({ kind: 'floor', floor: n })}>
              <b>L{n}</b>
              {s?.hazard && <span className="hz">Fire floor</span>}
              {s?.staging && <span className="st">Staging</span>}
              <span className="grow">{state === 'empty' ? '' : FLOOR_LABEL[state]}</span>
              {s && s.total > 0 && (
                <span className="tab">
                  {s.waiting} waiting, {s.safe} safe, {s.unacc} unaccounted
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
