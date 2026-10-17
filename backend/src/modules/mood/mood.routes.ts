import multipart from '@fastify/multipart';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { env } from '../../config/env.js';
import { moodRequestSchema } from './mood.schema.js';
import { analyzeMood } from './mood.service.js';
import {
  moodScreenshotsRequestSchema,
  SCREENSHOT_MAX_BYTES,
  SCREENSHOTS_MAX_COUNT,
} from './screenshots.schema.js';
import { analyzeScreenshots } from './screenshots.service.js';

export const moodRoutes: FastifyPluginAsyncZod = async (app) => {
  // Registered inside this plugin, so multipart parsing and its limits apply only to mood routes.
  await app.register(multipart, { limits: { fileSize: SCREENSHOT_MAX_BYTES } });

  app.addHook('preHandler', async () => {
    if (!env.AI_GATEWAY_API_KEY) {
      throw app.httpErrors.internalServerError(
        'AI_GATEWAY_API_KEY is not configured on the server',
      );
    }
  });

  app.post('/', { schema: { body: moodRequestSchema } }, async (request) => {
    try {
      return await analyzeMood(request.body);
    } catch (err) {
      request.log.error(err, 'Mood analysis failed');
      throw app.httpErrors.badGateway('Mood analysis failed');
    }
  });

  app.post('/screenshots', async (request) => {
    const images: File[] = [];
    for await (const part of request.files()) {
      if (part.fieldname !== 'images') {
        part.file.resume();
        continue;
      }
      if (images.length === SCREENSHOTS_MAX_COUNT) {
        throw app.httpErrors.badRequest(`At most ${SCREENSHOTS_MAX_COUNT} images are allowed`);
      }
      images.push(
        new File([new Uint8Array(await part.toBuffer())], part.filename, { type: part.mimetype }),
      );
    }
    const input = moodScreenshotsRequestSchema.parse({ images });

    let analysis;
    try {
      analysis = await analyzeScreenshots(input);
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
