import { createContext } from 'react';

/** Node and edge ids that should stand out; everything else is dimmed. */
export interface Highlight {
  nodes: ReadonlySet<string>;
  edges: ReadonlySet<string>;
}

export type Emphasis = 'normal' | 'highlight' | 'dim';

export function emphasisOf(set: ReadonlySet<string> | undefined, id: string): Emphasis {
  if (!set) return 'normal';
  return set.has(id) ? 'highlight' : 'dim';
}

interface GraphContextValue {
  highlight: Highlight | null;
  selectedId: string | null;
}

/**
 * Highlight state reaches nodes through context so the React Flow node objects
 * stay stable: filtering never re-lays-out or resets dragged positions.
 */
export const GraphContext = createContext<GraphContextValue>({ highlight: null, selectedId: null });
