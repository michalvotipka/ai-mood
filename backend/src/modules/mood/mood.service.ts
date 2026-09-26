import { generateText, Output } from 'ai';
import { env } from '../../config/env.js';
import { MOOD_SYSTEM_PROMPT } from './mood.prompt.js';
import {
  MOOD_SUMMARY_MAX_LENGTH,
  moodAnalysisSchema,
  type MoodAnalysis,
  type MoodRequest,
} from './mood.schema.js';

// Cut on a word boundary so an over-long summary doesn't end mid-word.
const truncateSummary = (summary: string) => {
  const trimmed = summary.trim();
  if (trimmed.length <= MOOD_SUMMARY_MAX_LENGTH) return trimmed;
  const cut = trimmed.slice(0, MOOD_SUMMARY_MAX_LENGTH - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, '')}…`;
};

export const analyzeMood = async ({ text }: MoodRequest): Promise<MoodAnalysis> => {
  const { output } = await generateText({
    model: env.AI_MODEL,
    instructions: MOOD_SYSTEM_PROMPT,
    prompt: `Analyze the following text:\n\n<text>\n${text}\n</text>`,
    output: Output.object({
      name: 'mood_analysis',
      description: 'Mood analysis of a conversation or a message',
      schema: moodAnalysisSchema,
    }),
  });

  return {
    ...output,
    // Guard the model's output against rule violations it can't be forced into by the schema.
    dynamics: output.kind === 'message' ? null : output.dynamics,
    inputQuality: Math.round(Math.min(1, Math.max(0, output.inputQuality)) * 100) / 100,
    summaryEn: truncateSummary(output.summaryEn),
    // For English input don't rely on the model copying summaryEn — it sometimes drifts into another language.
    summary: truncateSummary(
      output.language.toLowerCase() === 'english' ? output.summaryEn : output.summary,
    ),
  };
};
