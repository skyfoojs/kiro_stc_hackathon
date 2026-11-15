import { displayName } from '@/lib/command/building3d/present';
import type { OccupantView } from '@/lib/command/building3d/types';
import { duration, hm } from '@/lib/command/time';

import OccChip from './OccChip';

interface Props {
  o: OccupantView;
  canSee: boolean;
  now: number;
  onPick: (id: string) => void;
}

export default function PersonRow({ o, canSee, now, onPick }: Props) {
  let meta = o.place;
  if (o.status === 'waiting' && o.help) meta = `${o.place}, waiting ${duration(now - o.help.atSec)}`;
  else if (o.updatedSec !== null) meta = `${o.place}, ${hm(o.updatedSec)}`;
  return (
    <li>
      <button type="button" className="b3d-person" onClick={() => onPick(o.id)}>
        <span className="who">
          <b>{displayName(o, canSee)}</b>
          <span>{meta}</span>
        </span>
        <OccChip o={o} />
      </button>
    </li>
  );
}
