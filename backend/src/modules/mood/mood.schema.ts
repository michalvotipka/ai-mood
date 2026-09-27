import { z } from 'zod';

export const MOOD_SUMMARY_MIN_LENGTH = 150;
export const MOOD_SUMMARY_MAX_LENGTH = 300;

export const moodRequestSchema = z.object({
  text: z.string().trim().min(1).max(5_000),
});

// Structured output the model must return.
// Keep it provider-friendly: no string length limits (not supported by every provider's
// strict JSON schema mode) — the summary length is enforced in the prompt and in the service.
export const moodAnalysisSchema = z.object({
  language: z
    .string()
    .describe(
      'English name of the language the analyzed text is written in, e.g. "English", "Czech", "German"',
    ),
  kind: z
    .enum(['conversation', 'message'])
    .describe(
      'conversation = exchange between two or more people (chat, thread); message = text from a single author (email, letter, post)',
    ),
  inputQuality: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'How clear, coherent and complete the input is for analysis: 1 = clear, coherent text with enough context, 0 = unrelated fragments or too little to judge',
    ),
  tone: z
    .number()
    .int()
    .min(0)
    .max(10)
    .describe('Overall emotional tone: 0 = very negative, 5 = neutral, 10 = very positive'),
  dynamics: z
    .number()
    .int()
    .min(0)
    .max(10)
    .nullable()
    .describe(
      'Conversation dynamics: 0 = strained, one-sided or disengaged, 10 = effortless, mutual interest and understanding. null when kind is "message"',
    ),
  summaryEn: z
    .string()
    .describe(
      `Verbal impression of the tone and dynamics in 2–3 sentences, always in English, ${MOOD_SUMMARY_MIN_LENGTH}–${MOOD_SUMMARY_MAX_LENGTH} characters`,
    ),
  summary: z
    .string()
    .describe(
      '"summaryEn" translated into "language"; identical to "summaryEn" when "language" is English',
    ),
});

export type MoodRequest = z.infer<typeof moodRequestSchema>;
export type MoodAnalysis = z.infer<typeof moodAnalysisSchema>;
