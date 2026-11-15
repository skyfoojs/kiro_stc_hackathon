import { useCommand } from '@/hooks/use-command';
import { isCounted, TEAM_STATUS_LABEL } from '@/lib/command/demo-data';
import { canSeeNames, floorCounts, rankUnaccounted, role, towerName } from '@/lib/command/selectors';
import type { Person } from '@/types/command';

import StatusChip from './StatusChip';


interface Props {
  towerId: string;
  floor: number;
}

function anonLabel(p: Person): string {
  if (p.status === 'wait') return 'Person waiting';
  if (p.status === 'unacc') return p.time ? `Unaccounted, last seen ${p.time}` : 'Unaccounted, no update since sign-in';
  return 'Checked in safe';
}

export default function FloorPanel({ towerId, floor }: Props) {
  const { state, go } = useCommand();
  const r = role(state);
  const names = canSeeNames(r);
  const c = floorCounts(state, towerId, floor);
  const here = state.people.filter((p) => isCounted(p) && p.towerId === towerId && p.floor === floor);
  const ordered = [
    ...here.filter((p) => p.status === 'wait'),
    ...rankUnaccounted(here.filter((p) => p.status === 'unacc')),
    ...here.filter((p) => p.status === 'safe').sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '')),
  ];
  const companies = [...new Set(here.map((p) => p.company))];
  const visitors = state.visitors.filter((v) => v.towerId === towerId && v.floor === floor);
  const isOrigin = state.incident?.towerId === towerId && state.incident.floor === floor;
  const teams = state.teams.filter((t) => t.status !== 'not-sent');

  return (
    <section className="card stack" aria-labelledby="floor-h" style={{ gap: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h2 id="floor-h">
            Level {floor}, {towerName(towerId)}
          </h2>
          <p className="sub">{here.length ? `${companies.join(', ')}. ${c.total} occupants.` : 'No one on record'}</p>
        </div>
        {here.length > 0 && (
          <div className="row" style={{ gap: 8 }}>
            <StatusChip status="wait" text={`${c.wait} waiting`} />
            <StatusChip status="safe" text={`${c.safe} safe`} />
            <StatusChip status="unacc" text={`${c.unacc} unaccounted`} />
          </div>
        )}
      </div>

      {here.length === 0 ? (
        <p className="sub soft">No occupants are registered on this floor in the demo data.</p>
      ) : (
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">{names ? 'Name' : 'Person'}</th>
                <th scope="col">Status</th>
                <th scope="col">Last known location</th>
                <th scope="col">Updated</th>
                <th scope="col">Stated need</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <button type="button" className="linkbtn" onClick={() => go(`person/${p.id}`)}>
                      {names ? p.name : anonLabel(p)}
                    </button>
                    {names && <div className="sub" style={{ fontSize: 14 }}>{p.company}</div>}
                    {!names && <div className="sub" style={{ fontSize: 14 }}>Name in details, logged</div>}
                  </td>
                  <td>
                    <StatusChip status={p.status} />
                  </td>
                  <td>
                    {p.place}
                    {p.source && <div className="sub" style={{ fontSize: 14 }}>{p.source}</div>}
                  </td>
                  <td className="tab">{p.time ?? 'None'}</td>
                  <td style={{ maxWidth: 220 }}>{p.status === 'wait' ? p.need : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isOrigin && (
        <div className="stack" style={{ gap: 8 }}>
          <h3>Response teams</h3>
          {teams.length === 0 ? (
            <p className="sub soft">The plan has not been sent to any team yet.</p>
          ) : (
            <div className="who soft" style={{ padding: 12 }}>
              {teams.map((t) => (
                <span key={t.id} style={{ display: 'contents' }}>
                  <span>
                    <b>{t.name}</b>, {TEAM_STATUS_LABEL[t.status].toLowerCase()}
                    {t.words ? `: "${t.words}"` : ''}
                  </span>
                  <span className="t">{t.updated}</span>
                </span>
              ))}
            </div>
          )}
          <p className="sub" style={{ fontSize: 14 }}>
            Teams report in their own words. Relay never asks for or shows how many people a team sends.
          </p>
        </div>
      )}
      {visitors.length > 0 && (
        <button type="button" className="linkbtn" style={{ fontSize: 15, fontWeight: 400 }} onClick={() => go('visitors')}>
          {visitors.length} visitor{visitors.length === 1 ? '' : 's'} checked in on Level {floor} today
        </button>
      )}
    </section>
  );
}
