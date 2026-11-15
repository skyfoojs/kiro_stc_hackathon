const ITEMS: { cls: string; shape: string; label: string; meaning: string }[] = [
  { cls: 'k-active', shape: 'dot', label: 'Inside, updating', meaning: 'Location recently updated, not checked in yet' },
  { cls: 'k-assist', shape: 'diamond', label: 'May need help on stairs', meaning: 'Self-declared assistance profile' },
  { cls: 'k-urgent', shape: 'ring', label: 'Waiting, not acknowledged', meaning: 'Help request no rescue team has acknowledged' },
  { cls: 'k-waiting', shape: 'ring', label: 'Waiting for rescue', meaning: 'Acknowledged by a rescue team' },
  { cls: 'k-unacc', shape: 'hollow', label: 'Unaccounted for', meaning: 'No safe check-in and no recent location' },
  { cls: 'k-safe', shape: 'dot', label: 'Safe, checked in', meaning: 'Manual check-in at the assembly point' },
  { cls: 'k-team', shape: 'hex', label: 'Response team', meaning: 'Approximate, from reported status' },
];

export default function Legend() {
  return (
    <details className="b3d-sec b3d-legend">
      <summary className="b3d-h">Legend</summary>
      <ul>
        {ITEMS.map((i) => (
          <li key={i.label}>
            <span className={`sw ${i.cls} sh-${i.shape}`} aria-hidden="true" />
            <span>
              <b>{i.label}</b>
              <span>{i.meaning}</span>
            </span>
          </li>
        ))}
        <li>
          <span className="sw fl-clear" aria-hidden="true" />
          <span>
            <b>Green floor: all accounted for</b>
            <span>Everyone on record checked in safe. Not a hazard clearance.</span>
          </span>
        </li>
        <li>
          <span className="sw fl-hazard" aria-hidden="true" />
          <span>
            <b>Red volume: incident floor</b>
            <span>Only what the incident report states.</span>
          </span>
        </li>
      </ul>
    </details>
  );
}
