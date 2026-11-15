import { useState } from 'react';

import { useCommand } from '@/hooks/use-command';
import { KIND_LABEL } from '@/lib/command/demo-data';
import { towerName } from '@/lib/command/selectors';
import { hms, TODAY_LABEL } from '@/lib/command/time';
import type { EventType } from '@/types/command';

import Icon, { type IconName } from './Icon';

const TYPES: [EventType | 'all', string][] = [
  ['all', 'All'],
  ['trig', 'Triggered'],
  ['send', 'Guidance and sends'],
  ['help', 'Help requested'],
  ['ack', 'Acknowledged'],
  ['esc', 'Escalated'],
  ['safe', 'Checked in'],
  ['plan', 'Plan and replies'],
  ['doc', 'Report shared'],
  ['role', 'Role switch'],
  ['end', 'Ended'],
];

const ICON: Record<EventType, { name: IconName; color?: string }> = {
  trig: { name: 'fire', color: 'var(--navy)' },
  send: { name: 'send', color: 'var(--navy)' },
  help: { name: 'wait' },
  ack: { name: 'check', color: 'var(--navy)' },
  esc: { name: 'unacc', color: 'var(--navy)' },
  safe: { name: 'safe' },
  doc: { name: 'doc', color: 'var(--navy)' },
  plan: { name: 'plan', color: 'var(--navy)' },
  role: { name: 'switch', color: 'var(--navy)' },
  end: { name: 'check', color: 'var(--navy)' },
};

export default function LogScreen() {
  const { state } = useCommand();
  const [type, setType] = useState<EventType | 'all'>('all');
  const [floor, setFloor] = useState('all');
  const floors = [...new Set(state.log.map((e) => e.floor).filter((f) => f !== 'all'))].sort((a, b) => Number(b) - Number(a));
  const events = state.log.filter((e) => (type === 'all' || e.type === type) && (floor === 'all' || e.floor === floor || e.floor === 'all'));
  const inc = state.incident;
  const heading = inc ? `${KIND_LABEL[inc.kind]}, ${towerName(inc.towerId)}, ${TODAY_LABEL}` : `Today, ${TODAY_LABEL}`;

  return (
    <main className="page" style={{ gap: 20 }}>
      <div className="stack" style={{ gap: 6 }}>
        <h1>Incident log</h1>
        <p className="sub">Every event in order, including plan versions, sends, acknowledgements and commander replies.</p>
      </div>
      <div className="grid-log">
        <section className="card stack" aria-labelledby="tl-h">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <h2 id="tl-h">{heading}</h2>
            <span className="sub" role="status">
              Showing {events.length} of {state.log.length} events
            </span>
          </div>
          <div className="row" style={{ gap: 16, alignItems: 'flex-end' }}>
            <div className="stack" style={{ gap: 6, flex: '1 1 520px' }}>
              <span className="lbl" id="ft">
                Event type
              </span>
              <div className="row" role="group" aria-labelledby="ft" style={{ gap: 8 }}>
                {TYPES.map(([k, label]) => (
                  <button key={k} type="button" className="pill sm" aria-pressed={type === k} onClick={() => setType(k)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="lbl" htmlFor="ff">
                Floor
              </label>
              <select id="ff" value={floor} onChange={(e) => setFloor(e.target.value)}>
                <option value="all">All floors</option>
                {floors.map((f) => (
                  <option key={f} value={f}>
                    Level {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {state.log.length === 0 ? (
            <p className="sub soft">Nothing logged yet. Events appear here from the moment an incident is triggered.</p>
          ) : events.length === 0 ? (
            <p className="sub" style={{ padding: '16px 0' }}>
              No events match these filters.
            </p>
          ) : (
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {events.map((e) => (
                <li key={e.id} className={e.type === 'esc' ? 'ev esc' : 'ev'}>
                  <span className="tm">{e.t}</span>
                  <span className="ic" aria-hidden="true">
                    <Icon name={ICON[e.type].name} color={ICON[e.type].color} />
                  </span>
                  <div>
                    <h3>{e.title}</h3>
                    <p className="sub">{e.detail}</p>
                  </div>
                  <span className={e.type === 'esc' ? 'tag urg' : 'tag'}>{e.floor === 'all' ? 'Building' : `L${e.floor}`}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
        <aside className="card stack" aria-labelledby="past-h" style={{ gap: 12 }}>
          <h2 id="past-h">Incidents</h2>
          {inc && (
            <div className="past live">
              <span className="lbl">{TODAY_LABEL}, live</span>
              <b>
                {KIND_LABEL[inc.kind]}, {towerName(inc.towerId)}
              </b>
              <span className="sub">
                Origin Level {inc.floor}. Triggered {hms(inc.startSec)} by {inc.by}.
              </span>
            </div>
          )}
          {state.past.map((p) => (
            <div key={p.label + p.title} className="past">
              <span className="lbl">{p.label}</span>
              <b>{p.title}</b>
              <span className="sub">{p.detail}</span>
            </div>
          ))}
        </aside>
      </div>
    </main>
  );
}
