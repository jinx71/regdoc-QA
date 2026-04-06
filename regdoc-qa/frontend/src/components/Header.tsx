// Top bar: product wordmark + tagline, a model/key status badge, and (on mobile)
// a button to open the document library drawer.

import { CheckIcon, AlertIcon, LayersIcon } from './Icons';
import type { HealthData } from '../types';

interface HeaderProps {
  health: HealthData | null;
  onToggleLibrary: () => void;
}

export function Header({ health, onToggleLibrary }: HeaderProps) {
  const keyOk = health?.key_configured ?? false;

  return (
    <header className="z-20 flex items-center justify-between border-b border-line bg-surface px-4 py-3 shadow-card sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleLibrary}
          aria-label="Open document library"
          className="rounded-lg border border-line p-2 text-ink-soft hover:bg-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright lg:hidden"
        >
          <LayersIcon className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand font-display text-sm font-bold text-white">
            R
          </div>
          <div className="leading-tight">
            <h1 className="font-display text-base font-semibold text-ink">RegDoc Q&amp;A</h1>
            <p className="hidden text-xs text-ink-faint sm:block">
              Grounded answers from your controlled documents
            </p>
          </div>
        </div>
      </div>

      {health && (
        <div className="flex items-center gap-2">
          <span className="hidden font-mono text-[0.7rem] text-ink-faint sm:inline">
            {health.model}
          </span>
          <span
            className={[
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
              keyOk ? 'bg-verify-soft text-verify-ink' : 'bg-warn-soft text-warn',
            ].join(' ')}
            title={keyOk ? 'Anthropic API key configured' : 'Set ANTHROPIC_API_KEY on the backend to enable answers'}
          >
            {keyOk ? <CheckIcon className="h-3.5 w-3.5" /> : <AlertIcon className="h-3.5 w-3.5" />}
            {keyOk ? 'Ready' : 'Key needed'}
          </span>
        </div>
      )}
    </header>
  );
}
