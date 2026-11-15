import { useCommand } from '@/hooks/use-command';
import { towerName } from '@/lib/command/selectors';
import { TODAY_LABEL } from '@/lib/command/time';

import Icon from './Icon';
import StatusChip from './StatusChip';

export default function VisitorsScreen() {
  const { state } = useCommand();
  const inc = state.incident;
  const inTower = state.visitors.filter((v) => inc && v.towerId === inc.towerId);
  const unacc = inTower.filter((v) => v.status === 'unacc').length;

  return (
    <main className="page" style={{ gap: 20 }}>
      <div className="stack" style={{ gap: 6 }}>
        <h1>Visitors</h1>
        <p className="sub">Checked in today by scanning the QR code at reception. {TODAY_LABEL}.</p>
      </div>
      <div className="stats">
        <div className="stat">
          <span className="sub">Checked in today</span>
          <b>{state.visitors.length}</b>
        </div>
        <div className="stat">
          <span className="sub">{inc ? `In ${towerName(inc.towerId)}` : 'In an affected tower'}</span>
          <b>{inTower.length}</b>
        </div>
        <div className="stat">
          <span className="sub">Unaccounted for</span>
          <b style={{ color: unacc ? 'var(--unacc)' : undefined }}>{unacc}</b>
        </div>
      </div>
      <section className="card" aria-labelledby="v-h" style={{ padding: '8px 8px 4px' }}>
        <h2 id="v-h" style={{ padding: '12px 12px 4px' }}>
          Today&apos;s visitors
        </h2>
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Visitor</th>
                <th scope="col">Visiting</th>
                <th scope="col">Tower and floor</th>
                <th scope="col">Checked in</th>
                <th scope="col">Status during incident</th>
                <th scope="col">Last update</th>
              </tr>
            </thead>
            <tbody>
              {state.visitors.map((v) => {
                const affected = inc && v.towerId === inc.towerId;
                return (
                  <tr key={v.id}>
                    <td>
                      <b>{v.name}</b>
                    </td>
                    <td>{v.visiting}</td>
                    <td>
                      {towerName(v.towerId)}, L{v.floor}
                    </td>
                    <td className="tab">{v.checkedIn}</td>
                    <td>
                      {!inc ? (
                        <span className="chip c-plain">No live incident</span>
                      ) : affected && v.status !== 'elsewhere' ? (
                        <StatusChip status={v.status} />
                      ) : (
                        <span className="chip c-plain">Not in affected tower</span>
                      )}
                    </td>
                    <td className="tab">{affected ? v.last : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <div className="note">
        <Icon name="info" size={18} strokeWidth={2} />
        Visitors in the affected tower get the same guidance as staff and appear in the Bomba report.
      </div>
    </main>
  );
}
