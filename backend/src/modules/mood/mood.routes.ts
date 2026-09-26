import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { env } from '../../config/env.js';
import { validate } from '../../middleware/validate.js';
import { moodRequestSchema } from './mood.schema.js';
import { analyzeMood } from './mood.service.js';

export const moodRoutes = new Hono().post('/', validate('json', moodRequestSchema), async (c) => {
  if (!env.AI_GATEWAY_API_KEY) {
    throw new HTTPException(500, { message: 'AI_GATEWAY_API_KEY is not configured on the server' });
  }

  try {
    const analysis = await analyzeMood(c.req.valid('json'));
    return c.json(analysis);
  } catch (err) {
    console.error('Mood analysis failed:', err);
    throw new HTTPException(502, { message: 'Mood analysis failed' });
  }
});
