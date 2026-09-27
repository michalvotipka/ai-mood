import { z } from 'zod';

export const SCREENSHOTS_MAX_COUNT = 10;
export const SCREENSHOT_MAX_BYTES = 5 * 1024 * 1024;
export const SCREENSHOT_MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const screenshotFileSchema = z
  .instanceof(File)
  .refine((file) => SCREENSHOT_MEDIA_TYPES.includes(file.type), {
    message: `Supported image types: ${SCREENSHOT_MEDIA_TYPES.join(', ')}`,
  })
  .refine((file) => file.size <= SCREENSHOT_MAX_BYTES, {
    message: `Each image must be at most ${SCREENSHOT_MAX_BYTES / 1024 / 1024} MB`,
  });

// multipart/form-data: a single `images` field is a File, a repeated one an array of Files.
export const moodScreenshotsRequestSchema = z.object({
  images: z.preprocess(
    (value) => (value === undefined ? [] : Array.isArray(value) ? value : [value]),
    z.array(screenshotFileSchema).min(1).max(SCREENSHOTS_MAX_COUNT),
  ),
});

// Structured output of the OCR model for a single screenshot.
export const screenshotTranscriptionSchema = z.object({
  isConversation: z
    .boolean()
    .describe(
      'true when the image shows written communication (chat, email, message thread), false for anything else',
    ),
  imageQuality: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'How legible the screenshot itself is: 1 = sharp, all text fully readable; lower for blur, low resolution, compression artifacts, glare, overlays or text hidden by cropping; 0 = unreadable',
    ),
  contactName: z
    .string()
    .nullable()
    .describe('Name of the other party shown in the chat or email header, null when not visible'),
  messages: z
    .array(
      z.object({
        top: z
          .number()
          .describe(
            'Vertical position of the top edge of the message bubble: 0 = top of the image, 1000 = bottom',
          ),
        side: z
          .enum(['me', 'other'])
          .describe(
            'me = sent by the screenshot owner (usually right-aligned, colored bubbles), other = received',
          ),
        author: z
          .string()
          .nullable()
          .describe('Author name shown next to this message (group chats), otherwise null'),
        text: z
          .string()
          .describe(
            'Exact message text in the original language; emoji as emoji characters, unreadable parts as [illegible], non-text content as [sticker: …], [image: …], [voice message] etc.',
          ),
        partial: z
          .boolean()
          .describe('true when the message is cut off by the top or bottom edge of the screenshot'),
      }),
    )
    .describe('Messages in the order they appear, top to bottom'),
});

export type MoodScreenshotsRequest = z.infer<typeof moodScreenshotsRequestSchema>;
export type ScreenshotTranscription = z.infer<typeof screenshotTranscriptionSchema>;
export type TranscribedMessage = ScreenshotTranscription['messages'][number];
