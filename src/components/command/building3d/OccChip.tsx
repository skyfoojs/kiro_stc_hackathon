import Icon, { type IconName } from '@/components/command/Icon';
import { OCC_LABEL } from '@/lib/command/building3d/status';
import type { OccupantView } from '@/lib/command/building3d/types';

const ICON: Record<OccupantView['status'], IconName> = {
  active: 'eye',
  assist: 'people',
  waiting: 'wait',
  unacc: 'unacc',
  safe: 'safe',
};

/** Status as colour, icon and words. Orange only while a help request is unacknowledged. */
export default function OccChip({ o }: { o: Pick<OccupantView, 'status' | 'help'> }) {
  const urgent = o.status === 'waiting' && !o.help?.ackBy;
  const label = urgent ? 'Waiting, not acknowledged' : OCC_LABEL[o.status];
  return (
    <span className={`b3d-chip k-${urgent ? 'urgent' : o.status}`}>
      <Icon name={ICON[o.status]} size={15} color="currentColor" />
      {label}
    </span>
  );
}
