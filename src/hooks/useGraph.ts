import { api } from '../api/client';
import type { Graph } from '../api/types';
import { type GraphLayout, layoutGraph } from '../lib/layout';
import { useAsync } from './useAsync';

export interface LoadedGraph {
  graph: Graph;
  layout: GraphLayout;
}

/** Fetches the full graph once and computes its layout. */
export function useGraph() {
  return useAsync<LoadedGraph>(async (signal) => {
    const graph = await api.getGraph(signal);
    const layout = await layoutGraph(graph);
    return { graph, layout };
  }, 'graph');
}
