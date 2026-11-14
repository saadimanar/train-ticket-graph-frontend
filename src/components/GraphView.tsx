import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import { type ReactNode, useEffect, useMemo, useRef } from 'react';
import type { Graph } from '../api/types';
import { type GraphLayout, NODE_HEIGHT, nodeWidth } from '../lib/layout';
import { nodeLook, severityColor, topSeverity } from '../lib/nodeStyle';
import { emphasisOf, GraphContext, type Highlight } from './graphContext';
import ServiceNode, { type ServiceFlowNode } from './ServiceNode';

const nodeTypes = { service: ServiceNode };

const EDGE_COLOR = '#3B4658';
const EDGE_HIGHLIGHT_COLOR = '#22D3EE';

interface GraphViewProps {
  graph: Graph;
  layout: GraphLayout;
  highlight: Highlight | null;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  /** When set, the viewport animates to frame these nodes (a pinned route). */
  focusNodeIds: string[] | null;
  /** Optional message floated over the top of the canvas. */
  notice?: ReactNode;
}

/** Animates the viewport to a pinned route. Must render inside <ReactFlow>. */
function FocusOnNodes({ ids }: { ids: string[] | null }) {
  const { fitView } = useReactFlow();
  const key = ids?.join('|') ?? '';

  const wasFocused = useRef(false);

  useEffect(() => {
    if (key) {
      wasFocused.current = true;
      void fitView({
        nodes: key.split('|').map((id) => ({ id })),
        padding: 0.35,
        maxZoom: 1.1,
        duration: 500,
      });
    } else if (wasFocused.current) {
      // The route was unpinned: zoom back out to the whole graph.
      wasFocused.current = false;
      void fitView({ padding: 0.08, duration: 500 });
    }
  }, [key, fitView]);

  return null;
}

export default function GraphView({
  graph,
  layout,
  highlight,
  selectedNodeId,
  onSelectNode,
  focusNodeIds,
  notice,
}: GraphViewProps) {
  const initialNodes = useMemo<ServiceFlowNode[]>(
    () =>
      graph.nodes.map((node) => {
        const box = layout.get(node.id);
        return {
          id: node.id,
          type: 'service',
          position: { x: box?.x ?? 0, y: box?.y ?? 0 },
          width: box?.width ?? nodeWidth(node),
          height: NODE_HEIGHT,
          data: { node },
          connectable: false,
          deletable: false,
        };
      }),
    [graph, layout],
  );
  const [nodes, , onNodesChange] = useNodesState(initialNodes);

  const edges = useMemo<Edge[]>(() => {
    const known = new Set(graph.nodes.map((node) => node.id));
    return graph.edges
      .filter((edge) => known.has(edge.from) && known.has(edge.to))
      .map((edge) => {
        const emphasis = emphasisOf(highlight?.edges, edge.id);
        const highlighted = emphasis === 'highlight';
        return {
          id: edge.id,
          source: edge.from,
          target: edge.to,
          className: `edge-${emphasis}`,
          zIndex: highlighted ? 1 : 0,
          selectable: false,
          focusable: false,
          deletable: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: highlighted ? EDGE_HIGHLIGHT_COLOR : EDGE_COLOR,
          },
        };
      });
  }, [graph, highlight]);

  const context = useMemo(
    () => ({ highlight, selectedId: selectedNodeId }),
    [highlight, selectedNodeId],
  );

  const minimapColor = (flowNode: ServiceFlowNode): string => {
    if (highlight && !highlight.nodes.has(flowNode.id)) return '#1B212C';
    const { node } = flowNode.data;
    const severity = topSeverity(node);
    if (severity) return severityColor(severity);
    const look = nodeLook(node);
    return look.variant === 'service' ? '#475569' : look.accent;
  };

  return (
    <GraphContext.Provider value={context}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
        colorMode="dark"
        fitView
        fitViewOptions={{ padding: 0.08 }}
        minZoom={0.1}
        maxZoom={2}
        nodesConnectable={false}
        edgesFocusable={false}
        edgesReconnectable={false}
        deleteKeyCode={null}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#1C2330" />
        <Controls position="top-left" showInteractive={false} fitViewOptions={{ padding: 0.08, duration: 400 }} />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor={(node) => minimapColor(node as ServiceFlowNode)}
          nodeStrokeWidth={0}
          nodeBorderRadius={6}
        />
        {notice && <Panel position="top-center">{notice}</Panel>}
        <FocusOnNodes ids={focusNodeIds} />
      </ReactFlow>
    </GraphContext.Provider>
  );
}
