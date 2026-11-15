import { createContext, useContext, type Dispatch } from 'react';

import type { Action } from '@/lib/command/store';
import type { CommandState } from '@/types/command';

export interface CommandContextValue {
  state: CommandState;
  dispatch: Dispatch<Action>;
  go: (route: string) => void;
}

export const CommandContext = createContext<CommandContextValue | null>(null);

export function useCommand(): CommandContextValue {
  const ctx = useContext(CommandContext);
  if (!ctx) throw new Error('useCommand must be used inside the Command console');
  return ctx;
}
