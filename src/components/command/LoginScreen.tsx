import { useCommand } from '@/hooks/use-command';
import { ACCOUNTS } from '@/lib/command/demo-data';
import type { AccountId } from '@/types/command';

import Icon from './Icon';
import PingBadge from './PingBadge';

const ORDER: AccountId[] = ['hasnah', 'razak', 'tan'];
const LANDING: Record<AccountId, string> = { hasnah: 'dashboard', razak: 'dashboard', tan: 'people' };
const SHORT: Record<AccountId, string> = { hasnah: 'Hasnah', razak: 'Captain Razak', tan: 'Mr. Tan' };

function TowersArt() {
  return (
    <svg viewBox="0 0 420 300" style={{ width: '100%', maxWidth: 440 }} role="img" aria-label="The four towers of The Vertical, Bangsar South">
      <g fill="none" stroke="#C9D4DF" strokeWidth="2">
        <rect x="20" y="70" width="70" height="210" rx="4" />
        <rect x="5" y="230" width="100" height="50" rx="4" />
        <rect x="120" y="90" width="66" height="190" rx="4" />
        <rect x="108" y="236" width="90" height="44" rx="4" />
        <rect x="222" y="40" width="74" height="240" rx="4" stroke="#FFFFFF" strokeWidth="2.6" />
        <rect x="326" y="20" width="76" height="260" rx="4" />
        <path d="M0 281h420" />
      </g>
      <rect x="232" y="120" width="54" height="10" rx="2" fill="#FF5A1F" />
      <text x="259" y="296" fill="#C9D4DF" fontSize="13" textAnchor="middle" fontFamily="inherit">
        UOA Corporate Tower
      </text>
    </svg>
  );
}

export default function LoginScreen() {
  const { dispatch, go } = useCommand();
  return (
    <>
      <div className="login-art">
        <div className="row" style={{ gap: 12 }}>
          <PingBadge height={44} />
          <span style={{ fontWeight: 800, fontSize: 22 }}>Relay Command</span>
        </div>
        <TowersArt />
        <div className="stack" style={{ gap: 8 }}>
          <p style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.25, maxWidth: 440 }}>
            Know who is safe, who is waiting and who is still missing, floor by floor.
          </p>
          <p style={{ color: 'var(--line)' }}>The Vertical, Bangsar South. Four towers, one control room.</p>
        </div>
      </div>
      <main className="login-main">
        <div className="login-box">
          <div className="stack" style={{ gap: 6 }}>
            <h1 style={{ fontSize: 30 }}>Sign in to the control room</h1>
            <p className="sub" style={{ fontSize: 16 }}>
              Demo accounts. One tap signs you in.
            </p>
          </div>
          {ORDER.map((id) => {
            const a = ACCOUNTS[id];
            return (
              <button
                key={id}
                type="button"
                className="acct"
                onClick={() => {
                  dispatch({ type: 'sign-in', account: id });
                  go(LANDING[id]);
                }}>
                <span className="av" aria-hidden="true" style={id === 'hasnah' ? undefined : { background: 'var(--navy-2)' }}>
                  {a.initials}
                </span>
                <span>
                  <span style={{ display: 'block', fontWeight: 800, fontSize: 19 }}>{a.name}</span>
                  <span style={{ display: 'block', color: 'var(--slate)' }}>{a.roleLabel}</span>
                  <span className="perm">
                    {a.perms.map((p) => (
                      <span key={p}>{p}</span>
                    ))}
                  </span>
                </span>
                <span className="go">
                  Sign in as {SHORT[id]}
                  <Icon name="chev" size={18} strokeWidth={2.4} />
                </span>
              </button>
            );
          })}
          <p className="note" style={{ background: 'transparent', border: 0, padding: 0 }}>
            <Icon name="info" size={18} strokeWidth={2} />
            Demo build with mock data. No passwords are used. In real use, each person signs in with their own UOA or Bomba account.
          </p>
        </div>
      </main>
    </>
  );
}
