import type { ScreenshotTranscription, TranscribedMessage } from './screenshots.schema.js';

// Shortest visible fragment of a cut-off message that still counts as a match.
const PARTIAL_MATCH_MIN_LENGTH = 8;

// Compare letters and digits only, so small OCR differences in punctuation, spacing or emoji
// (😀 vs 😁) don't matter. Bracketed tags ([illegible], [sticker: …]) are left out too, the same
// sticker can get a different description on each screenshot. Emoji-only messages are compared as they are.
const normalize = (text: string) => {
  const collapsed = text.toLowerCase().replace(/\s+/g, ' ').trim();
  const lettersOnly = collapsed
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return lettersOnly || collapsed;
};

const isSameMessage = (a: TranscribedMessage, b: TranscribedMessage) => {
  if (a.side !== b.side) return false;

  const textA = normalize(a.text);
  const textB = normalize(b.text);

  if (textA === textB) return true;

  // A message cut off by the screen edge shows only its beginning or its end.
  if (!a.partial && !b.partial) return false;

  const [shorter, longer] = textA.length <= textB.length ? [textA, textB] : [textB, textA];

  return shorter.length >= PARTIAL_MATCH_MIN_LENGTH && longer.includes(shorter);
};

// Of two transcriptions of the same message, keep the more complete one.
const pickBetter = (a: TranscribedMessage, b: TranscribedMessage) => {
  if (a.partial !== b.partial) {
    return a.partial ? b : a;
  }

  return b.text.length > a.text.length ? b : a;
};

// Length of the longest tail of `previous` that matches the head of `next`.
const findOverlap = (previous: TranscribedMessage[], next: TranscribedMessage[]) => {
  for (let size = Math.min(previous.length, next.length); size > 0; size--) {
    const tail = previous.slice(previous.length - size);
    if (tail.every((message, i) => isSameMessage(message, next[i]))) {
      return size;
    }
  }
  return 0;
};

// Joins screenshots (in upload order) into one conversation, dropping messages repeated
// in the overlap of consecutive screenshots.
export const mergeTranscriptions = (pages: ScreenshotTranscription[]): TranscribedMessage[] =>
  pages.reduce<TranscribedMessage[]>((merged, { messages }) => {
    const overlap = findOverlap(merged, messages);
    const start = merged.length - overlap;
    const deduplicated = messages
      .slice(0, overlap)
      .map((message, i) => pickBetter(merged[start + i], message));

    return [...merged.slice(0, start), ...deduplicated, ...messages.slice(overlap)];
  }, []);

export const formatTranscript = (messages: TranscribedMessage[], contactName: string | null) =>
  messages
    .map(({ side, author, text }) => {
      const speaker = side === 'me' ? 'Me' : (author ?? contactName ?? 'Other');
      // Line breaks inside a bubble are just wrapping; keep one message per line.
      return `${speaker}: ${text.replace(/\s*\n\s*/g, ' ')}`;
    })
    .join('\n');
