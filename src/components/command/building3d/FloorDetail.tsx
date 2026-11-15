import Icon from '@/components/command/Icon';
import { FLOOR_LABEL, TEAM_STATUS_LABEL, type FloorSummary } from '@/lib/command/building3d/status';
import type { OccupantView, Snapshot } from '@/lib/command/building3d/types';
import { towerName } from '@/lib/command/selectors';
import { hms } from '@/lib/command/time';

import PersonRow from './PersonRow';

const ORDER: Record<OccupantView['status'], number> = { waiting: 0, assist: 1, unacc: 2, active: 3, safe: 4 };

interface Props {
  floor: number;
  summary: FloorSummary | undefined;
  snapshot: Snapshot;
  canSee: boolean;
  exploded: boolean;
  isolate: boolean;
  onExplode: () => void;
  onIsolate: () => void;
  onFocus: () => void;
  onPick: (id: string) => void;
  onTeam: (id: string) => void;
}

export default function FloorDetail({ floor, summary, snapshot, canSee, exploded, isolate, onExplode, onIsolate, onFocus, onPick, onTeam }: Props) {
  const people = snapshot.occupants
    .filter((o) => o.towerId === snapshot.towerId && o.homeFloor === floor)
    .sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  const teams = snapshot.teams.filter((t) => t.assignedFloor === floor || (!t.outside && Math.round(t.pos.f) === floor));
  const last = people.reduce<number | null>((m, o) => (o.updatedSec !== null && (m === null || o.updatedSec > m) ? o.updatedSec : m), null);
  const state = summary?.state ?? 'empty';
  const inc = snapshot.incident;

  return (
    <div className="b3d-detail">
      <div className="b3d-detail-head">
        <span className="b3d-lbl">{towerName(snapshot.towerId)}</span>
        <h2 className="b3d-title">Level {floor}</h2>
        <span className={`b3d-chip fs-chip fs-${state}`}>{FLOOR_LABEL[state]}</span>
      </div>

      {summary?.hazard && inc && (
        <p className="b3d-help urgent">
          <Icon name="fire" size={16} color="currentColor" />
          <b>Incident floor.</b> {inc.kind === 'fire' ? 'Fire' : 'Incident'} reported on Level {inc.floor}, started {hms(inc.startSec)}.
        </p>
      )}
      {summary?.staging && <p className="b3d-note">Staging floor: two floors below the fire (plan rule G2).</p>}

      <div className="b3d-mini-tiles">
        <span>
          <b className="tab">{summary?.total ?? 0}</b> on record
        </span>
        <span className="c-safe">
          <b className="tab">{summary?.safe ?? 0}</b> safe
        </span>
        <span className="c-wait">
          <b className="tab">{summary?.waiting ?? 0}</b> waiting
        </span>
        <span className="c-unacc">
          <b className="tab">{summary?.unacc ?? 0}</b> unaccounted
        </span>
      </div>
      {state === 'clear' && (
        <p className="b3d-note">
          All accounted for: every person on record for this floor has checked in safe. This is not a Bomba declaration that the floor is
          clear of hazards.
        </p>
      )}
      <p className="b3d-sub">Last update: {last !== null ? hms(last) : 'none'}</p>

      <div className="b3d-btn-row">
        <button type="button" className="b3d-btn" onClick={onFocus}>
          Focus floor
        </button>
        <button type="button" className="b3d-btn b3d-btn-sec" aria-pressed={exploded} onClick={onExplode}>
          {exploded ? 'Close floors' : 'Explode floors'}
        </button>
        <button type="button" className="b3d-btn b3d-btn-sec" aria-pressed={isolate} onClick={onIsolate}>
          {isolate ? 'Show all floors' : 'Isolate floor'}
        </button>
      </div>

      {teams.length > 0 && (
        <section className="b3d-sec">
          <h3 className="b3d-h3">Response teams</h3>
          <ul className="b3d-list">
            {teams.map((t) => (
              <li key={t.id}>
                <button type="button" className="b3d-person" onClick={() => onTeam(t.id)}>
                  <span className="who">
                    <b>{t.name}</b>
                    <span>{t.task}</span>
                  </span>
                  <span className="b3d-chip k-team">{TEAM_STATUS_LABEL[t.status]}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="b3d-sec">
        <h3 className="b3d-h3">People on record</h3>
        {people.length === 0 ? (
          <p className="b3d-empty">No one on record for this floor.</p>
        ) : (
          <ul className="b3d-list">
            {people.map((o) => (
              <PersonRow key={o.id} o={o} canSee={canSee} now={snapshot.nowSec} onPick={onPick} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
