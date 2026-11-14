import type { Graph, GraphNode } from '../api/types';

export const NODE_HEIGHT = 44;

export interface NodeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type GraphLayout = Map<string, NodeBox>;

/** Width that fits the monospace label plus icon and badges without wrapping. */
export function nodeWidth(node: GraphNode): number {
  const label = node.id.length * 7.3;
  const badges = (node.publicExposed ? 52 : 0) + (node.vulnerabilities.length > 0 ? 40 : 0);
  return Math.max(140, Math.ceil(label + 62 + badges));
}

/** Left-to-right layered layout. elkjs is loaded on demand to keep the first paint light. */
export async function layoutGraph(graph: Graph): Promise<GraphLayout> {
  const { default: ELK } = await import('elkjs/lib/elk.bundled.js');
  const elk = new ELK();

  const known = new Set(graph.nodes.map((node) => node.id));
  const result = await elk.layout({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '22',
      'elk.layered.spacing.nodeNodeBetweenLayers': '100',
      'elk.layered.spacing.edgeNodeBetweenLayers': '24',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.separateConnectedComponents': 'true',
    },
    children: graph.nodes.map((node) => ({
      id: node.id,
      width: nodeWidth(node),
      height: NODE_HEIGHT,
    })),
    edges: graph.edges
      .filter((edge) => known.has(edge.from) && known.has(edge.to))
      .map((edge) => ({ id: edge.id, sources: [edge.from], targets: [edge.to] })),
  });

  const layout: GraphLayout = new Map();
  for (const child of result.children ?? []) {
    layout.set(child.id, {
      x: child.x ?? 0,
      y: child.y ?? 0,
      width: child.width ?? 160,
      height: child.height ?? NODE_HEIGHT,
    });
  }
  return layout;
}
