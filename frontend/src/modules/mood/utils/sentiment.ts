export const SCALE_MAX = 10;

// Anchor colors of the 0–10 scale: 0 = negative, 5 = neutral, 10 = positive.
export const SENTIMENT_COLORS = {
  negative: '#ef4444',
  neutral: '#eab308',
  positive: '#22c55e',
} as const;

export type SentimentLevel =
  | 'very-negative'
  | 'negative'
  | 'slightly-negative'
  | 'neutral'
  | 'slightly-positive'
  | 'positive'
  | 'very-positive';

// Upper bound (inclusive) of each level on the 0–10 scale.
const SENTIMENT_THRESHOLDS: { max: number; level: SentimentLevel; label: string }[] = [
  { max: 1, level: 'very-negative', label: 'Very negative' },
  { max: 3, level: 'negative', label: 'Negative' },
  { max: 4, level: 'slightly-negative', label: 'Slightly negative' },
  { max: 5, level: 'neutral', label: 'Neutral' },
  { max: 6, level: 'slightly-positive', label: 'Slightly positive' },
  { max: 8, level: 'positive', label: 'Positive' },
  { max: SCALE_MAX, level: 'very-positive', label: 'Very positive' },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixColors(from: string, to: string, ratio: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const [r, g, bl] = a.map((c, i) => Math.round(c + (b[i] - c) * ratio));
  return `rgb(${r}, ${g}, ${bl})`;
}

// Continuous color: red at 0, fully yellow at 5, fully green at 10, blended in between.
export function getSentimentColor(value: number): string {
  const v = clamp(value, 0, SCALE_MAX);
  const mid = SCALE_MAX / 2;
  return v <= mid
    ? mixColors(SENTIMENT_COLORS.negative, SENTIMENT_COLORS.neutral, v / mid)
    : mixColors(SENTIMENT_COLORS.neutral, SENTIMENT_COLORS.positive, (v - mid) / mid);
}

export function getSentiment(value: number): {
  level: SentimentLevel;
  label: string;
  color: string;
} {
  const v = clamp(value, 0, SCALE_MAX);
  const { level, label } =
    SENTIMENT_THRESHOLDS.find((t) => v <= t.max) ?? SENTIMENT_THRESHOLDS.at(-1)!;
  return { level, label, color: getSentimentColor(v) };
}
