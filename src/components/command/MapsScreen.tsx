import { useState, type CSSProperties } from 'react';

import { useCommand } from '@/hooks/use-command';
import { DEMO_TOWER_ID, TOWERS } from '@/lib/command/demo-data';
import type { MarkerNames } from '@/types/command';

import Icon from './Icon';

const FIELDS: { key: keyof MarkerNames; label: string; k: string; shape?: CSSProperties }[] = [
  { key: 'a', label: 'Stairwell A', k: 'A' },
  { key: 'b', label: 'Stairwell B', k: 'B' },
  { key: 'lift', label: 'Bomba lift lobby', k: 'L', shape: { clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' } },
  { key: 'wait', label: 'Waiting point', k: 'W', shape: { borderRadius: '50%' } },
  { key: 'asm', label: 'Assembly point', k: 'P', shape: { clipPath: 'polygon(0 0, 100% 0, 80% 50%, 100% 100%, 0 100%)' } },
];

function FloorPlate({ n, floor, tower }: { n: MarkerNames; floor: number; tower: string }) {
  return (
    <svg
      viewBox="0 0 760 500"
      role="img"
      aria-label={`Level ${floor} floor plan, ${tower}. Central core with lifts. ${n.a} north-west of the core, ${n.b} south-east with the ${n.wait} beside it, ${n.lift} east of the core. ${n.asm} is outside, south of the tower.`}
      style={{ width: '100%', height: 'auto', fontFamily: 'inherit' }}>
      <rect x="20" y="20" width="720" height="380" rx="18" fill="#FAF8F7" stroke="#220901" strokeWidth="3" />
      <g stroke="#D8CFC9" strokeWidth="2" fill="none">
        <path d="M20 140h170M570 140h170M20 280h170M570 280h170M190 20v120M570 20v120M190 280v120M570 280v120" />
      </g>
      <text x="105" y="88" fontSize="15" fill="#6B5C55" textAnchor="middle">Tenant zone</text>
      <text x="655" y="88" fontSize="15" fill="#6B5C55" textAnchor="middle">Tenant zone</text>
      <text x="105" y="345" fontSize="15" fill="#6B5C55" textAnchor="middle">Tenant zone</text>
      <text x="655" y="345" fontSize="15" fill="#6B5C55" textAnchor="middle">Tenant zone</text>
      <rect x="270" y="150" width="220" height="120" rx="8" fill="#F0ECE9" stroke="#6B5C55" strokeWidth="2" />
      <text x="380" y="215" fontSize="15" fill="#6B5C55" textAnchor="middle">Core and lifts</text>
      <g>
        <rect x="232" y="122" width="36" height="36" fill="#220901" />
        <text x="250" y="146" fontSize="16" fontWeight="800" fill="#fff" textAnchor="middle">A</text>
        <text x="250" y="112" fontSize="14" fontWeight="700" fill="#220901" textAnchor="middle">{n.a}</text>
      </g>
      <g>
        <rect x="492" y="262" width="36" height="36" fill="#220901" />
        <text x="510" y="286" fontSize="16" fontWeight="800" fill="#fff" textAnchor="middle">B</text>
        <text x="510" y="318" fontSize="14" fontWeight="700" fill="#220901" textAnchor="middle">{n.b}</text>
      </g>
      <g>
        <path d="M520 192l18 18-18 18-18-18z" fill="#220901" />
        <text x="520" y="215" fontSize="13" fontWeight="800" fill="#fff" textAnchor="middle">L</text>
        <text x="548" y="196" fontSize="14" fontWeight="700" fill="#220901">{n.lift}</text>
      </g>
      <g>
        <circle cx="430" cy="300" r="18" fill="#220901" />
        <text x="430" y="305" fontSize="15" fontWeight="800" fill="#fff" textAnchor="middle">W</text>
        <text x="430" y="338" fontSize="14" fontWeight="700" fill="#220901" textAnchor="middle">{n.wait}</text>
      </g>
      <path d="M380 400v52" stroke="#220901" strokeWidth="3" strokeDasharray="6 6" />
      <g>
        <path d="M366 456h28l-6 10 6 10h-28z" fill="#220901" />
        <text x="404" y="472" fontSize="14" fontWeight="700" fill="#220901">{n.asm} (ground level, outside)</text>
      </g>
    </svg>
  );
}

export default function MapsScreen() {
  const { state, dispatch } = useCommand();
  const [towerId, setTowerId] = useState(DEMO_TOWER_ID);
  const [floor, setFloor] = useState(22);
  const [draft, setDraft] = useState<MarkerNames>(state.markers);
  const tower = TOWERS.find((t) => t.id === towerId) ?? TOWERS[2];
  const saved = JSON.stringify(draft) === JSON.stringify(state.markers);
  const staging = Math.max(1, floor - 2);

  return (
    <main className="page" style={{ gap: 20 }}>
      <div className="stack" style={{ gap: 6 }}>
        <h1>Building maps</h1>
        <p className="sub">Escape routes and meeting points per tower and floor. Staff see these names in their guidance, and the plan checker uses them.</p>
      </div>
      <div className="row" style={{ gap: 12, alignItems: 'flex-end' }}>
        <div className="row" role="group" aria-label="Tower" style={{ gap: 8 }}>
          {TOWERS.map((t) => (
            <button
              key={t.id}
              type="button"
              className="pill"
              aria-pressed={towerId === t.id}
              onClick={() => {
                setTowerId(t.id);
                setFloor(Math.min(floor, t.floors));
              }}>
              {t.name}
            </button>
          ))}
        </div>
        <div className="field" style={{ width: 180, marginLeft: 'auto' }}>
          <label className="lbl" htmlFor="fl">
            Floor
          </label>
          <select id="fl" value={floor} onChange={(e) => setFloor(Number(e.target.value))}>
            {Array.from({ length: tower.floors }, (_, i) => tower.floors - i).map((f) => (
              <option key={f} value={f}>
                Level {f}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid-map">
        <section className="card stack" aria-labelledby="fp-h" style={{ gap: 12 }}>
          <h2 id="fp-h">
            Level {floor} floor plate, {tower.name}
          </h2>
          <FloorPlate n={draft} floor={floor} tower={tower.name} />
          <p className="sub">
            Schematic, not an architectural plan. Marker shapes: square for stairwells, diamond for the Bomba lift, circle for the waiting point, flag for the assembly point.
            Staging rule: fire floor minus 2 (a fire here stages on Level {staging}).
          </p>
        </section>
        <aside className="stack" style={{ gap: 16 }}>
          <section className="card stack" aria-labelledby="mk-h">
            <h2 id="mk-h">Markers</h2>
            {FIELDS.map((f) => (
              <div key={f.key} className="mk">
                <span className="k" aria-hidden="true" style={f.shape}>
                  {f.k}
                </span>
                <div className="field" style={{ gap: 4 }}>
                  <label className="lbl" htmlFor={`m-${f.key}`}>
                    {f.label}
                  </label>
                  <input id={`m-${f.key}`} type="text" value={draft[f.key]} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
                </div>
              </div>
            ))}
            <button type="button" className="btn b-pri" disabled={saved} onClick={() => dispatch({ type: 'set-markers', markers: draft })}>
              {saved ? 'Marker names saved' : 'Save marker names'}
            </button>
          </section>
          <div className="callout" role="note">
            <Icon name="info" size={22} />
            <div>
              <b>Evacuation chairs: none installed (recommended)</b>
              <p className="sub" style={{ paddingTop: 2 }}>
                No chairs on any floor of this tower. People who can&apos;t use stairs wait at the waiting point for Bomba, who bring their own carry devices.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
