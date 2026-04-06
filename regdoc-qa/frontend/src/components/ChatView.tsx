// The main conversation pane: a scrollable thread of Q&A turns with an empty
// state (clickable example questions) and a sticky composer at the bottom.

import { useEffect, useRef, useState } from 'react';
import { Message } from './Message';
import { SearchIcon, SendIcon } from './Icons';
import type { UseChat } from '../hooks/useChat';

interface ChatViewProps {
  chat: UseChat;
  hasDocuments: boolean;
}

const EXAMPLE_QUESTIONS = [
  'What swab recovery percentage is required for cleaning validation?',
  'How often must analytical balances be calibrated?',
  'Within how many days must a critical deviation be closed?',
  'Who is responsible for approving a CAPA plan?',
];

export function ChatView({ chat, hasDocuments }: ChatViewProps) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep the latest turn in view as the thread grows or an answer resolves.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chat.turns]);

  const submit = () => {
    const q = draft.trim();
    if (!q || chat.busy || !hasDocuments) return;
    void chat.ask(q);
    setDraft('');
  };

  const askExample = (q: string) => {
    if (chat.busy || !hasDocuments) return;
    void chat.ask(q);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {chat.turns.length === 0 ? (
            <EmptyState
              hasDocuments={hasDocuments}
              onPick={askExample}
            />
          ) : (
            <div className="space-y-6">
              {chat.turns.map((turn) => (
                <Message key={turn.id} turn={turn} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-line bg-surface/80 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-xl border border-line bg-surface p-2 shadow-card focus-within:border-brand-bright">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              disabled={!hasDocuments}
              placeholder={
                hasDocuments
                  ? 'Ask a question about your documents…'
                  : 'Add or load documents to start asking…'
              }
              className="max-h-40 min-h-[2.25rem] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed text-ink placeholder:text-ink-faint focus:outline-none disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!draft.trim() || chat.busy || !hasDocuments}
              aria-label="Ask"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
            >
              {chat.busy ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <SendIcon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Ask</span>
            </button>
          </div>
          <p className="mt-1.5 px-1 text-[0.7rem] text-ink-faint">
            Answers are grounded in your documents and cite their sources. Press Enter to ask,
            Shift+Enter for a new line.
          </p>
        </div>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  hasDocuments: boolean;
  onPick: (q: string) => void;
}

function EmptyState({ hasDocuments, onPick }: EmptyStateProps) {
  return (
    <div className="animate-fade-up py-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/8 text-brand">
        <SearchIcon className="h-6 w-6" />
      </div>
      <h2 className="font-display text-xl font-semibold text-ink">
        Ask your regulatory documents
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
        Every answer is grounded only in the documents you provide and cites the exact source
        passages it used — so you can trace each claim back to its origin.
      </p>

      {hasDocuments ? (
        <div className="mx-auto mt-6 max-w-xl">
          <p className="mb-2 font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">
            Try asking
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onPick(q)}
                className="rounded-lg border border-line bg-surface px-3 py-2.5 text-left text-sm text-ink-soft shadow-card transition-colors hover:border-brand-bright hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="mx-auto mt-6 max-w-md rounded-lg border border-dashed border-line bg-paper px-4 py-3 text-sm text-ink-faint">
          Your library is empty. Use <span className="font-medium text-ink">Load sample SOPs</span>{' '}
          in the sidebar to try it instantly, or add your own PDF, TXT, or Markdown files.
        </p>
      )}
    </div>
  );
}
