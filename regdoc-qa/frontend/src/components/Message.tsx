// Renders a single chat turn: the user's question, then either a pending state,
// an error, or the grounded answer with inline citation chips and source cards.
// Clicking a chip highlights and scrolls to the matching source card.

import { Fragment, useState } from 'react';
import { CitationMarker } from './CitationMarker';
import { SourceCard } from './SourceCard';
import { AlertIcon, SearchIcon } from './Icons';
import { parseAnswer } from '../lib/citations';
import type { ChatTurn } from '../types';

interface MessageProps {
  turn: ChatTurn;
}

export function Message({ turn }: MessageProps) {
  const [activeSource, setActiveSource] = useState<number | null>(null);

  const sourceDomId = (n: number) => `src-${turn.id}-${n}`;

  const handleActivate = (n: number) => {
    setActiveSource(n);
    const el = document.getElementById(sourceDomId(n));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    // Clear after the pulse animation so it can retrigger on the next click.
    window.setTimeout(() => setActiveSource((cur) => (cur === n ? null : cur)), 1200);
  };

  return (
    <div className="animate-fade-up">
      {/* Question */}
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand px-4 py-2.5 text-sm leading-relaxed text-white shadow-card">
          {turn.question}
        </div>
      </div>

      {/* Answer */}
      <div className="mt-3">
        {turn.pending && <PendingAnswer />}

        {turn.error && (
          <div className="flex items-start gap-2 rounded-lg border border-warn/30 bg-warn-soft px-3 py-2.5 text-sm text-warn">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{turn.error}</span>
          </div>
        )}

        {turn.answer && (
          <AnswerBlock
            turn={turn}
            activeSource={activeSource}
            onActivate={handleActivate}
            sourceDomId={sourceDomId}
          />
        )}
      </div>
    </div>
  );
}

function PendingAnswer() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-ink-faint">
      <SearchIcon className="h-4 w-4 animate-pulse text-brand-bright" />
      <span>Searching the documents and composing a grounded answer…</span>
    </div>
  );
}

interface AnswerBlockProps {
  turn: ChatTurn;
  activeSource: number | null;
  onActivate: (n: number) => void;
  sourceDomId: (n: number) => string;
}

function AnswerBlock({ turn, activeSource, onActivate, sourceDomId }: AnswerBlockProps) {
  const answer = turn.answer!;
  const segments = parseAnswer(answer.answer, answer.sources.length);
  const filenameFor = (n: number) => answer.sources.find((s) => s.id === n)?.filename;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
      {/* Answer prose with inline citation chips. */}
      <div className="whitespace-pre-wrap text-[0.95rem] leading-7 text-ink">
        {segments.map((seg, i) =>
          seg.kind === 'text' ? (
            <Fragment key={i}>{seg.value}</Fragment>
          ) : (
            <CitationMarker
              key={i}
              n={seg.n}
              active={activeSource === seg.n}
              filename={filenameFor(seg.n)}
              onActivate={onActivate}
            />
          ),
        )}
      </div>

      {/* Sources */}
      {answer.sources.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">
              Sources
            </h4>
            <span className="font-mono text-[0.7rem] text-ink-faint">
              {answer.model}
            </span>
          </div>
          <ul className="space-y-2">
            {answer.sources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                domId={sourceDomId(source.id)}
                active={activeSource === source.id}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
