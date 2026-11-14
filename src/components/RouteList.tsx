import { ArrowRight, Pin, Route as RouteIcon, SearchX } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import type { ApiError } from '../api/client';
import type { Match, Route, RoutesResponse } from '../api/types';
import { InlineError, Spinner } from './StateViews';

interface RouteListProps {
  status: 'idle' | 'loading' | 'error' | 'ready';
  data: RoutesResponse | null;
  error: ApiError | null;
  onRetry: () => void;
  selectedFilters: string[];
  match: Match;
  pinnedId: string | null;
  onHover: (id: string | null) => void;
  onPin: (id: string | null) => void;
}

function Placeholder({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-xl border border-line bg-raised text-slate-500">
        {icon}
      </span>
      <p className="mt-3 text-[13px] font-medium text-slate-200">{title}</p>
      <p className="mt-1 max-w-[230px] text-[12px] leading-relaxed text-slate-500">{children}</p>
    </div>
  );
}

function RouteRow({
  route,
  index,
  pinned,
  onHover,
  onPin,
}: {
  route: Route;
  index: number;
  pinned: boolean;
  onHover: (id: string | null) => void;
  onPin: (id: string | null) => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={pinned}
        onMouseEnter={() => onHover(route.id)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(route.id)}
        onBlur={() => onHover(null)}
        onClick={() => onPin(pinned ? null : route.id)}
        className={`group flex w-full items-start gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors duration-150 ${
          pinned
            ? 'border-accent/40 bg-accent/[0.07]'
            : 'border-transparent hover:border-line-strong hover:bg-raised'
        }`}
      >
        <span className="mt-px w-5 shrink-0 text-right font-mono text-[10.5px] text-slate-600 tabular-nums">
          {index + 1}
        </span>
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-1 font-mono text-[11.5px] leading-tight">
          {route.nodes.map((nodeId, position) => (
            <Fragment key={`${nodeId}-${position}`}>
              {position > 0 && <ArrowRight size={11} className="shrink-0 text-slate-600" />}
              <span
                className={
                  position === 0 || position === route.nodes.length - 1 ? 'text-slate-100' : 'text-slate-400'
                }
              >
                {nodeId}
              </span>
            </Fragment>
          ))}
        </span>
        <Pin
          size={12}
          className={`mt-0.5 shrink-0 transition-opacity ${
            pinned ? 'text-accent opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-60'
          }`}
        />
      </button>
    </li>
  );
}

export default function RouteList({
  status,
  data,
  error,
  onRetry,
  selectedFilters,
  match,
  pinnedId,
  onHover,
  onPin,
}: RouteListProps) {
  const routes = data?.routes ?? [];
  const count = data?.meta.routeCount ?? routes.length;

  let body: ReactNode;
  if (status === 'idle') {
    body = (
      <Placeholder icon={<RouteIcon size={18} />} title="No filters applied">
        Turn on a filter above to find matching routes and highlight them on the graph.
      </Placeholder>
    );
  } else if (status === 'error' && error) {
    body = (
      <div className="px-1 pt-1">
        <InlineError error={error} onRetry={onRetry} />
      </div>
    );
  } else if (!data) {
    body = (
      <div className="space-y-1.5 px-1 pt-1" role="status" aria-label="Loading routes">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="h-9 animate-pulse rounded-lg bg-raised/60" />
        ))}
      </div>
    );
  } else if (routes.length === 0) {
    body = (
      <Placeholder icon={<SearchX size={18} />} title="No routes match">
        No route satisfies {match === 'all' && selectedFilters.length > 1 ? 'all of' : ''}{' '}
        <span className="font-mono text-slate-400">{selectedFilters.join(match === 'all' ? ' + ' : ' / ')}</span>.
        {match === 'all' && selectedFilters.length > 1
          ? ' Try switching Match to Any, or remove a filter.'
          : ' Try a different filter.'}
      </Placeholder>
    );
  } else {
    body = (
      <ul className="space-y-0.5" onMouseLeave={() => onHover(null)}>
        {routes.map((route, index) => (
          <RouteRow
            key={route.id}
            route={route}
            index={index}
            pinned={route.id === pinnedId}
            onHover={onHover}
            onPin={onPin}
          />
        ))}
      </ul>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-5 pt-5 pb-3">
        <div className="flex h-5 items-center gap-2">
          <h2 className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Routes</h2>
          {data && status !== 'idle' && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] leading-none font-semibold tabular-nums ${
                count > 0 ? 'bg-accent/10 text-accent' : 'bg-raised text-slate-400'
              }`}
            >
              {count}
            </span>
          )}
          {status === 'loading' && <Spinner size={13} className="text-slate-500" />}
        </div>
        {routes.length > 0 && (
          <p className="mt-1.5 text-[11.5px] text-slate-500">
            Hover to preview a route · click to pin it
            {data?.meta.truncated ? ` · showing first ${routes.length}` : ''}
          </p>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">{body}</div>
    </section>
  );
}
