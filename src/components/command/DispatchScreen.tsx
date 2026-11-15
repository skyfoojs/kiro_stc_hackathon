import { useCommand } from '@/hooks/use-command';
import { TEAM_STATUS_LABEL } from '@/lib/command/demo-data';
import { planLines, planTitle } from '@/lib/command/plan';
import { role } from '@/lib/command/selectors';
import type { TeamStatus } from '@/types/command';

import Icon, { type IconName } from './Icon';

const STATUS_ICON: Record<TeamStatus, IconName> = {
  'not-sent': 'info',
  sent: 'send',
  acknowledged: 'check',
  'en-route': 'send',
  'at-staging': 'shield',
  'on-floor': 'shield',
  'person-reached': 'safe',
  done: 'safe',
};

export default function DispatchScreen() {
  const { state, dispatch, go } = useCommand();
  const r = role(state);
  const security = r === 'security';
  const inc = state.incident;
  const ticked = state.teams.filter((t) => t.ticked);
  const pending = state.updates.filter((u) => !u.sent);

  if (!inc) {
    return (
      <main className="page">
        <h1>Dispatch and comms</h1>
        <section className="card empty">
          <Icon name="dispatch" size={40} />
          <h2>No live incident</h2>
          <p className="sub">The plan and team list appear here once an incident is triggered.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>Dispatch and comms</h1>
          <p className="sub">Send the plan to response teams for review, see what they report, and keep them updated.</p>
        </div>
        <button type="button" className="btn b-sec" onClick={() => go('report')}>
          <Icon name="doc" />
          Share report with Bomba
        </button>
      </div>
      <div className="grid-dispatch">
        <section className="card stack" aria-labelledby="teams-h" style={{ padding: '16px 8px 8px' }}>
          <h2 id="teams-h" style={{ padding: '0 12px' }}>
            Teams
          </h2>
          <div className="scroll">
            <table className="tbl">
              <thead>
                <tr>
                  {security && <th scope="col">Send</th>}
                  <th scope="col">Team</th>
                  <th scope="col">Channel</th>
                  <th scope="col">Status</th>
                  <th scope="col">Updated</th>
                  <th scope="col">Their words</th>
                </tr>
              </thead>
              <tbody>
                {state.teams.map((t) => (
                  <tr key={t.id}>
                    {security && (
                      <td>
                        <input
                          type="checkbox"
                          className="tick-box"
                          checked={t.ticked}
                          aria-label={`Send to ${t.name}`}
                          onChange={() => dispatch({ type: 'toggle-team', teamId: t.id })}
                        />
                      </td>
                    )}
                    <td>
                      <b>{t.name}</b>
                      {t.note && <div className="sub" style={{ fontSize: 14 }}>{t.note}</div>}
                    </td>
                    <td className="sub">{t.channel}</td>
                    <td>
                      <span className={`chip ${t.status === 'not-sent' ? 'c-plain' : 'c-neutral'}`}>
                        <Icon name={STATUS_ICON[t.status]} size={16} />
                        {TEAM_STATUS_LABEL[t.status]}
                      </span>
                    </td>
                    <td className="t">{t.updated ?? ''}</td>
                    <td>{t.words ? `“${t.words}”` : <span className="sub">No reply yet</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="sub" style={{ padding: '0 12px 8px', fontSize: 14 }}>
            Status steps: sent, acknowledged, en route, at staging, on floor, person reached, done. Teams say what they are sending in their own words; Relay
            never asks for a number.
          </p>
        </section>

        <aside className="stack" style={{ gap: 16 }}>
          <section className="card stack" aria-labelledby="send-h">
            <div className="plan-head">
              <h2 id="send-h">{security ? 'Plan being sent' : 'Plan received for review'}</h2>
              <span className="tag">
                Version {state.plan.version}
                {state.plan.versionAt ? `, ${state.plan.versionAt}` : ''}
              </span>
            </div>
            <p style={{ fontWeight: 800 }}>{planTitle(state)}</p>
            <ol style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 16 }}>
              {planLines(state).map((l) => (
                <li key={l.id}>{l.text}</li>
              ))}
            </ol>
            {security && (
              <>
                <button type="button" className="btn b-pri" disabled={!ticked.length} onClick={() => dispatch({ type: 'send-plan' })} aria-describedby="send-why">
                  <Icon name="send" />
                  {state.plan.sentAt ? `Send updated plan to ${ticked.length} teams` : `Send plan to ${ticked.length} teams for review`}
                </button>
                <p id="send-why" className="sub" style={{ fontSize: 14 }}>
                  {ticked.length ? 'Teams receive this as advice. They may follow, change or ignore it.' : 'Tick at least one team to send the plan.'}
                </p>
              </>
            )}
            {state.plan.sentAt && (
              <p className="soft" style={{ fontSize: 15 }}>
                Sent by {state.plan.sentBy}, {state.plan.sentAt}.
                {state.plan.reply ? ` Bomba commander: ${state.plan.reply.value}, ${state.plan.reply.at}.` : ' No commander reply yet.'}
              </p>
            )}
          </section>

          <section className="card stack" aria-labelledby="upd-h">
            <h2 id="upd-h">Updates sent to teams</h2>
            {state.updates.length === 0 ? (
              <p className="sub">Every live change, such as a check-in or help request, is listed here.</p>
            ) : (
              <div className="upd">
                <ul>
                  {state.updates.map((u) => (
                    <li key={u.id}>
                      <span className="tab" style={{ fontWeight: 700 }}>
                        {u.t}
                      </span>
                      <span>{u.text}</span>
                      <span className={u.sent ? 'tag' : 'tag urg'}>{u.sent ? 'Sent' : 'Pending'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {security && (
              <button type="button" className="btn b-sec" disabled={!pending.length || !state.plan.sentAt} onClick={() => dispatch({ type: 'send-updates' })}>
                Send update{pending.length ? ` (${pending.length} pending)` : ''}
              </button>
            )}
            <p className="sub" style={{ fontSize: 14 }}>
              Counts and floors go to every team. Names go only to the team leader assigned to that person.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
