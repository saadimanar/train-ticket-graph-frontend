import { ReactFlowProvider } from '@xyflow/react';
import { SearchX, Waypoints } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { API_URL } from './api/client';
import type { Graph, Match } from './api/types';
import FilterPanel from './components/FilterPanel';
import GraphView from './components/GraphView';
import Legend from './components/Legend';
import type { Highlight } from './components/graphContext';
import NodeDetails from './components/NodeDetails';
import RouteList from './components/RouteList';
import { GraphError, GraphLoading } from './components/StateViews';
import { useFilters } from './hooks/useFilters';
import { useGraph } from './hooks/useGraph';
import { useRoutes } from './hooks/useRoutes';

function Stat({ value, label, tone = 'text-slate-200' }: { value: number; label: string; tone?: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className={`text-[13px] font-semibold tabular-nums ${tone}`}>{value}</span>
      <span className="text-[12px] text-slate-500">{label}</span>
    </span>
  );
}

function Header({ graph, online }: { graph: Graph | null; online: boolean | null }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-6 border-b border-line bg-panel px-5">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Waypoints size={17} />
        </span>
        <div className="leading-tight">
          <h1 className="text-[14px] font-semibold text-slate-50">Service Graph</h1>
          <p className="text-[11px] text-slate-500">Route explorer</p>
        </div>
      </div>

      {graph && (
        <div className="hidden items-center gap-5 border-l border-line pl-6 md:flex">
          <Stat value={graph.nodes.length} label="nodes" />
          <Stat value={graph.edges.length} label="calls" />
          <Stat value={graph.nodes.filter((node) => node.publicExposed).length} label="public" tone="text-accent" />
          <Stat
            value={graph.nodes.filter((node) => node.vulnerabilities.length > 0).length}
            label="vulnerable"
            tone="text-rose-400"
          />
        </div>
      )}

      <div className="ml-auto flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1.5">
        <span
          className={`size-1.5 rounded-full ${
            online === null ? 'animate-pulse bg-slate-500' : online ? 'bg-emerald-400' : 'bg-rose-500'
          }`}
        />
        <span className="font-mono text-[11px] text-slate-400">{API_URL.replace(/^https?:\/\//, '')}</span>
      </div>
    </header>
  );
}

export default function App() {
  const graph = useGraph();
  const filters = useFilters();

  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [match, setMatch] = useState<Match>('all');
  const routes = useRoutes(selectedFilters, match);

  const [pinnedRouteId, setPinnedRouteId] = useState<string | null>(null);
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const resetRouteFocus = () => {
    setPinnedRouteId(null);
    setHoveredRouteId(null);
  };

  const toggleFilter = (name: string) => {
    resetRouteFocus();
    setSelectedFilters((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  };

  const changeMatch = (next: Match) => {
    resetRouteFocus();
    setMatch(next);
  };

  const clearFilters = () => {
    resetRouteFocus();
    setSelectedFilters([]);
  };

  const retryAll = useCallback(() => {
    graph.retry();
    if (filters.status === 'error') filters.retry();
  }, [graph, filters]);

  // Route results only count while filters are applied (stale data is ignored once cleared).
  const routeData = selectedFilters.length > 0 ? routes.data : null;
  const pinnedRoute = routeData?.routes.find((route) => route.id === pinnedRouteId) ?? null;
  const previewRoute = routeData?.routes.find((route) => route.id === hoveredRouteId) ?? pinnedRoute;

  const highlight = useMemo<Highlight | null>(() => {
    if (!routeData) return null;
    if (previewRoute) {
      return { nodes: new Set(previewRoute.nodes), edges: new Set(previewRoute.edges) };
    }
    return {
      nodes: new Set(routeData.nodes.map((node) => node.id)),
      edges: new Set(routeData.edges.map((edge) => edge.id)),
    };
  }, [routeData, previewRoute]);

  const loaded = graph.data;
  const selectedNode = loaded?.graph.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const noMatches = routes.status === 'ready' && routeData !== null && routeData.routes.length === 0;
  const online = graph.status === 'loading' ? null : graph.status === 'ready';

  return (
    <div className="flex h-full flex-col bg-canvas">
      <Header graph={loaded?.graph ?? null} online={online} />

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[330px] shrink-0 flex-col border-r border-line bg-panel">
          <FilterPanel
            status={filters.status}
            filters={filters.data}
            error={filters.error}
            onRetry={filters.retry}
            selected={selectedFilters}
            onToggle={toggleFilter}
            onClear={clearFilters}
            match={match}
            onMatchChange={changeMatch}
          />
          <RouteList
            status={routes.status}
            data={routeData}
            error={routes.error}
            onRetry={routes.retry}
            selectedFilters={selectedFilters}
            match={match}
            pinnedId={pinnedRoute?.id ?? null}
            onHover={setHoveredRouteId}
            onPin={setPinnedRouteId}
          />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1">
          {graph.status === 'error' && graph.error ? (
            <GraphError error={graph.error} onRetry={retryAll} />
          ) : !loaded ? (
            <GraphLoading />
          ) : loaded.graph.nodes.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[13px] text-slate-500">
              The graph is empty — the API returned no nodes.
            </div>
          ) : (
            <ReactFlowProvider>
              <GraphView
                graph={loaded.graph}
                layout={loaded.layout}
                highlight={highlight}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                focusNodeIds={pinnedRoute?.nodes ?? null}
                notice={
                  noMatches ? (
                    <div className="flex animate-enter items-center gap-2 rounded-full border border-line-strong bg-panel/95 px-4 py-2 text-[12.5px] text-slate-300 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] backdrop-blur">
                      <SearchX size={14} className="text-slate-500" />
                      No routes match these filters
                    </div>
                  ) : null
                }
              />
            </ReactFlowProvider>
          )}
          </div>
          {loaded && <Legend />}
        </main>

        {selectedNode && loaded && (
          <NodeDetails
            node={selectedNode}
            graph={loaded.graph}
            onClose={() => setSelectedNodeId(null)}
            onSelectNode={setSelectedNodeId}
          />
        )}
      </div>
    </div>
  );
}
