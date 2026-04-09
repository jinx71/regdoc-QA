// Parses an answer string into renderable segments so inline [n] markers can be
// turned into interactive citation chips while leaving the surrounding prose intact.

export type AnswerSegment =
  | { kind: 'text'; value: string }
  | { kind: 'cite'; n: number };

const CITATION_RE = /\[(\d{1,2})\]/g;

/**
 * Split text like "Swabs must recover ≥70% [1] before release [2]." into:
 * [ {text "Swabs must recover ≥70% "}, {cite 1}, {text " before release "}, {cite 2}, {text "."} ]
 *
 * Only markers whose number maps to a real source (1..sourceCount) become chips;
 * anything out of range is preserved as literal text so nothing is silently dropped.
 */
export function parseAnswer(answer: string, sourceCount: number): AnswerSegment[] {
  const segments: AnswerSegment[] = [];
  let lastIndex = 0;

  for (const match of answer.matchAll(CITATION_RE)) {
    const index = match.index ?? 0;
    const n = Number(match[1]);
    const valid = n >= 1 && n <= sourceCount;

    if (index > lastIndex) {
      segments.push({ kind: 'text', value: answer.slice(lastIndex, index) });
    }

    if (valid) {
      segments.push({ kind: 'cite', n });
    } else {
      segments.push({ kind: 'text', value: match[0] });
    }
    lastIndex = index + match[0].length;
  }

  if (lastIndex < answer.length) {
    segments.push({ kind: 'text', value: answer.slice(lastIndex) });
  }

  return segments;
}
