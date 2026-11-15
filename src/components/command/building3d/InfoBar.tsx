import Icon from '@/components/command/Icon';
import { KIND_LABEL } from '@/lib/command/demo-data';
import type { Snapshot } from '@/lib/command/building3d/types';
import { towerName } from '@/lib/command/selectors';
import { duration, hms } from '@/lib/command/time';

const KIND_ICON = { fire: 'fire', earthquake: 'quake', outage: 'bolt', security: 'lock' } as const;

export default function InfoBar({ snapshot }: { snapshot: Snapshot }) {
  const inc = snapshot.incident;
  const lastUpdate = Math.max(
    ...snapshot.occupants.map((o) => o.updatedSec ?? 0),
    ...snapshot.events.map((e) => e.sec),
    0,
  );
  return (
    <header className={`b3d-info${inc ? ' live' : ''}`}>
      {inc ? (
        <>
          <span className="kind">
            <Icon name={KIND_ICON[inc.kind]} size={22} color="currentColor" />
            {KIND_LABEL[inc.kind]}
          </span>
          <span>
            {towerName(inc.towerId)}, <b>Level {inc.floor}</b>
          </span>
          <span>
            Duration <b className="tab">{duration(snapshot.nowSec - inc.startSec)}</b>
          </span>
        </>
      ) : (
        <span className="kind calm">
          <Icon name="safe" size={20} color="currentColor" />
          No live incident in {towerName(snapshot.towerId)}
        </span>
      )}
      <span className="b3d-sub">Last data update {lastUpdate ? hms(lastUpdate) : 'none'}</span>
      <span className={`b3d-mode m-${snapshot.mode}`}>{snapshot.mode === 'sim' ? 'Simulation, scripted data' : 'Live: Command data'}</span>
    </header>
  );
}
