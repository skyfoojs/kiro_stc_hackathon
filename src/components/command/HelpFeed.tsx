import { useCommand } from '@/hooks/use-command';
import { activeHelp, canSeeNames, nowSec, person, role, towerName } from '@/lib/command/selectors';
import { duration } from '@/lib/command/time';
import type { HelpRequest } from '@/types/command';

import Icon from './Icon';
import StatusChip from './StatusChip';

function HelpCard({ h }: { h: HelpRequest }) {
  const { state, dispatch, go } = useCommand();
  const p = person(state, h.personId);
  if (!p) return null;
  const r = role(state);
  const rescueAck = h.acks.find((a) => a.rescue);
  const seen = h.acks.find((a) => !a.rescue);
  const waited = duration(nowSec(state) - h.atSec);
  const name = canSeeNames(r) ? p.name : 'Person waiting';

  return (
    <article className={rescueAck ? 'feed-item' : 'feed-item urgent'} aria-label={`Help request, ${name}`}>
      {!rescueAck && (
        <div className="esc-head">
          <Icon name="unacc" size={20} color="var(--navy)" />
          {h.escalated ? 'Escalated to control room: not acknowledged after 60 s' : 'Not yet acknowledged by a rescue team'}
        </div>
      )}
      <div className="fi-body">
        <div className="row" style={{ justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h3>{name}</h3>
            <p className="sub">
              {towerName(p.towerId)}, Level {p.floor}, {h.where}
            </p>
          </div>
          <StatusChip status="wait" />
        </div>
        {p.need && (
          <p style={{ fontSize: 15 }}>
            <b>Stated need:</b> {p.need}
          </p>
        )}
        <div className="who">
          <span>{h.auto ? 'Sent automatically from the assistance profile' : 'Tapped "I need help"'}</span>
          <span className="t">{h.at}</span>
          <span>
            <b>Waiting</b>
          </span>
          <span className="t" style={{ color: 'var(--navy)', fontWeight: 700 }}>
            {waited}
          </span>
          {seen && (
            <>
              <span>Seen by UOA security</span>
              <span className="t">{seen.at}</span>
            </>
          )}
          {rescueAck && (
            <>
              <span>Acknowledged by {rescueAck.by}</span>
              <span className="t">{rescueAck.at}</span>
            </>
          )}
        </div>
        <div className="row">
          {rescueAck && <span className="chip c-neutral">First rescue acknowledgement in {duration(rescueAck.atSec - h.atSec)}</span>}
          {r === 'security' && !state.plan.sentAt && (
            <button type="button" className="btn b-pri" onClick={() => go('dispatch')}>
              Send plan for review
            </button>
          )}
          {r === 'security' && !seen && (
            <button type="button" className="btn b-sec" onClick={() => dispatch({ type: 'control-room-seen', personId: p.id })}>
              Mark as seen by control room
            </button>
          )}
          <button type="button" className="btn b-sec" onClick={() => go(`person/${p.id}`)}>
            {canSeeNames(r) ? `View ${p.name.split(' ')[0]}'s details` : 'View details (logged)'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function HelpFeed() {
  const { state } = useCommand();
  const items = [...activeHelp(state)].sort((a, b) => {
    const ua = a.acks.some((k) => k.rescue) ? 1 : 0;
    const ub = b.acks.some((k) => k.rescue) ? 1 : 0;
    return ua - ub || Number(b.escalated) - Number(a.escalated) || a.atSec - b.atSec;
  });

  return (
    <section className="card stack" aria-labelledby="feed-h">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <h2 id="feed-h">Help requests and escalations</h2>
        <span className="sub">Escalates to the control room if no rescue team acknowledges in 60 s</span>
      </div>
      {items.length === 0 ? (
        <p className="sub soft">No open help requests. A request appears here the moment it arrives.</p>
      ) : (
        items.map((h) => <HelpCard key={h.personId} h={h} />)
      )}
    </section>
  );
}
