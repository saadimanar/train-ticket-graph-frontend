import { ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { LOOKS, type NodeVariant, severityColor } from '../lib/nodeStyle';

const VARIANTS: NodeVariant[] = ['service', 'public', 'database', 'queue', 'unknown'];
const SEVERITIES = ['critical', 'high', 'medium', 'low'];

function Swatch({ variant }: { variant: NodeVariant }) {
  const look = LOOKS[variant];
  return (
    <span
      className={`relative flex h-5 w-8 shrink-0 items-center justify-center border bg-raised ${
        variant === 'database' ? 'rounded-full' : 'rounded-md'
      }`}
      style={{
        borderColor: variant === 'service' ? look.border : look.accent,
        borderStyle: variant === 'unknown' ? 'dashed' : 'solid',
        color: look.accent,
      }}
    >
      {variant === 'public' && (
        <span className="absolute top-1 bottom-1 -left-px w-[3px] rounded-full bg-accent" />
      )}
      <look.Icon size={12} />
    </span>
  );
}

function Item({ children }: { children: ReactNode }) {
  return <li className="flex items-center gap-2 whitespace-nowrap">{children}</li>;
}

/** Footer strip under the canvas, so it never covers part of the graph. */
export default function Legend() {
  return (
    <footer
      aria-label="Legend"
      className="flex shrink-0 items-center gap-5 border-t border-line bg-panel px-5 py-2.5"
    >
      <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Legend</span>
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-slate-300">
        {VARIANTS.map((variant) => (
          <Item key={variant}>
            <Swatch variant={variant} />
            {LOOKS[variant].label}
          </Item>
        ))}

        <Item>
          <span
            className="flex h-5 w-8 shrink-0 items-center justify-center rounded-md border bg-raised"
            style={{ borderColor: severityColor('high'), color: severityColor('high') }}
          >
            <ShieldAlert size={12} />
          </span>
          Vulnerable
          <span className="flex items-center gap-2.5 text-[11px] text-slate-500">
            {SEVERITIES.map((severity) => (
              <span key={severity} className="flex items-center gap-1 capitalize">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: severityColor(severity) }} />
                {severity}
              </span>
            ))}
          </span>
        </Item>

        <Item>
          <svg width="32" height="8" className="shrink-0" aria-hidden>
            <line
              x1="0"
              y1="4"
              x2="32"
              y2="4"
              stroke="#22D3EE"
              strokeWidth="2"
              strokeDasharray="8 4"
              style={{ animation: 'edge-flow 0.7s linear infinite' }}
            />
          </svg>
          Matching route
        </Item>
      </ul>
    </footer>
  );
}
