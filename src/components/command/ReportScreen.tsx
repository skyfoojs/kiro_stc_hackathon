import { useState } from 'react';

import { useCommand } from '@/hooks/use-command';
import { ACCOUNTS, isCounted } from '@/lib/command/demo-data';
import { planLines, planTitle } from '@/lib/command/plan';
import { nowSec, rankUnaccounted, towerName } from '@/lib/command/selectors';
import { hms, TODAY_LABEL } from '@/lib/command/time';
import type { Person } from '@/types/command';

import Icon from './Icon';

interface Row {
  status: string;
  name: string;
  company: string;
  where: string;
  need: string;
}

export default function ReportScreen() {
  const { state, dispatch } = useCommand();
  const [copy, setCopy] = useState<'idle' | 'done' | 'failed'>('idle');
  const inc = state.incident;

  if (!inc) {
    return (
      <main className="page">
        <h1>Share with Bomba</h1>
        <section className="card empty">
          <Icon name="doc" size={40} />
          <h2>No live incident</h2>
          <p className="sub">The report lists everyone still inside once an incident is live.</p>
        </section>
      </main>
    );
  }

  const inside = (p: Person) => isCounted(p) && p.towerId === inc.towerId && p.status !== 'safe';
  const people = state.people.filter(inside);
  const visitors = state.visitors.filter((v) => v.towerId === inc.towerId && v.status === 'unacc');
  const floors = [...new Set([...people.map((p) => p.floor), ...visitors.map((v) => v.floor)])].sort((a, b) => b - a);
  const wait = people.filter((p) => p.status === 'wait').length;
  const unacc = people.filter((p) => p.status === 'unacc').length;
  const total = people.length + visitors.length;
  const lines = planLines(state);
  const generated = hms(nowSec(state));
  const by = state.account ? `${ACCOUNTS[state.account].name}, ${ACCOUNTS[state.account].roleLabel}` : '';

  const rowsFor = (f: number): Row[] => [
    ...people
      .filter((p) => p.floor === f && p.status === 'wait')
      .map((p) => ({ status: 'Waiting for help', name: p.name, company: p.company, where: `${p.place.replace(/^L\d+, /, '')}, ${p.time}`, need: p.need ?? '' })),
    ...rankUnaccounted(people.filter((p) => p.floor === f && p.status === 'unacc')).map((p) => ({
      status: 'Unaccounted for',
      name: p.name,
      company: p.company,
      where: p.time ? `Last seen L${p.floor}, ${p.time}` : 'No update since sign-in',
      need: '',
    })),
    ...visitors
      .filter((v) => v.floor === f)
      .map((v) => ({ status: 'Visitor, unaccounted for', name: v.name, company: `Visiting ${v.visiting}`, where: `QR check-in ${v.checkedIn}, no update since`, need: '' })),
  ];

  const text = [
    `Relay report for Bomba. ${planTitle(state)}. Generated ${generated}, ${TODAY_LABEL}.`,
    ...lines.map((l, i) => `${i + 1}. ${l.text}`),
    `Still inside: ${total} people. ${wait} waiting for help, ${unacc} unaccounted for, ${visitors.length} visitor${visitors.length === 1 ? '' : 's'} unaccounted for.`,
    ...floors.flatMap((f) => rowsFor(f).map((r) => `L${f}: ${r.name} (${r.company}), ${r.status.toLowerCase()}, ${r.where}.${r.need ? ` Need: ${r.need}` : ''}`)),
    `Plan version ${state.plan.version}.`,
  ].join('\n');

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopy('done');
    } catch {
      setCopy('failed');
    }
  };

  return (
    <main className="page" style={{ gap: 20 }}>
      <div className="no-print stack" style={{ gap: 6 }}>
        <h1>Share with Bomba</h1>
        <p className="sub">The plan, then everyone still inside grouped by floor. Designed to read on paper in black and white.</p>
      </div>
      <div className="toolbar no-print" role="toolbar" aria-label="Report actions">
        <button type="button" className="btn b-pri" onClick={onCopy}>
          <Icon name="copy" />
          {copy === 'done' ? 'Copied' : 'Copy report'}
        </button>
        <button type="button" className="btn b-sec" onClick={() => window.print()}>
          <Icon name="print" />
          Print
        </button>
        <button type="button" className="btn b-sec" disabled={!!state.reportSharedAt} onClick={() => dispatch({ type: 'mark-shared' })}>
          Mark as shared with Bomba
        </button>
        <span role="status" style={{ marginLeft: 'auto' }}>
          {copy === 'failed' ? (
            <span className="chip c-unacc">
              <Icon name="unacc" />
              Couldn&apos;t copy. Select the report text and copy it.
            </span>
          ) : state.reportSharedAt ? (
            <span className="chip c-safe">
              <Icon name="safe" />
              Shared with Bomba at {state.reportSharedAt}. Added to the log.
            </span>
          ) : (
            <span className="chip c-neutral">Not yet shared</span>
          )}
        </span>
      </div>

      <article className="paper" aria-label="Report for Bomba">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, borderBottom: '3px solid #000', paddingBottom: 14 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700 }}>Relay report for Bomba</p>
            <h2>
              {planTitle(state)}. Origin: Level {inc.floor}.
            </h2>
          </div>
          <p className="tab" style={{ textAlign: 'right', fontSize: 14 }}>
            {TODAY_LABEL}
            <br />
            Generated {generated}
            <br />
            {by}
          </p>
        </div>
        <div className="pfl">
          <h3>Plan, version {state.plan.version} (advice for review)</h3>
          <ol>
            {lines.map((l) => (
              <li key={l.id}>{l.text}</li>
            ))}
          </ol>
        </div>
        <p style={{ fontSize: 17, paddingTop: 18 }}>
          <b>Still inside: {total} people.</b> {wait} waiting for help, {unacc} unaccounted for, {visitors.length} visitor{visitors.length === 1 ? '' : 's'} unaccounted for.
        </p>
        <div className="pnote">Unaccounted for means no check-in since the alert. It does not confirm the person is inside.</div>
        {floors.length === 0 && <p style={{ paddingTop: 18 }}>Everyone in {towerName(inc.towerId)} is accounted for.</p>}
        {floors.map((f) => (
          <section key={f} className="pfl">
            <h3>
              Level {f}
              {f === inc.floor ? ' (origin floor)' : ''}
            </h3>
            <table className="ptbl">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Last known location</th>
                  <th>Stated need</th>
                </tr>
              </thead>
              <tbody>
                {rowsFor(f).map((r) => (
                  <tr key={r.name}>
                    <td className="st">{r.status}</td>
                    <td>{r.status.startsWith('Waiting') ? <b>{r.name}</b> : r.name}</td>
                    <td>{r.company}</td>
                    <td>{r.where}</td>
                    <td>{r.need}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
        <p style={{ fontSize: 13.5, paddingTop: 24, borderTop: '1px solid #000', marginTop: 24 }}>
          Bomba lift lobby and {state.markers.wait} are marked on the Level {inc.floor} floor plan. Control room: UOA Security, {towerName(inc.towerId)}.
        </p>
      </article>
    </main>
  );
}
