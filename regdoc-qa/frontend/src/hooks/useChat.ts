// Owns the chat thread: a list of question/answer turns plus an `ask` action.
// Each turn starts pending, then resolves to either an answer or an error.

import { useCallback, useState } from 'react';
import { askQuestion } from '../lib/api';
import type { ChatTurn } from '../types';

let counter = 0;
const nextId = () => `turn-${Date.now()}-${counter++}`;

export interface UseChat {
  turns: ChatTurn[];
  busy: boolean;
  ask: (question: string) => Promise<void>;
  clear: () => void;
}

export function useChat(): UseChat {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);

  const ask = useCallback(async (rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (!question || busy) return;

    const id = nextId();
    setTurns((prev) => [...prev, { id, question, answer: null, error: null, pending: true }]);
    setBusy(true);

    try {
      const answer = await askQuestion(question);
      setTurns((prev) =>
        prev.map((t) => (t.id === id ? { ...t, answer, pending: false } : t)),
      );
    } catch (err) {
      setTurns((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, error: (err as Error).message, pending: false } : t,
        ),
      );
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const clear = useCallback(() => setTurns([]), []);

  return { turns, busy, ask, clear };
}
