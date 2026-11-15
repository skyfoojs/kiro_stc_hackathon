import { useState } from 'react';

import { useCommand } from '@/hooks/use-command';
import { towerName } from '@/lib/command/selectors';

import Icon from './Icon';

export default function PeopleScreen() {
  const { state, dispatch } = useCommand();
  const [q, setQ] = useState('');
  const [co, setCo] = useState('all');
  const [selId, setSelId] = useState('aisyah');

  const companies = [...new Set(state.people.map((p) => p.company))].sort();
  const vis = state.people
    .filter((p) => (co === 'all' || p.company === co) && p.name.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
  const groups = companies.map((c) => ({ co: c, rows: vis.filter((p) => p.company === c) })).filter((g) => g.rows.length);
  const sel = state.people.find((p) => p.id === selId) ?? state.people[0];

  const pick = (id: string) => {
    setSelId(id);
    dispatch({ type: 'open-person', personId: id, where: 'People and profiles' });
  };

  return (
    <main className="page" style={{ gap: 20 }}>
      <div className="stack" style={{ gap: 6 }}>
        <h1>People and profiles</h1>
        <p className="sub">Self-declared assistance profiles by tenant company. Admin only. Tenant HR and admin invite staff.</p>
      </div>
      <div className="grid-people">
        <section className="card stack" aria-label="People list" style={{ padding: 16 }}>
          <div className="row" style={{ gap: 12, alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: '1 1 260px' }}>
              <label className="lbl" htmlFor="q">
                Search by name
              </label>
              <input id="q" type="search" placeholder="Type a name" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="field">
              <label className="lbl" htmlFor="co">
                Tenant company
              </label>
              <select id="co" value={co} onChange={(e) => setCo(e.target.value)}>
                <option value="all">All companies</option>
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="prow head" aria-hidden="true">
            <span className="lbl">Name</span>
            <span className="lbl">Floor</span>
            <span className="lbl">Needs help on stairs</span>
          </div>
          <div>
            {groups.length === 0 && <p className="sub" style={{ padding: 12 }}>No one matches that search.</p>}
            {groups.map((g) => (
              <div key={g.co}>
                <h3 style={{ padding: '14px 12px 6px' }}>
                  {g.co}{' '}
                  <span className="sub" style={{ fontWeight: 400 }}>
                    {g.rows.length} {g.rows.length === 1 ? 'person' : 'people'}
                  </span>
                </h3>
                {g.rows.map((p) => (
                  <button key={p.id} type="button" className="prow" aria-current={p.id === sel?.id} onClick={() => pick(p.id)}>
                    <span>
                      <b>{p.name}</b>
                      <span className="role" style={{ display: 'block' }}>
                        Staff{p.left ? ', left the company' : ''}
                      </span>
                    </span>
                    <span className="role">Level {p.floor}</span>
                    <span className={p.assist === 'No' ? 'lvl no' : 'lvl'}>{p.assist}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </section>

        {sel ? (
          <aside className="card stack" aria-labelledby="pp-h" style={{ gap: 18 }}>
            <div>
              <h2 id="pp-h" style={{ fontSize: 22, fontWeight: 800 }}>
                {sel.name}
              </h2>
              <p className="sub">
                {sel.company}, Level {sel.floor}, {towerName(sel.towerId)}
              </p>
            </div>
            <dl className="dl wide">
              <dt>Needs help on stairs</dt>
              <dd>
                <b>{sel.assist}</b>
              </dd>
              <dt>Temporary condition</dt>
              <dd>{sel.condition ?? 'None recorded'}</dd>
              <dt>Note</dt>
              <dd>{sel.note ?? 'None'}</dd>
              <dt>Employment</dt>
              <dd>{sel.left ? `Marked as left ${sel.company}` : `Active at ${sel.company}`}</dd>
            </dl>
            {sel.assist !== 'No' && (
              <p className="soft" style={{ fontSize: 15 }}>
                When an incident is declared, a help request is sent automatically for this person. They can cancel it within 10 seconds.
              </p>
            )}
            <div className="stack" style={{ gap: 8, paddingTop: 14, borderTop: '1px solid var(--mist)' }}>
              <div className="row">
                <button type="button" className="btn b-sec" disabled={!sel.left} aria-describedby="rm-why" onClick={() => dispatch({ type: 'remove-profile', personId: sel.id })}>
                  Remove profile
                </button>
                {!sel.left && (
                  <button type="button" className="btn b-sec" onClick={() => dispatch({ type: 'mark-left', personId: sel.id })}>
                    Mark as left the company
                  </button>
                )}
              </div>
              <p id="rm-why" className="sub" style={{ fontSize: 14 }}>
                {sel.left
                  ? 'Removing deletes this profile and its assistance details.'
                  : `Remove profile is available only after the person is marked as having left the company. ${sel.name.split(' ')[0]} is active at ${sel.company}.`}
              </p>
            </div>
            <div className="note">
              <Icon name="info" size={18} strokeWidth={2} />
              Consent withdrawal handling pending legal review (PDPA). Viewing a profile is written to the audit log.
            </div>
          </aside>
        ) : (
          <aside className="card">
            <p className="sub">No profiles left.</p>
          </aside>
        )}
      </div>
    </main>
  );
}
