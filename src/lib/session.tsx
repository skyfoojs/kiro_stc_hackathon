import type { Session } from '@supabase/supabase-js';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { fetchProfile } from '@/lib/incidents';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/incident';

type SessionState = {
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  profileError: string | null;
  reloadProfile: () => void;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const loadedFor = useRef<string | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    setProfileError(null);
    try {
      setProfile(await fetchProfile(userId));
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : 'Could not load your profile.');
    }
  }, []);

  useEffect(() => {
    const apply = (next: Session | null) => {
      setSession(next);
      const userId = next?.user.id ?? null;
      if (userId === loadedFor.current) return; // token refresh, same user
      loadedFor.current = userId;
      setProfile(null);
      // Supabase advises against awaiting its own calls inside the auth callback.
      if (userId) setTimeout(() => loadProfile(userId), 0);
    };

    supabase.auth.getSession().then(({ data }) => {
      apply(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => apply(next));
    return () => data.subscription.unsubscribe();
  }, [loadProfile]);

  const reloadProfile = useCallback(() => {
    if (loadedFor.current) loadProfile(loadedFor.current);
  }, [loadProfile]);

  return (
    <SessionContext.Provider value={{ ready, session, profile, profileError, reloadProfile }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
