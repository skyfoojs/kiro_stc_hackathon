import { useRouter } from 'expo-router';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { fetchActiveIncident, reportIncident } from '@/lib/incidents';
import type { ReportType } from '@/lib/labels';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import type { ActiveIncident } from '@/types/incident';

type IncidentState = {
  active: ActiveIncident | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** "I saw an emergency": reports it and shows the reporter's alert screen. */
  report: (type: ReportType) => Promise<void>;
};

const IncidentContext = createContext<IncidentState | null>(null);

// Keeps the current emergency in sync for every screen. When someone else
// reports an emergency in the user's tower, the red alarm opens straight away.
// The reporter sees the orange alert instead.
export function IncidentProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { session, profile } = useSession();
  const [active, setActive] = useState<ActiveIncident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seenIncidentId = useRef<string | null | undefined>(undefined);
  const alertedIncidentId = useRef<string | null>(null);
  const reporting = useRef(false);

  // Opens one alert screen per incident, however many times it's asked.
  const showAlert = useCallback(
    (incidentId: string, screen: '/alert' | '/alarm') => {
      if (alertedIncidentId.current === incidentId) return;
      alertedIncidentId.current = incidentId;
      router.push(screen);
    },
    [router],
  );

  const refresh = useCallback(
    () =>
      fetchActiveIncident().then(
        (next) => {
          setError(null);
          setActive(next);
          setLoading(false);
          const nextId = next?.incident.id ?? null;
          // First load just records the state; later a new id means a new alert.
          const prevId = seenIncidentId.current;
          if (!reporting.current && prevId !== undefined && nextId && nextId !== prevId) {
            showAlert(nextId, '/alarm');
          }
          // The emergency was ended by management: show the all clear.
          if (prevId && !nextId) {
            router.replace('/ended');
          }
          seenIncidentId.current = nextId;
        },
        (e: unknown) => {
          setError(e instanceof Error ? e.message : 'Could not check for emergencies.');
          setLoading(false);
        },
      ),
    [showAlert, router],
  );

  const report = useCallback(async (type: ReportType) => {
    reporting.current = true;
    try {
      const { incidentId } = await reportIncident(type);
      await refresh();
      showAlert(incidentId, '/alert');
    } finally {
      reporting.current = false;
    }
  }, [refresh, showAlert]);

  const userId = session?.user.id;
  const towerId = profile?.tower_id;

  useEffect(() => {
    if (!userId || !towerId) return;
    refresh();

    const channel = supabase
      .channel(`relay-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents', filter: `tower_id=eq.${towerId}` }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'help_requests', filter: `requester_id=eq.${userId}` }, () => refresh())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'incident_occupants', filter: `user_id=eq.${userId}` }, () => refresh())
      .subscribe();

    // Catch anything missed while the app was in the background.
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });

    return () => {
      supabase.removeChannel(channel);
      sub.remove();
    };
  }, [userId, towerId, refresh]);

  return <IncidentContext.Provider value={{ active, loading, error, refresh, report }}>{children}</IncidentContext.Provider>;
}

export function useIncident(): IncidentState {
  const value = useContext(IncidentContext);
  if (!value) throw new Error('useIncident must be used inside IncidentProvider');
  return value;
}
