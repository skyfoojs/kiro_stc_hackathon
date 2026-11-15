import { FLOOR_LABEL, OCC_LABEL, TEAM_STATUS_LABEL, type FloorSummary } from '@/lib/command/building3d/status';
import { displayName } from '@/lib/command/building3d/present';
import type { Snapshot } from '@/lib/command/building3d/types';
import { hm } from '@/lib/command/time';

import type { HoverInfo } from './BuildingScene';

interface Props {
  hover: HoverInfo;
  snapshot: Snapshot;
  summaries: Map<number, FloorSummary>;
  canSee: boolean;
}

/** Small tooltip next to the pointer. Everything here is also in the detail panel, so hover is never required. */
export default function HoverCard({ hover, snapshot, summaries, canSee }: Props) {
  let title = '';
  let lines: string[] = [];
  if (hover.kind === 'occupant') {
    const o = snapshot.occupants.find((x) => x.id === hover.id);
    if (!o) return null;
    title = displayName(o, canSee);
    lines = [
      o.status === 'waiting' && !o.help?.ackBy ? 'Waiting, not acknowledged' : OCC_LABEL[o.status],
      o.place,
      o.updatedSec !== null ? `Updated ${hm(o.updatedSec)}` : 'No location update',
    ];
  } else if (hover.kind === 'team') {
    const t = snapshot.teams.find((x) => x.id === hover.id);
    if (!t) return null;
    title = t.name;
    lines = [TEAM_STATUS_LABEL[t.status], t.task];
  } else {
    const n = Number(hover.id);
    const s = summaries.get(n);
    title = hover.kind === 'waiting' ? `Waiting point, L${n}` : `Level ${n}`;
    lines = hover.kind === 'waiting' ? [`${s?.waiting ?? 0} waiting`] : [FLOOR_LABEL[s?.state ?? 'empty'], s?.total ? `${s.safe} of ${s.total} safe` : ''];
  }
  return (
    <div className="b3d-hover" style={{ left: hover.x + 14, top: hover.y + 14 }} role="tooltip">
      <b>{title}</b>
      {lines.filter(Boolean).map((l) => (
        <span key={l}>{l}</span>
      ))}
      <i>Click for details</i>
    </div>
  );
}
