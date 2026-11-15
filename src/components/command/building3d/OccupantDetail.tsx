import { FRESH_LABEL, TEAM_STATUS_LABEL } from '@/lib/command/building3d/status';
import { displayName, updatedText } from '@/lib/command/building3d/present';
import type { OccupantView, Snapshot } from '@/lib/command/building3d/types';
import { towerName } from '@/lib/command/selectors';
import { duration, hms } from '@/lib/command/time';

import OccChip from './OccChip';
import TeamProgress from './TeamProgress';

interface Props {
  o: OccupantView;
  snapshot: Snapshot;
  canSee: boolean;
  onReveal: () => void;
  onFocus: () => void;
  onFloor: (n: number) => void;
  onTeam: (id: string) => void;
}

export default function OccupantDetail({ o, snapshot, canSee, onReveal, onFocus, onFloor, onTeam }: Props) {
  const now = snapshot.nowSec;
  const team = o.help?.teamId ? snapshot.teams.find((t) => t.id === o.help?.teamId) : null;
  const floorNow = Math.round(o.pos.f);

  return (
    <div className="b3d-detail">
      <div className="b3d-detail-head">
        <span className="b3d-lbl">Occupant{o.simulated ? ', simulated' : ''}</span>
        <h2 className="b3d-title">{displayName(o, canSee)}</h2>
        {canSee && <span className="b3d-sub">{o.company}</span>}
        <OccChip o={o} />
      </div>

      {!canSee && (
        <button type="button" className="b3d-btn b3d-btn-sec" onClick={onReveal}>
          Show name and details. Viewing is logged.
        </button>
      )}

      {o.status === 'waiting' && o.help && (
        <section className={`b3d-help ${o.help.ackBy ? 'acked' : 'urgent'}`} aria-label="Help request">
          <b>{o.help.ackBy ? `Acknowledged by ${o.help.ackBy}` : 'Not yet acknowledged by a rescue team'}</b>
          <span>
            Waiting <b className="tab">{duration(now - o.help.atSec)}</b> at {o.help.where}, L{floorNow}.
          </span>
          <span>
            Requested {hms(o.help.atSec)}
            {o.help.auto ? ', sent automatically from the assistance profile.' : '.'}
          </span>
          {o.help.ackAtSec !== null && <span>Acknowledged {hms(o.help.ackAtSec)}.</span>}
          {o.help.seenByControlRoom && !o.help.ackBy && <span>Seen by UOA security.</span>}
          {o.help.escalated && <span>Escalated to control room: no rescue acknowledgement within 60 s.</span>}
        </section>
      )}

      <dl className="b3d-dl">
        <dt>Tower and floor</dt>
        <dd>
          {towerName(o.towerId)}, assigned{' '}
          <button type="button" className="b3d-link" onClick={() => onFloor(o.homeFloor)}>
            Level {o.homeFloor}
          </button>
        </dd>
        <dt>Last known location</dt>
        <dd>
          {o.place}
          {o.moving ? ' (moving)' : ''}
        </dd>
        <dt>Location update</dt>
        <dd>
          {updatedText(o.updatedSec, now)}
          <br />
          <span className={`b3d-fresh f-${o.freshness}`}>{FRESH_LABEL[o.freshness]}</span>
        </dd>
        <dt>Source</dt>
        <dd>{o.source}</dd>
        {(canSee || o.assist !== 'No') && (
          <>
            <dt>Needs help on stairs (self-declared)</dt>
            <dd>{o.assist}</dd>
          </>
        )}
        {canSee && o.condition && (
          <>
            <dt>Condition</dt>
            <dd>{o.condition}</dd>
          </>
        )}
        {canSee && (o.need || o.note) && (
          <>
            <dt>Note</dt>
            <dd>{o.need ?? o.note}</dd>
          </>
        )}
      </dl>

      {team && (
        <section className="b3d-sec" aria-label="Assigned team">
          <h3 className="b3d-h3">Assigned team</h3>
          <button type="button" className="b3d-link" onClick={() => onTeam(team.id)}>
            {team.name}, {TEAM_STATUS_LABEL[team.status].toLowerCase()}
          </button>
          <TeamProgress status={team.status} />
        </section>
      )}

      {o.history.length > 0 && (
        <section className="b3d-sec" aria-label="Location history">
          <h3 className="b3d-h3">Location history</h3>
          <ol className="b3d-history">
            {o.history.map((h, i) => (
              <li key={`${h.sec}-${i}`}>
                <span className="tab">{hms(h.sec)}</span>
                {h.label}
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="b3d-note">
        Location is approximate: floor from QR scans and the barometer, position on the floor is schematic. Relay does not track people
        precisely indoors.
      </p>
      <button type="button" className="b3d-btn" onClick={onFocus}>
        Focus in 3D
      </button>
    </div>
  );
}
