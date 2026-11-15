import { useState } from 'react';

import { useCommand } from '@/hooks/use-command';
import { checkLine, planLines, planTitle } from '@/lib/command/plan';
import { canSeeNames, rankUnaccounted, role } from '@/lib/command/selectors';
import type { CommanderReply } from '@/types/command';

import Icon from './Icon';

const GUARDRAILS = [
  'No headcounts. The plan never says how many rescuers, units or vehicles to send.',
  'Stage two floors below the fire floor.',
  'Crews and occupants use different stairwells.',
  'Lift or stairs for moving a person is the commander’s call.',
  'Only Bomba or specialist rescue enter the fire floor or carry. The building ERT never does.',
  'Search order is a suggestion. Bomba decides.',
  'Every floor, stairwell, lift, team and count is checked against the map, roster and live data.',
];

export default function PlanCard() {
  const { state, dispatch, go } = useCommand();
  const [details, setDetails] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [refusal, setRefusal] = useState<string | null>(null);
  const inc = state.incident;
  if (!inc) return null;

  const r = role(state);
  const lines = planLines(state);
  const plan = state.plan;
  const commander = r === 'commander';
  const security = r === 'security';
  const staging = Math.max(1, inc.floor - 2);
  const waiting = state.people.filter((p) => p.towerId === inc.towerId && p.floor === inc.floor && p.status === 'wait');
  const unacc = rankUnaccounted(state.people.filter((p) => p.towerId === inc.towerId && p.floor === inc.floor && p.status === 'unacc' && !p.left));

  const startEdit = (id: string, text: string) => {
    setEditing(id);
    setDraft(text);
    setRefusal(null);
  };
  const saveEdit = () => {
    if (!editing) return;
    const reason = checkLine(state, draft);
    if (reason) {
      setRefusal(reason);
      return;
    }
    dispatch({ type: 'edit-line', lineId: editing, text: draft });
    setEditing(null);
  };

  const openDetails = () => {
    if (!details) for (const p of [...waiting, ...unacc]) dispatch({ type: 'open-person', personId: p.id, where: 'Plan details' });
    setDetails(!details);
  };

  const title = commander ? (plan.sentAt ? 'Plan received for review' : 'Plan draft, not yet sent') : 'Response plan';

  return (
    <section className="card stack" aria-labelledby="plan-h">
      <div className="plan-head">
        <div>
          <h2 id="plan-h">{title}</h2>
          <p className="plan-title">{planTitle(state)}</p>
          {commander && plan.sentAt && (
            <p className="sub">
              Sent by {plan.sentBy}, UOA security, {plan.sentAt}
            </p>
          )}
        </div>
        <div className="plan-meta">
          <span className="tag">Basic plan, checked against the map</span>
          <span className="tag">
            Version {plan.version}
            {plan.versionAt ? `, ${plan.versionAt}` : ''}
          </span>
          {plan.sentAt && !commander && <span className="tag">Sent for review {plan.sentAt}</span>}
        </div>
      </div>

      <ol className="plan" aria-live="polite">
        {lines.map((l, i) =>
          editing === l.id ? (
            <li key={l.id} className="plan-edit" style={{ display: 'flex' }}>
              <label className="lbl" htmlFor="plan-line">
                Line {i + 1}
              </label>
              <input
                id="plan-line"
                type="text"
                value={draft}
                autoFocus
                onChange={(e) => {
                  setDraft(e.target.value);
                  setRefusal(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') setEditing(null);
                }}
              />
              {refusal && (
                <p className="refuse" role="alert">
                  <Icon name="unacc" size={18} />
                  {refusal}
                </p>
              )}
              <div className="row">
                <button type="button" className="btn b-pri b-small" onClick={saveEdit}>
                  Check and save line
                </button>
                <button type="button" className="btn b-sec b-small" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
            </li>
          ) : (
            <li key={l.id} className={plan.changedLineId === l.id ? 'changed' : undefined}>
              <span className="num">{i + 1}.</span>
              <span>{l.text}</span>
              {plan.changedLineId === l.id ? (
                <span className="ctag">Changed {plan.changedAt}</span>
              ) : security ? (
                <button type="button" className="linkbtn" style={{ fontSize: 14, alignSelf: 'center' }} onClick={() => startEdit(l.id, l.text)} aria-label={`Edit line ${i + 1}`}>
                  Edit
                </button>
              ) : (
                <span />
              )}
            </li>
          ),
        )}
      </ol>

      {commander && waiting.length > 0 && (
        <div className="stack" style={{ gap: 8 }}>
          <span className="lbl">Moving the person waiting (line 4). Your decision. Relay does not choose.</span>
          <div className="choices" role="radiogroup" aria-label="Lift or stairs">
            {(['lift', 'stairs'] as const).map((v) => (
              <button key={v} type="button" role="radio" className="choice" aria-checked={plan.liftChoice?.value === v} onClick={() => dispatch({ type: 'lift-choice', value: v })}>
                <span className="radio" />
                {v === 'lift' ? `Fire lift from Level ${staging}` : 'Stairs'}
              </button>
            ))}
          </div>
        </div>
      )}
      {!commander && plan.liftChoice && (
        <p className="soft" style={{ fontSize: 15 }}>
          <b>Bomba commander chose:</b> {plan.liftChoice.value === 'lift' ? `Fire lift from Level ${staging}` : 'Stairs'}, {plan.liftChoice.at}
        </p>
      )}
      {!commander && plan.reply && (
        <p className="soft" style={{ fontSize: 15 }}>
          <b>Bomba commander: {plan.reply.value}</b>, {plan.reply.at}
        </p>
      )}

      <div className="row">
        {security && (
          <button type="button" className="btn b-pri" onClick={() => go('dispatch')}>
            <Icon name="send" />
            {plan.sentAt ? 'Send updated plan for review' : 'Send for review'}
          </button>
        )}
        {commander &&
          (['Followed', 'Changed', 'Ignored'] as CommanderReply[]).map((v) => (
            <button key={v} type="button" className={plan.reply?.value === v ? 'btn b-pri' : 'btn b-sec'} aria-pressed={plan.reply?.value === v} onClick={() => dispatch({ type: 'commander-reply', value: v })}>
              {v}
            </button>
          ))}
        <button type="button" className="btn b-sec" aria-expanded={details} onClick={openDetails}>
          {details ? 'Hide details' : 'Details'}
        </button>
      </div>
      {commander && <p className="sub">Replies are optional and logged. The plan is advice; you run the response.</p>}

      {details && (
        <div className="details">
          {waiting.map((p) => (
            <div key={p.id} className="stack" style={{ gap: 4 }}>
              <span className="lbl">Person waiting</span>
              <p>
                <b>{p.name}</b>, {p.company}, Level {p.floor}, {p.place.replace(/^L\d+, /, '')}. Requested {state.help.find((h) => h.personId === p.id)?.at ?? p.time}, sent automatically from the assistance profile.
              </p>
              <p className="sub">
                Need: {p.need} {p.condition}. {p.note}
              </p>
            </div>
          ))}
          <div className="stack" style={{ gap: 4 }}>
            <span className="lbl">Unaccounted for, ranked by last seen</span>
            {unacc.length === 0 ? (
              <p>None. Everyone on Level {inc.floor} is accounted for.</p>
            ) : (
              <ul>
                {unacc.map((p) => (
                  <li key={p.id}>
                    {p.name} (Level {p.floor}, {p.time ?? 'no update since sign-in'})
                  </li>
                ))}
              </ul>
            )}
          </div>
          {waiting.length > 0 && (
            <div className="stack" style={{ gap: 4 }}>
              <span className="lbl">Movement options for the commander</span>
              <ul>
                <li>Fire lift from Level {staging}, if the commander allows it.</li>
                <li>Stairs, carried by Bomba or specialist rescue with their own carry device.</li>
              </ul>
            </div>
          )}
          <div className="stack" style={{ gap: 4 }}>
            <span className="lbl">Guardrails</span>
            <ul>
              {GUARDRAILS.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
          <p className="sub row" style={{ gap: 6 }}>
            <Icon name="eye" size={18} strokeWidth={2} />
            Viewing this is logged{canSeeNames(r) ? '' : ' as Bomba commander'}.
          </p>
        </div>
      )}
    </section>
  );
}
