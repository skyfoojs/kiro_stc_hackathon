import { useCallback, useEffect, useRef } from 'react';

import { useIncident } from '@/lib/incident-context';
import { cancelHelp, requestHelp } from '@/lib/incidents';

// Incidents where the person tapped "I don't need help". Kept for the session so
// the request isn't sent again and the guidance shows the stairs, not the waiting point.
const declined = new Set<string>();

export function hasDeclinedHelp(incidentId: string): boolean {
  return declined.has(incidentId);
}

// Undo "I don't need help" when they later tap "I need help" themselves.
export function clearDeclinedHelp(incidentId: string): void {
  declined.delete(incidentId);
}

// People who said they'd need help on stairs have their request sent the moment
// an emergency starts, so they never have to find the button in a crisis.
// Sends once per incident; if they cancelled or declined, it isn't sent again.
export function useAutoHelp(): { auto: boolean; decline: () => Promise<void> } {
  const { active, refresh } = useIncident();
  const sentFor = useRef<string | null>(null);

  const auto = !!active && active.me.role === 'employee' && active.me.needs_assistance;
  const incidentId = active?.incident.id;
  const helpId = active?.help_request?.id;
  const helpOpen = active?.help_request?.status === 'open' || active?.help_request?.status === 'acknowledged';

  useEffect(() => {
    if (!active || !auto || declined.has(active.incident.id)) return;
    if (active.help_request || active.me.state === 'safe') return;
    if (sentFor.current === active.incident.id) return;
    sentFor.current = active.incident.id;
    requestHelp(active.incident.id)
      .then(refresh)
      .catch(() => {
        sentFor.current = null;
      });
  }, [active, auto, refresh]);

  // "I don't need help": cancel the automatic request (if it went out) and stop resending.
  const decline = useCallback(async () => {
    if (!incidentId) return;
    declined.add(incidentId);
    if (helpId && helpOpen) {
      await cancelHelp(helpId).catch(() => {});
      await refresh();
    }
  }, [incidentId, helpId, helpOpen, refresh]);

  return { auto, decline };
}
