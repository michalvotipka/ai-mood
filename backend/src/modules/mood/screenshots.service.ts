import { generateText, Output } from 'ai';
import { env } from '../../config/env.js';
import type { MoodAnalysis } from './mood.schema.js';
import { analyzeMood } from './mood.service.js';
import { formatTranscript, mergeTranscriptions } from './screenshots.merge.js';
import { SCREENSHOT_SYSTEM_PROMPT } from './screenshots.prompt.js';
import {
  screenshotTranscriptionSchema,
  type MoodScreenshotsRequest,
  type ScreenshotTranscription,
} from './screenshots.schema.js';

export type MoodScreenshotsAnalysis = MoodAnalysis & { transcript: string };

const transcribeScreenshot = async (image: File): Promise<ScreenshotTranscription> => {
  const { output } = await generateText({
    model: env.AI_OCR_MODEL,
    instructions: SCREENSHOT_SYSTEM_PROMPT,
    // OCR has one right answer: always pick the most likely token, so the text isn't paraphrased
    // and the same message reads the same on overlapping screenshots (the merge relies on it).
    // It doesn't stop made-up text on blurry images — that's what [illegible] and imageQuality are for.
    // Remove it for models that don't support it (OpenAI reasoning models) or advise against it (Gemini 3).
    temperature: 0,
    // Gemini 2.5 Flash thinks by default: with thinking off it read the message order just as well
    // (and caught more stickers) in half the time and output tokens. Ignored by other providers.
    providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
    prompt: [
      {
        role: 'user',
        content: [
          { type: 'file', mediaType: image.type, data: new Uint8Array(await image.arrayBuffer()) },
          { type: 'text', text: 'Transcribe this screenshot.' },
        ],
      },
    ],
    output: Output.object({
      name: 'screenshot_transcription',
      description: 'Messages transcribed from a screenshot of a conversation',
      schema: screenshotTranscriptionSchema,
    }),
  });
  // The model sometimes groups messages by side (left column, then right one) even when told
  // not to; the reported position puts them back in the order they appear on the screen.
  return { ...output, messages: output.messages.toSorted((a, b) => a.top - b.top) };
};

// Text quality (short, incoherent or [illegible] text) is the base; a hard-to-read screenshot
// lowers it further, because OCR of a blurry image may read fluently and still be made up. E.g.
// text 0.9 × image 0.3 → 0.49,
// text 0.3 × image 1 → 0.3,
// text 0.9 × image 0.9 → 0.85.
const combineQuality = (textQuality: number, imageQuality: number) =>
  Math.round(textQuality * Math.sqrt(Math.min(1, Math.max(0, imageQuality))) * 100) / 100;

// Returns null when no conversation was found in the screenshots.
export const analyzeScreenshots = async ({
  images,
}: MoodScreenshotsRequest): Promise<MoodScreenshotsAnalysis | null> => {
  const pages = (await Promise.all(images.map(transcribeScreenshot))).filter(
    (page) => page.isConversation && page.messages.length > 0,
  );
  if (!pages.length) return null;

  const contactName = pages.find((page) => page.contactName)?.contactName ?? null;
  const transcript = formatTranscript(mergeTranscriptions(pages), contactName);
  const imageQuality = pages.reduce((sum, page) => sum + page.imageQuality, 0) / pages.length;

  const analysis = await analyzeMood({ text: transcript });
  return {
    ...analysis,
    inputQuality: combineQuality(analysis.inputQuality, imageQuality),
    transcript,
  };
};
