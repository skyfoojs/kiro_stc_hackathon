import type { PersonStatus } from '@/types/command';

import Icon from './Icon';

const LABEL: Record<PersonStatus, string> = {
  safe: 'Safe',
  wait: 'Waiting for help',
  unacc: 'Unaccounted for',
};

interface Props {
  status: PersonStatus;
  /** Replaces the default label, e.g. "9 safe". */
  text?: string;
}

/** Status is always colour plus icon shape plus words, never colour alone. */
export default function StatusChip({ status, text }: Props) {
  return (
    <span className={`chip c-${status}`}>
      <Icon name={status} />
      {text ?? LABEL[status]}
    </span>
  );
}
