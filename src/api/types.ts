export interface Vulnerability {
  file: string;
  severity: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface GraphNode {
  id: string;
  /** "service" | "rds" | "sqs" | "unknown" | … — new kinds may appear. */
  kind: string;
  publicExposed: boolean;
  vulnerabilities: Vulnerability[];
  /** True when the node is only referenced by others and has no definition. */
  missing?: boolean;
  language?: string;
  path?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  /** Formatted as "from->to". */
  id: string;
  from: string;
  to: string;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface FilterDef {
  name: string;
  description: string;
}

export interface FiltersResponse {
  filters: FilterDef[];
}

export type Match = 'all' | 'any';

export interface Route {
  id: string;
  nodes: string[];
  edges: string[];
}

export interface RoutesResponse extends Graph {
  routes: Route[];
  meta: {
    filters: string[];
    match: Match;
    routeCount: number;
    truncated: boolean;
  };
}
