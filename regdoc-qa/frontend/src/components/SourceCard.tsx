// A single retrieved source, shown beneath an answer. Numbered to match the
// inline [n] markers; highlights + pulses when its marker is clicked.

import { CheckIcon } from './Icons';
import type { Source } from '../types';

interface SourceCardProps {
  source: Source;
  domId: string;
  active: boolean;
}

export function SourceCard({ source, domId, active }: SourceCardProps) {
  const relevancePct = Math.round(source.relevance * 100);

  return (
    <li
      id={domId}
      className={[
        'rounded-lg border bg-surface p-3 transition-colors duration-200',
        active ? 'border-verify animate-pulse-ring' : 'border-line',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <span
          className={[
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono',
            'text-xs font-semibold',
            source.cited
              ? 'bg-verify text-white'
              : 'border border-line bg-paper text-ink-faint',
          ].join(' ')}
        >
          {source.id}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-medium text-ink" title={source.filename}>
              {source.filename}
            </span>
            {source.page !== null && (
              <span className="font-mono text-[0.7rem] text-ink-faint">p.{source.page}</span>
            )}
            {source.cited && (
              <span className="inline-flex items-center gap-1 rounded bg-verify-soft px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wide text-verify-ink">
                <CheckIcon className="h-3 w-3" />
                cited
              </span>
            )}
          </div>

          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-ink-soft">
            {source.snippet}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-brand-bright"
                style={{ width: `${relevancePct}%` }}
              />
            </div>
            <span className="font-mono text-[0.65rem] tabular-nums text-ink-faint">
              {relevancePct}% match
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}
