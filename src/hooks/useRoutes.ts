import { api } from '../api/client';
import type { Match, RoutesResponse } from '../api/types';
import { useAsync } from './useAsync';

/** Queries matching routes; idle while no filter is selected. */
export function useRoutes(filters: string[], match: Match) {
  const active = filters.length > 0;
  return useAsync<RoutesResponse>(
    active ? (signal) => api.getRoutes({ filters, match }, signal) : null,
    active ? `${match}:${filters.join(',')}` : 'idle',
  );
}
