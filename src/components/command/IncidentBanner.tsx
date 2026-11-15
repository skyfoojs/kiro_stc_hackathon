import { useState } from 'react';

import { useCommand } from '@/hooks/use-command';
import { DEMO_FLOOR, DEMO_TOWER_ID, GUIDANCE } from '@/lib/command/demo-data';
import { nowSec, role, towerName } from '@/lib/command/selectors';
import { duration, hms } from '@/lib/command/time';

import ConfirmDialog from './ConfirmDialog';
import Icon from './Icon';

const KIND_ICON = { fire: 'fire', earthquake: 'quake', outage: 'bolt', security: 'lock' } as const;

export default function IncidentBanner() {
  const { state, dispatch, go } = useCommand();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const r = role(state);
  const inc = state.incident;

  if (!inc) {
    return (
      <section className="calm" role="status" aria-label="No live incident">
        <Icon name="safe" size={24} />
        <b style={{ fontSize: 18 }}>No incident. All towers normal.</b>
        {r === 'security' && (
          <button
            type="button"
            className="btn b-urg"
            style={{ marginLeft: 'auto', minHeight: 48, fontSize: 17 }}
            onClick={() => {
              dispatch({ type: 'trigger', kind: 'fire', towerId: DEMO_TOWER_ID, floor: DEMO_FLOOR });
              go('dashboard');
            }}>
            Trigger a fire on Level 22
          </button>
        )}
      </section>
    );
  }

  const g = GUIDANCE[inc.kind];
  return (
    <>
      <section className="banner" role="status" aria-label="Live incident">
        <span className="title">
          <Icon name={KIND_ICON[inc.kind]} size={28} color="var(--navy)" />
          {g.banner}
        </span>
        <span className="where">
          {towerName(inc.towerId)}, Level {inc.floor}
        </span>
        <span>
          Triggered {hms(inc.startSec)} by {inc.by}
        </span>
        <span className="elapsed">
          Elapsed <b>{duration(nowSec(state) - inc.startSec)}</b>
        </span>
        {r === 'security' && (
          <button type="button" className="btn b-pri end" onClick={() => setConfirmEnd(true)}>
            End incident
          </button>
        )}
      </section>
      {confirmEnd && (
        <ConfirmDialog
          title="End this incident?"
          description={`This closes the live incident in ${towerName(inc.towerId)} and stops the timer. The log is kept.`}
          confirmLabel="End incident now"
          onCancel={() => setConfirmEnd(false)}
          onConfirm={() => {
            setConfirmEnd(false);
            dispatch({ type: 'end-incident' });
          }}
        />
      )}
    </>
  );
}
