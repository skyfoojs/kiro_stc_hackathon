'use dom';

import './command.css';

import { useCallback, useEffect, useMemo, useReducer, useRef, useSyncExternalStore, type ReactNode } from 'react';

import { CommandContext } from '@/hooks/use-command';
import { ACCOUNTS } from '@/lib/command/demo-data';
import { CHANNEL_NAME, messageToAction } from '@/lib/command/live-link';
import { commandReducer, initialState } from '@/lib/command/store';
import type { Role } from '@/types/command';

import AuditScreen from './AuditScreen';
import Building3DScreen from './building3d/Building3DScreen';
import DashboardScreen from './DashboardScreen';
import DispatchScreen from './DispatchScreen';
import IncidentBanner from './IncidentBanner';
import LoginScreen from './LoginScreen';
import LogScreen from './LogScreen';
import MapsScreen from './MapsScreen';
import PeopleScreen from './PeopleScreen';
import PersonDrawer from './PersonDrawer';
import ReportScreen from './ReportScreen';
import Sidebar from './Sidebar';
import TriggerScreen from './TriggerScreen';
import VisitorsScreen from './VisitorsScreen';

const ROUTES: Record<string, { roles: Role[]; render: () => ReactNode }> = {
  dashboard: { roles: ['security', 'commander', 'admin'], render: () => <DashboardScreen /> },
  building: { roles: ['security', 'commander', 'admin'], render: () => <Building3DScreen /> },
  trigger: { roles: ['security'], render: () => <TriggerScreen /> },
  dispatch: { roles: ['security', 'commander'], render: () => <DispatchScreen /> },
  report: { roles: ['security', 'commander', 'admin'], render: () => <ReportScreen /> },
  log: { roles: ['security', 'commander', 'admin'], render: () => <LogScreen /> },
  visitors: { roles: ['security', 'commander', 'admin'], render: () => <VisitorsScreen /> },
  people: { roles: ['admin'], render: () => <PeopleScreen /> },
  maps: { roles: ['admin'], render: () => <MapsScreen /> },
  audit: { roles: ['admin'], render: () => <AuditScreen /> },
};

function readHash(): string {
  return window.location.hash.replace(/^#\/?/, '') || 'login';
}

function subscribeHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

/**
 * Relay Command console (management side). One DOM component so the desktop web view and the
 * native webview share the same code; hash routes match the management v1 handoff spec.
 */
export default function CommandConsole(_: { dom?: import('expo/dom').DOMProps }) {
  const [state, dispatch] = useReducer(commandReducer, undefined, () => initialState(Date.now()));
  // Null during server rendering, so the console only renders in the browser or webview.
  const route = useSyncExternalStore(subscribeHash, readHash, () => null);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const timer = setInterval(() => dispatch({ type: 'tick', nowMs: Date.now() }), 500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel(CHANNEL_NAME);
    ch.onmessage = (e: MessageEvent) => {
      const action = messageToAction(e.data, stateRef.current.people);
      if (!action) return;
      dispatch({ type: 'live-link', connected: true });
      dispatch(action);
    };
    return () => ch.close();
  }, []);

  const go = useCallback((r: string) => {
    window.location.hash = r;
  }, []);

  const role = state.account ? ACCOUNTS[state.account].role : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (!role || e.metaKey || e.ctrlKey || e.altKey || (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName))) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      if (e.key === '1') go('dashboard');
      if (e.key === '2' && role !== 'admin') go('dispatch');
      if ((e.key === 'r' || e.key === 'R') && role !== 'admin') dispatch({ type: 'switch-role' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [role, go]);

  // Each screen opens at the top; the drawer keeps the dashboard where it was.
  const screenKey = route?.startsWith('person/') ? 'dashboard' : route;
  useEffect(() => {
    document.querySelector('.rc .main')?.scrollTo(0, 0);
  }, [screenKey]);

  const ctx = useMemo(() => ({ state, dispatch, go }), [state, go]);
  const closeDrawer = useCallback(() => go('dashboard'), [go]);

  if (route === null) return null;

  const fonts = (
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;500;700;800&display=swap" precedence="default" />
  );

  if (!role || route === 'login') {
    return (
      <CommandContext.Provider value={ctx}>
        {fonts}
        <div className="rc login">
          <LoginScreen />
        </div>
      </CommandContext.Provider>
    );
  }

  const personId = route.startsWith('person/') ? route.slice('person/'.length) : null;
  const key = personId ? 'dashboard' : route;
  const allowed = ROUTES[key]?.roles.includes(role) ? key : 'dashboard';

  return (
    <CommandContext.Provider value={ctx}>
      {fonts}
      <div className="rc">
        <div className="sidecol">
          <Sidebar active={allowed} />
        </div>
        <div className="main">
          <div className="bn no-print">
            <IncidentBanner />
          </div>
          {ROUTES[allowed].render()}
        </div>
        {personId && <PersonDrawer key={personId} personId={personId} onClose={closeDrawer} />}
      </div>
    </CommandContext.Provider>
  );
}
