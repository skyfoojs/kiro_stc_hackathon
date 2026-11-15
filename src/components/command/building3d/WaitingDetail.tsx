import type { Snapshot } from '@/lib/command/building3d/types';

import PersonRow from './PersonRow';
import TeamProgress from './TeamProgress';

interface Props {
  floor: number;
  snapshot: Snapshot;
  canSee: boolean;
  onPick: (id: string) => void;
}

export default function WaitingDetail({ floor, snapshot, canSee, onPick }: Props) {
  const waiting = snapshot.occupants.filter((o) => o.status === 'waiting' && Math.round(o.pos.f) === floor);
  const teamIds = new Set(waiting.map((o) => o.help?.teamId).filter((x): x is string => !!x));
  const teams = snapshot.teams.filter((t) => teamIds.has(t.id));

  return (
    <div className="b3d-detail">
      <div className="b3d-detail-head">
        <span className="b3d-lbl">Waiting point</span>
        <h2 className="b3d-title">Stairwell B waiting point, L{floor}</h2>
        <span className="b3d-sub">
          {waiting.length} {waiting.length === 1 ? 'person' : 'people'} waiting here
        </span>
      </div>
      {waiting.length === 0 ? (
        <p className="b3d-empty">No one is waiting here.</p>
      ) : (
        <ul className="b3d-list">
          {waiting.map((o) => (
            <PersonRow key={o.id} o={o} canSee={canSee} now={snapshot.nowSec} onPick={onPick} />
          ))}
        </ul>
      )}
      {teams.map((t) => (
        <section key={t.id} className="b3d-sec">
          <h3 className="b3d-h3">{t.name}</h3>
          <TeamProgress status={t.status} />
        </section>
      ))}
      <p className="b3d-note">Moving a person by lift or stairs is the Bomba commander&apos;s decision. Relay shows both options.</p>
    </div>
  );
}
