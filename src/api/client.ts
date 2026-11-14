import type { FiltersResponse, Graph, Match, RoutesResponse } from './types';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(
  /\/+$/,
  '',
);

/** `network` = the backend could not be reached; `api` = it answered with an error. */
export type ApiErrorKind = 'network' | 'api';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly code: string;
  readonly status: number | null;

  constructor(kind: ApiErrorKind, code: string, message: string, status: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.code = code;
    this.status = status;
  }
}

export function toApiError(cause: unknown): ApiError {
  if (cause instanceof ApiError) return cause;
  return new ApiError('network', 'NETWORK_ERROR', `Could not reach the API at ${API_URL}.`);
}

function readErrorBody(body: unknown): { code: string; message: string } | null {
  if (typeof body !== 'object' || body === null) return null;
  const error = (body as { error?: unknown }).error;
  if (typeof error !== 'object' || error === null) return null;
  const { code, message } = error as { code?: unknown; message?: unknown };
  if (typeof message !== 'string') return null;
  return { code: typeof code === 'string' ? code : 'API_ERROR', message };
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      signal,
      headers: { Accept: 'application/json' },
    });
  } catch (cause) {
    // Let aborts propagate untouched so callers can ignore them.
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw toApiError(cause);
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON body: handled below.
  }

  if (!response.ok) {
    const parsed = readErrorBody(body);
    throw new ApiError(
      'api',
      parsed?.code ?? `HTTP_${response.status}`,
      parsed?.message ?? `The API responded with status ${response.status}.`,
      response.status,
    );
  }
  if (body === null) {
    throw new ApiError('api', 'INVALID_RESPONSE', 'The API returned a non-JSON response.', response.status);
  }
  return body as T;
}

export const api = {
  getGraph: (signal?: AbortSignal) => request<Graph>('/graph', signal),

  getFilters: (signal?: AbortSignal) => request<FiltersResponse>('/filters', signal),

  getRoutes: (
    params: { filters: string[]; match: Match; limit?: number },
    signal?: AbortSignal,
  ) => {
    const query = new URLSearchParams({ filters: params.filters.join(','), match: params.match });
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    return request<RoutesResponse>(`/routes?${query.toString()}`, signal);
  },
};
