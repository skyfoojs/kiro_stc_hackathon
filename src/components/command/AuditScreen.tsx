import { useState } from 'react';

import { useCommand } from '@/hooks/use-command';
import { person } from '@/lib/command/selectors';

import Icon from './Icon';

export default function AuditScreen() {
  const { state } = useCommand();
  const [by, setBy] = useState('all');
  const viewers = [...new Set(state.audit.map((a) => a.by))];
  const rows = state.audit.filter((a) => by === 'all' || a.by === by);

  return (
    <main className="page" style={{ gap: 20 }}>
      <div className="stack" style={{ gap: 6 }}>
        <h1>Audit log</h1>
        <p className="sub">Who viewed whose profile, and when. Entries cannot be edited or deleted.</p>
      </div>
      <div className="note">
        <Icon name="eye" size={18} strokeWidth={2} />
        Profile details open only during a live incident or for admins. Every view writes an entry here.
      </div>
      <section className="card stack" aria-labelledby="a-h" style={{ gap: 12 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
          <h2 id="a-h">Profile views</h2>
          <div className="field">
            <label className="lbl" htmlFor="av">
              Viewed by
            </label>
            <select id="av" value={by} onChange={(e) => setBy(e.target.value)}>
              <option value="all">Everyone</option>
              {viewers.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Viewed by</th>
                <th scope="col">Profile viewed</th>
                <th scope="col">Where</th>
                <th scope="col">Context</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const p = person(state, a.personId);
                return (
                  <tr key={a.id}>
                    <td className="t">{a.t}</td>
                    <td>
                      {a.by}
                      <div className="sub">{a.byRole}</div>
                    </td>
                    <td>
                      <b>{p?.name ?? 'Removed profile'}</b>
                      {p && (
                        <div className="sub">
                          {p.company}, L{p.floor}
                        </div>
                      )}
                    </td>
                    <td>{a.where}</td>
                    <td>
                      <span className="tag" style={{ fontWeight: 400 }}>
                        {a.context}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
