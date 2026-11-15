import { useEffect, useRef } from 'react';

import { useCommand } from '@/hooks/use-command';
import { ACCOUNTS } from '@/lib/command/demo-data';
import { person, role, towerName } from '@/lib/command/selectors';

import Icon from './Icon';
import StatusChip from './StatusChip';

interface Props {
  personId: string;
  onClose: () => void;
}

/** Slides in over the dashboard. Opening it writes an audit entry (access control NFR, FR21). */
export default function PersonDrawer({ personId, onClose }: Props) {
  const { state, dispatch, go } = useCommand();
  const p = person(state, personId);
  const closeRef = useRef<HTMLButtonElement>(null);
  const logged = useRef(false);
  const r = role(state);
  const live = !!state.incident;
  const allowed = live || r === 'admin';

  useEffect(() => {
    if (!p || !allowed || logged.current) return;
    logged.current = true;
    dispatch({ type: 'open-person', personId: p.id, where: 'Person drawer' });
  }, [p, allowed, dispatch]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const opened = state.audit.find((a) => a.personId === personId);
  const help = state.help.find((h) => h.personId === personId);
  const teams = state.teams.filter((t) => t.status !== 'not-sent' && t.words);

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="pd-h">
        <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap', gap: 12 }}>
          <div className="stack" style={{ gap: 4, flex: 1 }}>
            <h2 id="pd-h">{p && allowed ? p.name : 'Details unavailable'}</h2>
            {p && allowed && (
              <p className="sub" style={{ fontSize: 16 }}>
                {p.company}, Level {p.floor}, {towerName(p.towerId)}
              </p>
            )}
          </div>
          <button ref={closeRef} type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <Icon name="close" strokeWidth={2.4} />
          </button>
        </div>

        {!p || !allowed ? (
          <p className="sub" style={{ paddingTop: 16 }}>
            {!p ? 'This person is not in the roster.' : 'Profile details open only during a live incident or for admins.'}
          </p>
        ) : (
          <>
            <div className="row" style={{ padding: '14px 0 18px' }}>
              {live && <StatusChip status={p.status} />}
              <span className="sub row" style={{ gap: 6, fontSize: 14 }}>
                <Icon name="eye" size={18} strokeWidth={2} />
                Viewing is logged.{opened && state.account ? ` Opened by ${ACCOUNTS[state.account].name} at ${opened.t}.` : ''}
              </span>
            </div>
            {live && (
              <section className="dsec" aria-labelledby="s1">
                <h3 id="s1">Now</h3>
                <dl className="dl wide">
                  <dt>Last known location</dt>
                  <dd>{p.place}</dd>
                  <dt>Last update</dt>
                  <dd className="tab">
                    {p.time ?? 'None since sign-in'}
                    {p.source ? `, ${p.source.charAt(0).toLowerCase()}${p.source.slice(1)}` : ''}
                  </dd>
                  {p.status === 'wait' && (
                    <>
                      <dt>Stated need</dt>
                      <dd>
                        <b>{p.need}</b>
                      </dd>
                    </>
                  )}
                </dl>
              </section>
            )}
            {live && p.status === 'wait' && help && (
              <section className="dsec" aria-labelledby="s2">
                <h3 id="s2">Response</h3>
                <div className="who soft">
                  <span>Help request {help.auto ? 'sent automatically from the profile' : 'tapped manually'}</span>
                  <span className="t">{help.at}</span>
                  {help.acks.map((a) => (
                    <span key={a.by} style={{ display: 'contents' }}>
                      <span>{a.rescue ? `Acknowledged by ${a.by}` : 'Seen by UOA security'}</span>
                      <span className="t">{a.at}</span>
                    </span>
                  ))}
                  {teams.map((t) => (
                    <span key={t.id} style={{ display: 'contents' }}>
                      <span>
                        <b>{t.name}</b>: &ldquo;{t.words}&rdquo;
                      </span>
                      <span className="t">{t.updated}</span>
                    </span>
                  ))}
                  {!help.acks.length && !teams.length && <span>No team has acknowledged yet.</span>}
                </div>
              </section>
            )}
            <section className="dsec" aria-labelledby="s3">
              <h3 id="s3">Assistance profile</h3>
              <p className="sub" style={{ fontSize: 14 }}>
                Self-declared, no medical proof. Shown only while an incident is live or to admins.
              </p>
              <dl className="dl wide">
                <dt>Needs help on stairs</dt>
                <dd>
                  <b>{p.assist}</b>
                </dd>
                <dt>Temporary condition</dt>
                <dd>{p.condition ?? 'None recorded'}</dd>
                <dt>Note</dt>
                <dd>{p.note ?? 'None'}</dd>
              </dl>
            </section>
            {live && (
              <section className="dsec" aria-labelledby="s4">
                <h3 id="s4">Actions</h3>
                <div className="row">
                  <button type="button" className="btn b-pri" onClick={() => go('report')}>
                    Open in Bomba report
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </aside>
    </>
  );
}
