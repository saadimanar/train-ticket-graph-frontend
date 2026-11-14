import { api } from '../api/client';
import type { FilterDef } from '../api/types';
import { useAsync } from './useAsync';

/** Fetches the filters the backend currently supports. */
export function useFilters() {
  return useAsync<FilterDef[]>(async (signal) => (await api.getFilters(signal)).filters, 'filters');
}
