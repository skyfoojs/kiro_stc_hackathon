import Icon from '@/components/command/Icon';
import { CATEGORY_LABEL, TEAM_STATUS_LABEL } from '@/lib/command/building3d/status';
import type { TeamView } from '@/lib/command/building3d/types';

import TeamProgress from './TeamProgress';

interface Props {
  t: TeamView;
  onFocus: () => void;
  onFloor: (n: number) => void;
}

export default function TeamDetail({ t, onFocus, onFloor }: Props) {
  return (
    <div className="b3d-detail">
      <div className="b3d-detail-head">
        <span className="b3d-lbl">{CATEGORY_LABEL[t.category]}</span>
        <h2 className="b3d-title">{t.name}</h2>
        <span className="b3d-chip k-team">
          <Icon name="shield" size={15} color="currentColor" />
          {TEAM_STATUS_LABEL[t.status]}
        </span>
      </div>
      <TeamProgress status={t.status} />
      <dl className="b3d-dl">
        <dt>Current task</dt>
        <dd>{t.task}</dd>
        <dt>Assigned floor</dt>
        <dd>
          {t.assignedFloor ? (
            <button type="button" className="b3d-link" onClick={() => onFloor(t.assignedFloor as number)}>
              Level {t.assignedFloor}
            </button>
          ) : (
            'None, outside the building'
          )}
        </dd>
        <dt>Reported arrival</dt>
        <dd>{t.eta ?? 'Not reported'}</dd>
        <dt>Latest message</dt>
        <dd>
          {t.words ? `"${t.words}"` : 'No message yet'}
          {t.updated && <span className="b3d-sub"> {t.updated}</span>}
        </dd>
      </dl>
      <p className="b3d-note">
        Position is approximate, drawn from the team&apos;s reported status. Relay does not track responders and does not decide how many people
        a team sends.
      </p>
      <button type="button" className="b3d-btn" onClick={onFocus}>
        Focus in 3D
      </button>
    </div>
  );
}
