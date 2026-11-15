import { TEAM_STATUS_LABEL, TEAM_STEPS } from '@/lib/command/building3d/status';
import type { TeamStatus } from '@/types/command';

/** Reported progress steps. Done steps are ticked, the current one is bold; never colour alone. */
export default function TeamProgress({ status }: { status: TeamStatus }) {
  const idx = TEAM_STEPS.indexOf(status);
  return (
    <ol className="b3d-steps" aria-label={`Reported status: ${TEAM_STATUS_LABEL[status]}`}>
      {TEAM_STEPS.map((s, i) => (
        <li key={s} className={i < idx ? 'done' : i === idx ? 'cur' : ''}>
          <span aria-hidden="true">{i < idx ? '✓' : i === idx ? '●' : '○'}</span>
          {TEAM_STATUS_LABEL[s]}
        </li>
      ))}
    </ol>
  );
}
