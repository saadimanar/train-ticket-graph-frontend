import type { ApiError } from '../api/client';
import type { FilterDef, Match } from '../api/types';
import { InlineError } from './StateViews';

interface FilterPanelProps {
  status: 'idle' | 'loading' | 'error' | 'ready';
  filters: FilterDef[] | null;
  error: ApiError | null;
  onRetry: () => void;
  selected: string[];
  onToggle: (name: string) => void;
  onClear: () => void;
  match: Match;
  onMatchChange: (match: Match) => void;
}

const MATCH_OPTIONS: { value: Match; label: string; hint: string }[] = [
  { value: 'all', label: 'All', hint: 'Routes must satisfy every selected filter.' },
  { value: 'any', label: 'Any', hint: 'Routes may satisfy any one of the selected filters.' },
];

function humanize(name: string): string {
  const words = name.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function FilterToggle({
  filter,
  checked,
  onToggle,
}: {
  filter: FilterDef;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className={`flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors duration-200 ${
        checked
          ? 'border-accent/40 bg-accent/[0.06]'
          : 'border-line bg-raised/40 hover:border-line-strong hover:bg-raised'
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className={`block text-[13px] font-medium ${checked ? 'text-slate-50' : 'text-slate-200'}`}>
          {humanize(filter.name)}
        </span>
        <span className="mt-0.5 block text-[12px] leading-snug text-slate-500">{filter.description}</span>
      </span>
      <span
        aria-hidden
        className={`mt-0.5 flex h-[18px] w-8 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${
          checked ? 'bg-accent' : 'bg-line-strong'
        }`}
      >
        <span
          className={`size-3.5 rounded-full shadow transition-transform duration-200 ${
            checked ? 'translate-x-3.5 bg-canvas' : 'bg-slate-400'
          }`}
        />
      </span>
    </button>
  );
}

export default function FilterPanel({
  status,
  filters,
  error,
  onRetry,
  selected,
  onToggle,
  onClear,
  match,
  onMatchChange,
}: FilterPanelProps) {
  const activeHint = MATCH_OPTIONS.find((option) => option.value === match)?.hint;

  return (
    <section className="shrink-0 border-b border-line p-5">
      <div className="mb-3 flex h-5 items-center justify-between">
        <h2 className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Filters</h2>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="rounded text-[12px] text-slate-500 transition-colors hover:text-slate-200"
          >
            Clear
          </button>
        )}
      </div>

      {status === 'loading' && !filters && (
        <div className="space-y-2" role="status" aria-label="Loading filters">
          {[0, 1, 2].map((row) => (
            <div key={row} className="h-[62px] animate-pulse rounded-xl border border-line bg-raised/50" />
          ))}
        </div>
      )}

      {status === 'error' && error && <InlineError error={error} onRetry={onRetry} />}

      {filters && filters.length === 0 && (
        <p className="text-[12.5px] text-slate-500">The backend exposes no filters.</p>
      )}

      {filters && filters.length > 0 && (
        <>
          <div className="space-y-2">
            {filters.map((filter) => (
              <FilterToggle
                key={filter.name}
                filter={filter}
                checked={selected.includes(filter.name)}
                onToggle={() => onToggle(filter.name)}
              />
            ))}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] text-slate-400">Match</span>
              <div role="radiogroup" aria-label="Match mode" className="flex rounded-lg border border-line bg-canvas p-0.5">
                {MATCH_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={match === option.value}
                    onClick={() => onMatchChange(option.value)}
                    className={`rounded-md px-3.5 py-1 text-[12px] font-medium transition-colors duration-200 ${
                      match === option.value
                        ? 'bg-line-strong text-slate-50 shadow-sm'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-[11.5px] leading-snug text-slate-500">{activeHint}</p>
          </div>
        </>
      )}
    </section>
  );
}
