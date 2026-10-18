export type MoodKind = 'conversation' | 'message';

export type MoodInputMode = 'text' | 'screenshots';

export type MoodAnalysis = {
  language: string;
  kind: MoodKind;
  tone: number;
  dynamics: number | null;
  inputQuality: number;
  summary: string;
  summaryEn: string;
  transcript?: string;
};

export type MoodStats = {
  // Number of analyses stored in the history, across all users.
  total: number;
};
