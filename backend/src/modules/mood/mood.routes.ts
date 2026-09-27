import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { HTTPException } from 'hono/http-exception';
import { env } from '../../config/env.js';
import { validate } from '../../middleware/validate.js';
import { moodRequestSchema } from './mood.schema.js';
import { analyzeMood } from './mood.service.js';
import {
  moodScreenshotsRequestSchema,
  SCREENSHOT_MAX_BYTES,
  SCREENSHOTS_MAX_COUNT,
} from './screenshots.schema.js';
import { analyzeScreenshots } from './screenshots.service.js';

const requireApiKey = () => {
  if (!env.AI_GATEWAY_API_KEY) {
    throw new HTTPException(500, { message: 'AI_GATEWAY_API_KEY is not configured on the server' });
  }
};

export const moodRoutes = new Hono()
  .post('/', validate('json', moodRequestSchema), async (c) => {
    requireApiKey();

    try {
      const analysis = await analyzeMood(c.req.valid('json'));
      return c.json(analysis);
    } catch (err) {
      console.error('Mood analysis failed:', err);
      throw new HTTPException(502, { message: 'Mood analysis failed' });
    }
  })
  .post(
    '/screenshots',
    bodyLimit({
      // All images at max size plus room for the multipart overhead.
      maxSize: SCREENSHOTS_MAX_COUNT * SCREENSHOT_MAX_BYTES + 1024 * 1024,
      onError: (c) => c.json({ error: 'Upload is too large' }, 413),
    }),
    validate('form', moodScreenshotsRequestSchema),
    async (c) => {
      requireApiKey();

      let analysis;
      try {
        analysis = await analyzeScreenshots(c.req.valid('form'));
      } catch (err) {
        console.error('Screenshot analysis failed:', err);
        throw new HTTPException(502, { message: 'Screenshot analysis failed' });
      }
      if (!analysis) {
        throw new HTTPException(422, { message: 'No conversation found in the screenshots' });
      }
      return c.json(analysis);
    },
  );
