import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { requireAiKey } from '../../middleware/require-ai-key.js';
import { fileUploads } from '../../plugins/file-uploads.js';
import { moodRequestSchema } from './mood.schema.js';
import { analyzeText, getMoodStats } from './mood.service.js';
import {
  moodScreenshotsRequestSchema,
  SCREENSHOT_MAX_BYTES,
  SCREENSHOTS_MAX_COUNT,
} from './screenshots.schema.js';
import { analyzeScreenshots } from './screenshots.service.js';

// Routes that run an analysis: they need the AI key and accept screenshot uploads.
const analysisRoutes: FastifyPluginAsyncZod = async (app) => {
  await app.register(fileUploads, {
    maxFileSize: SCREENSHOT_MAX_BYTES,
    maxFiles: SCREENSHOTS_MAX_COUNT,
  });
  app.addHook('preHandler', requireAiKey);

  app.post('/', { schema: { body: moodRequestSchema } }, async (request) => {
    try {
      return await analyzeText(request.body);
    } catch (err) {
      request.log.error(err, 'Mood analysis failed');
      throw app.httpErrors.badGateway('Mood analysis failed');
    }
  });

  app.post('/screenshots', { schema: { body: moodScreenshotsRequestSchema } }, async (request) => {
    let analysis;
    try {
      analysis = await analyzeScreenshots(request.body);
    } catch (err) {
      request.log.error(err, 'Screenshot analysis failed');
      throw app.httpErrors.badGateway('Screenshot analysis failed');
    }
    if (!analysis) {
      throw app.httpErrors.unprocessableEntity('No conversation found in the screenshots');
    }
    return analysis;
  });
};

export const moodRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/stats', async () => getMoodStats());

  // Own scope, so the AI key check and multipart parsing apply only to the analysis routes.
  await app.register(analysisRoutes);
};
