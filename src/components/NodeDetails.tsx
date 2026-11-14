import { CircleHelp, FileCode, Globe, Lock, ShieldCheck, X } from 'lucide-react';
import { type ReactNode, useMemo } from 'react';
import type { Graph, GraphNode, Vulnerability } from '../api/types';
import { bySeverity, nodeLook, severityColor } from '../lib/nodeStyle';

interface NodeDetailsProps {
  node: GraphNode;
  graph: Graph;
  onClose: () => void;
  onSelectNode: (id: string) => void;
}

function SectionTitle({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <h3 className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
      {children}
      {count !== undefined && (
        <span className="rounded-full bg-raised px-1.5 py-0.5 text-[10.5px] leading-none text-slate-400 tabular-nums">
          {count}
        </span>
      )}
    </h3>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="shrink-0 text-[12.5px] text-slate-500">{label}</dt>
      <dd className="min-w-0 text-right text-[12.5px] text-slate-200">{children}</dd>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const color = severityColor(severity);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10.5px] leading-none font-semibold tracking-wider uppercase"
      style={{ color, backgroundColor: `${color}1F` }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {severity}
    </span>
  );
}

function VulnerabilityCard({ vulnerability }: { vulnerability: Vulnerability }) {
  const cwe = vulnerability.metadata?.cwe;
  return (
    <li
      className="rounded-xl border border-line bg-raised/50 p-3.5"
      style={{ borderLeft: `2px solid ${severityColor(vulnerability.severity)}` }}
    >
      <SeverityBadge severity={vulnerability.severity} />
      <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate-200">{vulnerability.message}</p>
      {typeof cwe === 'string' && <p className="mt-2 text-[11.5px] leading-snug text-slate-500">{cwe}</p>}
      <p className="mt-2.5 flex items-start gap-1.5 font-mono text-[11px] leading-snug break-all text-slate-400">
        <FileCode size={12} className="mt-px shrink-0 text-slate-500" />
        {vulnerability.file}
      </p>
    </li>
  );
}

function NeighborList({ ids, onSelect }: { ids: string[]; onSelect: (id: string) => void }) {
  if (ids.length === 0) return <p className="text-[12px] text-slate-600">None</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          className="rounded-md border border-line bg-raised/60 px-2 py-1 font-mono text-[11px] text-slate-300 transition-colors hover:border-accent/50 hover:text-accent"
        >
          {id}
        </button>
      ))}
    </div>
  );
}

export default function NodeDetails({ node, graph, onClose, onSelectNode }: NodeDetailsProps) {
  const look = nodeLook(node);
  const vulnerabilities = bySeverity(node.vulnerabilities);

  const { callers, callees } = useMemo(() => {
    const incoming = graph.edges.filter((edge) => edge.to === node.id).map((edge) => edge.from);
    const outgoing = graph.edges.filter((edge) => edge.from === node.id).map((edge) => edge.to);
    return { callers: [...new Set(incoming)].sort(), callees: [...new Set(outgoing)].sort() };
  }, [graph, node.id]);

  const metadata = Object.entries(node.metadata ?? {}).filter(
    (entry): entry is [string, string | number | boolean] =>
      ['string', 'number', 'boolean'].includes(typeof entry[1]),
  );

  return (
    <aside
      aria-label={`Details for ${node.id}`}
      className="flex w-[360px] shrink-0 flex-col border-l border-line bg-panel"
    >
      {/* Keyed so the content re-animates when switching between nodes. */}
      <div key={node.id} className="flex min-h-0 flex-1 animate-enter flex-col">
        <header className="flex shrink-0 items-start gap-3 border-b border-line p-5">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border"
            style={{
              color: look.accent,
              backgroundColor: `${look.accent}14`,
              borderColor: `${look.accent}40`,
              borderStyle: look.variant === 'unknown' ? 'dashed' : 'solid',
            }}
          >
            <look.Icon size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-mono text-[14px] leading-snug font-medium break-all text-slate-50">{node.id}</h2>
            <p className="mt-0.5 text-[12px] text-slate-500">{look.label}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="-mt-1 -mr-1 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-raised hover:text-slate-200"
          >
            <X size={16} />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
          {node.missing && (
            <div className="flex gap-2.5 rounded-xl border border-dashed border-slate-600 bg-raised/40 p-3.5">
              <CircleHelp size={15} className="mt-0.5 shrink-0 text-slate-400" />
              <p className="text-[12.5px] leading-relaxed text-slate-400">
                <span className="font-medium text-slate-200">Placeholder node.</span> Other services call it,
                but it has no definition in the scanned data, so its kind and vulnerabilities are unknown.
              </p>
            </div>
          )}

          <section>
            <SectionTitle>Overview</SectionTitle>
            <dl className="divide-y divide-line rounded-xl border border-line px-3.5">
              <Field label="Kind">
                <span className="rounded-md bg-raised px-2 py-0.5 font-mono text-[11.5px]">{node.kind}</span>
              </Field>
              <Field label="Exposure">
                {node.publicExposed ? (
                  <span className="inline-flex items-center gap-1.5 text-accent">
                    <Globe size={13} /> Public
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-slate-300">
                    <Lock size={13} className="text-slate-500" /> Internal
                  </span>
                )}
              </Field>
              {node.language && <Field label="Language">{node.language}</Field>}
              {node.path && (
                <Field label="Path">
                  <span className="font-mono text-[11.5px] break-all">{node.path}</span>
                </Field>
              )}
              {metadata.map(([key, value]) => (
                <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
                  {String(value)}
                </Field>
              ))}
            </dl>
          </section>

          <section>
            <SectionTitle count={vulnerabilities.length}>Vulnerabilities</SectionTitle>
            {vulnerabilities.length === 0 ? (
              <p className="flex items-center gap-2 rounded-xl border border-line px-3.5 py-3 text-[12.5px] text-slate-400">
                <ShieldCheck size={15} className="text-emerald-400" />
                {node.missing ? 'None recorded for this placeholder.' : 'No known vulnerabilities.'}
              </p>
            ) : (
              <ul className="space-y-2.5">
                {vulnerabilities.map((vulnerability, index) => (
                  <VulnerabilityCard key={`${vulnerability.file}-${index}`} vulnerability={vulnerability} />
                ))}
              </ul>
            )}
          </section>

          <section>
            <SectionTitle count={callers.length}>Called by</SectionTitle>
            <NeighborList ids={callers} onSelect={onSelectNode} />
          </section>

          <section>
            <SectionTitle count={callees.length}>Calls</SectionTitle>
            <NeighborList ids={callees} onSelect={onSelectNode} />
          </section>
        </div>
      </div>
    </aside>
  );
}
