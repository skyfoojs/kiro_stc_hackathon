import { useCommand } from '@/hooks/use-command';
import { ACCOUNTS } from '@/lib/command/demo-data';
import type { Role } from '@/types/command';

import Icon, { type IconName } from './Icon';
import PingBadge from './PingBadge';

interface NavItem {
  route: string;
  label: string;
  icon: IconName;
  roles: Role[];
}

const INCIDENT_ITEMS: NavItem[] = [
  { route: 'dashboard', label: 'Live dashboard', icon: 'dashboard', roles: ['security', 'commander', 'admin'] },
  { route: 'building', label: '3D building', icon: 'map', roles: ['security', 'commander', 'admin'] },
  { route: 'trigger', label: 'Trigger incident', icon: 'bell', roles: ['security'] },
  { route: 'dispatch', label: 'Dispatch and comms', icon: 'dispatch', roles: ['security', 'commander'] },
  { route: 'report', label: 'Share with Bomba', icon: 'doc', roles: ['security', 'commander', 'admin'] },
  { route: 'log', label: 'Incident log', icon: 'timeline', roles: ['security', 'commander', 'admin'] },
  { route: 'visitors', label: 'Visitors', icon: 'visitor', roles: ['security', 'commander', 'admin'] },
];

const ADMIN_ITEMS: NavItem[] = [
  { route: 'people', label: 'People and profiles', icon: 'people', roles: ['admin'] },
  { route: 'maps', label: 'Building maps', icon: 'map', roles: ['admin'] },
  { route: 'audit', label: 'Audit log', icon: 'audit', roles: ['admin'] },
];

export default function Sidebar({ active }: { active: string }) {
  const { state, dispatch, go } = useCommand();
  if (!state.account) return null;
  const acc = ACCOUNTS[state.account];
  const items = INCIDENT_ITEMS.filter((i) => i.roles.includes(acc.role));
  const admin = ADMIN_ITEMS.filter((i) => i.roles.includes(acc.role));
  const canSwitch = acc.role === 'security' || acc.role === 'commander';

  const link = (i: NavItem) => (
    <a
      key={i.route}
      href={`#${i.route}`}
      className="nav-item"
      aria-current={active === i.route ? 'page' : undefined}
      onClick={(e) => {
        e.preventDefault();
        go(i.route);
      }}>
      <Icon name={i.icon} strokeWidth={2} />
      {i.label}
    </a>
  );

  return (
    <nav className="nav" aria-label="Main">
      <div className="nav-brand">
        <PingBadge height={40} />
        <div>
          <b>Relay Command</b>
          <span>The Vertical control room</span>
        </div>
      </div>
      <span className="nav-sec">Incident</span>
      {items.map(link)}
      {admin.length > 0 && <span className="nav-sec gap">Admin</span>}
      {admin.map(link)}
      <div className="nav-foot">
        <div className="nav-user">
          <span className="av" aria-hidden="true">
            {acc.initials}
          </span>
          <div>
            <b>{acc.name}</b>
            <span>{acc.roleLabel}</span>
          </div>
        </div>
        {canSwitch && (
          <button type="button" className="nav-link" onClick={() => dispatch({ type: 'switch-role' })}>
            {acc.role === 'security' ? 'Switch to Bomba commander' : 'Switch to UOA security'}
          </button>
        )}
        <button
          type="button"
          className="nav-link"
          onClick={() => {
            dispatch({ type: 'sign-out' });
            go('login');
          }}>
          Switch account
        </button>
        <div className="nav-status" role="status">
          <span>
            <span className={`dot${state.liveLink ? ' on' : ''}`} />
            {state.liveLink ? 'Live link: connected' : 'Live link: not connected, scripted demo'}
          </span>
          <span>If data drops, teams get a text summary every 60 seconds.</span>
          <button type="button" className="nav-link" onClick={() => dispatch({ type: 'reset', nowMs: Date.now() })}>
            Reset demo data
          </button>
        </div>
      </div>
    </nav>
  );
}
