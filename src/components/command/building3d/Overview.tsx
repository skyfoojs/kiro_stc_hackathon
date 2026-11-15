import { TEAM_STATUS_LABEL } from '@/lib/command/building3d/status';
import type { Snapshot } from '@/lib/command/building3d/types';

import Legend from './Legend';
import PersonRow from './PersonRow';

interface Props {
  snapshot: Snapshot;
  canSee: boolean;
  onPick: (id: string) => void;
  onTeam: (id: string) => void;
}

/** Shown when nothing is selected: who needs attention first, then teams, then the legend. */
export default function Overview({ snapshot, canSee, onPick, onTeam }: Props) {
  const people = snapshot.occupants.filter((o) => o.towerId === snapshot.towerId);
  const waiting = people
    .filter((o) => o.status === 'waiting')
    .sort((a, b) => Number(!!a.help?.ackBy) - Number(!!b.help?.ackBy) || (a.help?.atSec ?? 0) - (b.help?.atSec ?? 0));
  const unacc = people.filter((o) => o.status === 'unacc').sort((a, b) => (b.updatedSec ?? -1) - (a.updatedSec ?? -1));

  return (
    <div className="b3d-detail">
      <section className="b3d-sec">
        <h2 className="b3d-h">Waiting for rescue ({waiting.length})</h2>
        {waiting.length ? (
          <ul className="b3d-list">
            {waiting.map((o) => (
              <PersonRow key={o.id} o={o} canSee={canSee} now={snapshot.nowSec} onPick={onPick} />
            ))}
          </ul>
        ) : (
          <p className="b3d-empty">No one is waiting for rescue.</p>
        )}
      </section>
      <section className="b3d-sec">
        <h2 className="b3d-h">Unaccounted for ({unacc.length})</h2>
        {unacc.length ? (
          <ul className="b3d-list">
            {unacc.map((o) => (
              <PersonRow key={o.id} o={o} canSee={canSee} now={snapshot.nowSec} onPick={onPick} />
            ))}
          </ul>
        ) : (
          <p className="b3d-empty">{snapshot.incident ? 'Everyone on record is accounted for.' : 'No live incident.'}</p>
        )}
      </section>
      <section className="b3d-sec">
        <h2 className="b3d-h">Response teams ({snapshot.teams.length})</h2>
        {snapshot.teams.length ? (
          <ul className="b3d-list">
            {snapshot.teams.map((t) => (
              <li key={t.id}>
                <button type="button" className="b3d-person" onClick={() => onTeam(t.id)}>
                  <span className="who">
                    <b>{t.name}</b>
                    <span>{t.words ? `"${t.words}"` : t.task}</span>
                  </span>
                  <span className="b3d-chip k-team">{TEAM_STATUS_LABEL[t.status]}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="b3d-empty">No team has been sent the plan yet.</p>
        )}
      </section>
      <Legend />
    </div>
  );
}
