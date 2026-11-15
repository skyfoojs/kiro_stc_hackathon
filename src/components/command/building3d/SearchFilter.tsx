import type { FilterKey } from '@/lib/command/building3d/types';

export interface SearchResult {
  id: string;
  title: string;
  sub: string;
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Everyone' },
  { key: 'waiting', label: 'Waiting for rescue' },
  { key: 'help', label: 'Needs help on stairs' },
  { key: 'unacc', label: 'Unaccounted' },
  { key: 'stale', label: 'Outdated location' },
  { key: 'teams', label: 'Response teams' },
  { key: 'incident', label: 'Incident floors' },
];

interface Props {
  filter: FilterKey;
  onFilter: (f: FilterKey) => void;
  query: string;
  onQuery: (q: string) => void;
  canSearchNames: boolean;
  results: SearchResult[];
  onPick: (id: string) => void;
}

export default function SearchFilter({ filter, onFilter, query, onQuery, canSearchNames, results, onPick }: Props) {
  return (
    <section className="b3d-card" aria-label="Search and filter">
      <div className="b3d-field">
        <label htmlFor="b3d-q" className="b3d-lbl">
          {canSearchNames ? 'Find a person or team' : 'Find a floor or team'}
        </label>
        <input
          id="b3d-q"
          type="search"
          value={query}
          placeholder={canSearchNames ? 'Name, company or L22' : 'L22 or team name'}
          onChange={(e) => onQuery(e.target.value)}
        />
      </div>
      {query.trim() !== '' && (
        <ul className="b3d-results" aria-label="Search results">
          {results.slice(0, 8).map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => onPick(r.id)}>
                <b>{r.title}</b>
                <span>{r.sub}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="b3d-empty">No match.</li>}
        </ul>
      )}
      <div className="b3d-chips" role="group" aria-label="Quick filters">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className="b3d-pill" aria-pressed={filter === f.key} onClick={() => onFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>
    </section>
  );
}
