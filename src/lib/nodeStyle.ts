import { Box, CircleHelp, Database, Globe, Layers, type LucideIcon } from 'lucide-react';
import type { GraphNode } from '../api/types';

export type NodeVariant = 'public' | 'database' | 'queue' | 'unknown' | 'service';

export interface NodeLook {
  variant: NodeVariant;
  label: string;
  Icon: LucideIcon;
  /** Accent used for the icon, glow and minimap. */
  accent: string;
  border: string;
}

/**
 * The only place node kinds are interpreted. Kinds not listed here render as a
 * regular service, so new backend kinds never break the graph.
 */
const DATABASE_KINDS = new Set(['rds', 'sql', 'mysql', 'postgres', 'postgresql', 'database', 'db', 'dynamodb']);
const QUEUE_KINDS = new Set(['sqs', 'sns', 'queue', 'kafka', 'rabbitmq']);

export const LOOKS: Record<NodeVariant, Omit<NodeLook, 'variant'>> = {
  public: { label: 'Public entry point', Icon: Globe, accent: '#22D3EE', border: '#0E7490' },
  database: { label: 'Database (sink)', Icon: Database, accent: '#A78BFA', border: '#6D28D9' },
  queue: { label: 'Queue', Icon: Layers, accent: '#60A5FA', border: '#1D4ED8' },
  unknown: { label: 'Missing / unknown', Icon: CircleHelp, accent: '#64748B', border: '#475569' },
  service: { label: 'Service', Icon: Box, accent: '#94A3B8', border: '#2B3445' },
};

export function nodeVariant(node: GraphNode): NodeVariant {
  const kind = node.kind.toLowerCase();
  if (node.missing || kind === 'unknown') return 'unknown';
  if (DATABASE_KINDS.has(kind)) return 'database';
  if (QUEUE_KINDS.has(kind)) return 'queue';
  if (node.publicExposed) return 'public';
  return 'service';
}

export function nodeLook(node: GraphNode): NodeLook {
  const variant = nodeVariant(node);
  return { variant, ...LOOKS[variant] };
}

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#F43F5E',
  high: '#FB7185',
  medium: '#F59E0B',
  low: '#FACC15',
  info: '#38BDF8',
};

export function severityColor(severity: string): string {
  return SEVERITY_COLORS[severity.toLowerCase()] ?? '#94A3B8';
}

function severityRank(severity: string): number {
  const rank = SEVERITY_ORDER.indexOf(severity.toLowerCase());
  return rank === -1 ? SEVERITY_ORDER.length : rank;
}

/** Highest severity among a node's vulnerabilities, or null when it has none. */
export function topSeverity(node: GraphNode): string | null {
  let top: string | null = null;
  for (const { severity } of node.vulnerabilities) {
    if (top === null || severityRank(severity) < severityRank(top)) top = severity;
  }
  return top;
}

export function bySeverity<T extends { severity: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
}
