import { useState } from 'react';

import { useCommand } from '@/hooks/use-command';
import { DEMO_FLOOR, DEMO_TOWER_ID, TOWERS } from '@/lib/command/demo-data';
import { activeHelp, floorCounts, floorsWithUnaccounted, isRescueAcked, nowSec, role, towerCounts } from '@/lib/command/selectors';
import { hms } from '@/lib/command/time';

import FloorPanel from './FloorPanel';
import FloorStack from './FloorStack';
import HelpFeed from './HelpFeed';
import Icon from './Icon';
import PlanCard from './PlanCard';

export default function DashboardScreen() {
  const { state, go } = useCommand();
  const inc = state.incident;
  const [towerId, setTowerId] = useState(inc?.towerId ?? DEMO_TOWER_ID);
  const [floor, setFloor] = useState(inc?.floor ?? DEMO_FLOOR);
  const r = role(state);
  const now = nowSec(state);
  const refreshed = hms(now - (now % 10));

  if (!inc) {
    return (
      <main className="page">
        <div className="page-head">
          <div>
            <h1>Live dashboard</h1>
            <p className="sub">Occupant counts per floor, once an incident is live.</p>
          </div>
        </div>
        <section className="card empty">
          <Icon name="safe" size={40} />
          <h2>No live incident</h2>
          <p className="sub" style={{ maxWidth: 520 }}>
            When an incident is triggered, this shows who is safe, who is waiting for help and who is unaccounted for, floor by floor, with the response plan.
          </p>
          {r === 'security' && (
            <button type="button" className="btn b-pri" onClick={() => go('trigger')}>
              Go to Trigger incident
            </button>
          )}
        </section>
      </main>
    );
  }

  const tc = towerCounts(state, towerId);
  const fc = floorCounts(state, inc.towerId, inc.floor);
  const open = activeHelp(state);
  const unackedHelp = open.filter((h) => !isRescueAcked(state, h.personId)).length;
  const sent = state.teams.filter((t) => t.status !== 'not-sent');
  const acked = sent.filter((t) => t.status !== 'sent');

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>Live dashboard</h1>
          <p className="sub">Occupant counts per floor. Response teams are not counted as occupants.</p>
        </div>
        <p className="sub tab row" style={{ gap: 8 }}>
          <Icon name="refresh" size={18} strokeWidth={2} />
          <span>
            Last refreshed <b style={{ color: 'var(--navy)' }}>{refreshed}</b>. Refreshes every 10 s.
          </span>
        </p>
      </div>
      <p className="sr-only" aria-live="polite">
        Level {inc.floor}: {fc.wait} waiting for help, {fc.safe} safe, {fc.unacc} unaccounted for.
      </p>

      <div className="row" role="group" aria-label="Tower" style={{ gap: 8 }}>
        {TOWERS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="pill"
            aria-pressed={towerId === t.id}
            onClick={() => {
              setTowerId(t.id);
              setFloor(t.id === inc.towerId ? inc.floor : Math.min(floor, t.floors));
            }}>
            {t.name}
            {t.id === inc.towerId && (
              <span className="chip c-urg" style={{ padding: '2px 8px' }}>
                Incident
              </span>
            )}
          </button>
        ))}
      </div>

      <section className="tiles" aria-label="Building totals">
        <div className="tile n-safe">
          <span className="lbl">Safe</span>
          <span className="n">
            <Icon name="safe" />
            {tc.safe}
          </span>
          <span className="sub">Checked in at an assembly point</span>
        </div>
        <div className="tile n-wait">
          <span className="lbl">Waiting for help</span>
          <span className="n">
            <Icon name="wait" />
            {tc.wait}
          </span>
          <span className="sub">{tc.wait === 0 ? 'No one waiting' : unackedHelp ? `${unackedHelp} not yet acknowledged` : 'All acknowledged by a rescue team'}</span>
        </div>
        <div className="tile n-unacc">
          <span className="lbl">Unaccounted for</span>
          <span className="n">
            <Icon name="unacc" />
            {tc.unacc}
          </span>
          <span className="sub">
            Across {floorsWithUnaccounted(state, towerId)} floor{floorsWithUnaccounted(state, towerId) === 1 ? '' : 's'}
          </span>
        </div>
        <div className="tile">
          <span className="lbl">Response teams acknowledged</span>
          <span className="n">
            <Icon name="shield" />
            {acked.length}
            <span className="sub" style={{ fontSize: 20, fontWeight: 700 }}>
              of {sent.length}
            </span>
          </span>
          <span className="sub">{sent.length ? 'Each team decides what it sends' : 'Plan not yet sent for review'}</span>
        </div>
      </section>
      <p className="sub" style={{ marginTop: -12 }}>
        Building: {tc.wait} waiting, {tc.safe} safe, {tc.unacc} unaccounted.
      </p>

      <div className="dash">
        <FloorStack towerId={towerId} selected={floor} onSelect={setFloor} />
        <div className="dash-right">
          <HelpFeed />
          <PlanCard />
          <FloorPanel towerId={towerId} floor={floor} />
        </div>
      </div>
    </main>
  );
}
