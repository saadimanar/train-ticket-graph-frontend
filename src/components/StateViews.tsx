import { LoaderCircle, RefreshCw, ServerCrash, TriangleAlert } from 'lucide-react';
import { API_URL, type ApiError } from '../api/client';

export function Spinner({ size = 16, className = '' }: { size?: number; className?: string }) {
  return <LoaderCircle size={size} className={`animate-spin ${className}`} aria-hidden />;
}

function RetryButton({ onRetry, compact = false }: { onRetry: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onRetry}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-raised font-medium text-slate-200 transition-colors hover:border-slate-500 hover:bg-line ${
        compact ? 'px-2.5 py-1.5 text-[12px]' : 'px-3.5 py-2 text-[13px]'
      }`}
    >
      <RefreshCw size={compact ? 12 : 14} />
      Retry
    </button>
  );
}

/** Full-canvas placeholder while the graph is fetched and laid out. */
export function GraphLoading() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-400" role="status">
      <Spinner size={28} className="text-accent" />
      <div className="text-center">
        <p className="text-[14px] font-medium text-slate-200">Loading service graph</p>
        <p className="mt-1 text-[12px] text-slate-500">Fetching nodes and computing the layout…</p>
      </div>
    </div>
  );
}

/** Full-canvas error: distinguishes "backend unreachable" from an API error. */
export function GraphError({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  const unreachable = error.kind === 'network';
  return (
    <div className="flex h-full items-center justify-center p-6" role="alert">
      <div className="w-full max-w-md animate-enter rounded-2xl border border-rose-500/25 bg-panel p-7 text-center shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
          <ServerCrash size={22} />
        </span>
        <h2 className="mt-4 text-[16px] font-semibold text-slate-100">
          {unreachable ? 'Can’t reach the graph API' : 'The graph API returned an error'}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
          {unreachable
            ? 'The backend did not respond. Make sure it is running and that this origin is listed in its ALLOWED_ORIGINS.'
            : error.message}
        </p>
        <div className="mt-4 rounded-lg border border-line bg-canvas px-3 py-2 font-mono text-[12px] break-all text-slate-300">
          {unreachable ? API_URL : `${error.code}${error.status ? ` · HTTP ${error.status}` : ''}`}
        </div>
        <div className="mt-5">
          <RetryButton onRetry={onRetry} />
        </div>
      </div>
    </div>
  );
}

/** Small error block for use inside side panels. */
export function InlineError({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-3.5" role="alert">
      <div className="flex items-start gap-2.5">
        <TriangleAlert size={15} className="mt-0.5 shrink-0 text-rose-400" />
        <div className="min-w-0">
          <p className="text-[12.5px] leading-snug text-slate-200">{error.message}</p>
          <p className="mt-1 font-mono text-[11px] text-slate-500">{error.code}</p>
        </div>
      </div>
      <div className="mt-3">
        <RetryButton onRetry={onRetry} compact />
      </div>
    </div>
  );
}
