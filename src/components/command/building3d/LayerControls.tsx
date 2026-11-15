import type { LayerKey, Layers } from '@/lib/command/building3d/types';

const LAYERS: { key: LayerKey; label: string }[] = [
  { key: 'occupants', label: 'Occupants' },
  { key: 'assistance', label: 'Assistance requests' },
  { key: 'unaccounted', label: 'Unaccounted' },
  { key: 'teams', label: 'Response teams' },
  { key: 'trails', label: 'Movement trails' },
  { key: 'hazards', label: 'Hazard areas' },
  { key: 'floorStatus', label: 'Floor status' },
  { key: 'stairwells', label: 'Stairwells' },
  { key: 'lifts', label: 'Bomba lift' },
  { key: 'waiting', label: 'Waiting points' },
];

export default function LayerControls({ layers, onToggle }: { layers: Layers; onToggle: (k: LayerKey) => void }) {
  return (
    <details className="b3d-card b3d-layers">
      <summary className="b3d-h">Layers</summary>
      <div className="b3d-layer-grid">
        {LAYERS.map((l) => (
          <label key={l.key} className="b3d-check">
            <input type="checkbox" checked={layers[l.key]} onChange={() => onToggle(l.key)} />
            {l.label}
          </label>
        ))}
      </div>
    </details>
  );
}
