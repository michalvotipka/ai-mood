export type MoodKind = 'conversation' | 'message';

export type MoodAnalysis = {
  language: string;
  kind: MoodKind;
  tone: number;
  dynamics: number | null;
  inputQuality: number;
  summary: string;
  summaryEn: string;
};
