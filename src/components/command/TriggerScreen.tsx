import { useState } from 'react';

import { useCommand } from '@/hooks/use-command';
import { DEMO_FLOOR, DEMO_TOWER_ID, GUIDANCE, RECIPIENTS, TOWERS } from '@/lib/command/demo-data';
import { towerName } from '@/lib/command/selectors';
import type { IncidentKind } from '@/types/command';

import ConfirmDialog from './ConfirmDialog';
import Icon, { type IconName } from './Icon';

const TYPES: { kind: IncidentKind; label: string; sub: string; icon: IconName }[] = [
  { kind: 'fire', label: 'Fire', sub: 'Evacuate', icon: 'fire' },
  { kind: 'earthquake', label: 'Earthquake', sub: 'Shelter, then evacuate', icon: 'quake' },
  { kind: 'outage', label: 'Power outage', sub: 'Stay put', icon: 'bolt' },
  { kind: 'security', label: 'Security threat', sub: 'Lockdown', icon: 'lock' },
];

export default function TriggerScreen() {
  const { state, dispatch, go } = useCommand();
  const [kind, setKind] = useState<IncidentKind>('fire');
  const [towerId, setTowerId] = useState(DEMO_TOWER_ID);
  const [floor, setFloor] = useState(DEMO_FLOOR);
  const [confirm, setConfirm] = useState(false);
  const tower = TOWERS.find((t) => t.id === towerId) ?? TOWERS[2];
  const g = GUIDANCE[kind];
  const floors = Array.from({ length: tower.floors }, (_, i) => tower.floors - i);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>Trigger incident</h1>
          <p className="sub">Choose what is happening and where. You will confirm before anything is sent.</p>
        </div>
      </div>
      {state.incident && (
        <div className="callout" role="note">
          <Icon name="info" size={22} />
          <div>
            <b>An incident is already live in {towerName(state.incident.towerId)}.</b>
            <p className="sub">Triggering a new one replaces it and restarts the live picture.</p>
          </div>
        </div>
      )}
      <div className="grid-side">
        <div className="stack" style={{ gap: 24 }}>
          <section className="card stack" aria-labelledby="type-h">
            <h2 id="type-h">1. Incident type</h2>
            <div className="types" role="radiogroup" aria-labelledby="type-h">
              {TYPES.map((t) => (
                <button key={t.kind} type="button" role="radio" className="opt" aria-checked={kind === t.kind} onClick={() => setKind(t.kind)}>
                  <span className="ic">
                    <Icon name={t.icon} size={24} color="var(--navy)" />
                  </span>
                  <span>
                    <b style={{ display: 'block', fontSize: 17 }}>{t.label}</b>
                    <span className="sub">{t.sub}</span>
                  </span>
                  <span className="tick">
                    <Icon name="check" size={14} strokeWidth={3.4} />
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="card stack" aria-labelledby="where-h">
            <h2 id="where-h">2. Tower and origin floor</h2>
            <div className="twr" role="radiogroup" aria-label="Tower">
              {TOWERS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={towerId === t.id}
                  onClick={() => {
                    setTowerId(t.id);
                    setFloor(Math.min(floor, t.floors));
                  }}>
                  <b>{t.name}</b>
                  <span className="sub">{t.meta}</span>
                </button>
              ))}
            </div>
            <div className="field">
              <label className="lbl" htmlFor="floor">
                Origin floor
              </label>
              <select id="floor" value={floor} onChange={(e) => setFloor(Number(e.target.value))} style={{ maxWidth: 260 }}>
                {floors.map((f) => (
                  <option key={f} value={f}>
                    Level {f}
                  </option>
                ))}
              </select>
            </div>
          </section>
        </div>
        <aside className="stack" style={{ gap: 16 }}>
          <section className="card stack" aria-labelledby="prev-h">
            <div>
              <h2 id="prev-h">What staff will receive</h2>
              <p className="sub">Exact guidance, sent to everyone signed in to {tower.name}</p>
            </div>
            <div className="phone">
              <div className="scr">
                <div className="scr-head">
                  <b style={{ fontSize: 19, display: 'block' }}>{g.title}</b>
                  <span style={{ fontSize: 14 }}>
                    {tower.name}, Level {floor}
                  </span>
                </div>
                <p>{g.text}</p>
              </div>
            </div>
            <p className="sub">People whose profile says they need help on stairs have a help request sent for them automatically.</p>
          </section>
          <section className="card stack">
            <h2>Ready to trigger</h2>
            <dl className="dl">
              <dt>Type</dt>
              <dd style={{ fontWeight: 700 }}>{g.label}</dd>
              <dt>Tower</dt>
              <dd style={{ fontWeight: 700 }}>{tower.name}</dd>
              <dt>Origin floor</dt>
              <dd style={{ fontWeight: 700 }}>Level {floor}</dd>
              <dt>Recipients</dt>
              <dd style={{ fontWeight: 700 }}>{RECIPIENTS} people signed in</dd>
            </dl>
            <button type="button" className="btn b-urg" onClick={() => setConfirm(true)}>
              Trigger {g.short} incident
            </button>
            <div className="note">
              <Icon name="info" size={18} strokeWidth={2} />
              Fire alarm panel integration is simulated in this demo. The scripted live picture runs for Level 22, UOA Corporate Tower.
            </div>
          </section>
        </aside>
      </div>
      {confirm && (
        <ConfirmDialog
          urgent
          title={`Trigger a ${g.short} incident in ${tower.name}?`}
          description={`This sends guidance now to ${RECIPIENTS} people. Origin floor: Level ${floor}.`}
          confirmLabel={`Trigger ${g.short} incident now`}
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            setConfirm(false);
            dispatch({ type: 'trigger', kind, towerId, floor });
            go('dashboard');
          }}>
          <ul>
            <li>Staff see &ldquo;{g.title}&rdquo; with the guidance shown on this screen.</li>
            <li>Help requests are sent for people whose profile says they need help on stairs.</li>
            <li>The live incident banner, dashboard and incident log start.</li>
          </ul>
        </ConfirmDialog>
      )}
    </main>
  );
}
