import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';
import { ShieldAlert } from 'lucide-react';
import { type CSSProperties, memo, useContext } from 'react';
import type { GraphNode } from '../api/types';
import { nodeLook, severityColor, topSeverity } from '../lib/nodeStyle';
import { emphasisOf, GraphContext } from './graphContext';

export type ServiceFlowNode = Node<{ node: GraphNode }, 'service'>;

const HANDLE_CLASS = '!pointer-events-none !h-px !w-px !min-w-0 !border-0 !bg-transparent !opacity-0';

function ServiceNode({ id, data }: NodeProps<ServiceFlowNode>) {
  const { highlight, selectedId } = useContext(GraphContext);
  const { node } = data;

  const look = nodeLook(node);
  const severity = topSeverity(node);
  const severityHue = severity ? severityColor(severity) : null;
  const emphasis = emphasisOf(highlight?.nodes, id);
  const selected = selectedId === id;
  const glow = severityHue ?? look.accent;

  let boxShadow = '0 1px 2px rgba(0, 0, 0, 0.45)';
  if (emphasis === 'highlight') boxShadow = `0 0 0 1px ${glow}66, 0 0 24px -4px ${glow}`;
  if (selected) boxShadow = `0 0 0 2px #E2E8F0, 0 0 24px -4px ${glow}`;

  const style: CSSProperties = {
    borderColor: severityHue ?? (emphasis === 'highlight' ? look.accent : look.border),
    borderStyle: look.variant === 'unknown' ? 'dashed' : 'solid',
    boxShadow,
    opacity: emphasis === 'dim' && !selected ? 0.2 : 1,
  };

  const pill = look.variant === 'database';

  return (
    <div
      className={`relative flex h-full w-full items-center gap-2 border bg-raised pr-2.5 transition-[opacity,box-shadow,border-color] duration-300 hover:brightness-125 ${
        pill ? 'rounded-full pl-2.5' : 'rounded-lg pl-2'
      }`}
      style={style}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} className={HANDLE_CLASS} />

      {node.publicExposed && (
        <span className="absolute top-2 bottom-2 -left-px w-[3px] rounded-full bg-accent" />
      )}

      <span
        className={`flex size-6 shrink-0 items-center justify-center ${pill ? 'rounded-full' : 'rounded-md'}`}
        style={{ color: look.accent, backgroundColor: `${look.accent}1F` }}
      >
        <look.Icon size={14} strokeWidth={2} />
      </span>

      <span
        className={`min-w-0 flex-1 truncate font-mono text-[12px] leading-none ${
          look.variant === 'unknown' ? 'text-slate-400 italic' : 'text-slate-200'
        }`}
      >
        {node.id}
      </span>

      {node.publicExposed && (
        <span className="shrink-0 rounded bg-accent/10 px-1.5 py-1 text-[9px] leading-none font-semibold tracking-wider text-accent">
          PUBLIC
        </span>
      )}

      {severityHue && (
        <span
          className="flex shrink-0 items-center gap-1 rounded px-1.5 py-1 text-[10px] leading-none font-semibold"
          style={{ color: severityHue, backgroundColor: `${severityHue}1F` }}
        >
          <ShieldAlert size={11} strokeWidth={2.25} />
          {node.vulnerabilities.length}
        </span>
      )}

      <Handle type="source" position={Position.Right} isConnectable={false} className={HANDLE_CLASS} />
    </div>
  );
}

export default memo(ServiceNode);
