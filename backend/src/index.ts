import { serve } from '@hono/node-server';
import { app } from './app.js';
import { env } from './config/env.js';

serve({ fetch: app.fetch, port: env.PORT }, ({ port }) => {
  console.log(
    `Backend listening on port ${port} (model: ${env.AI_MODEL}, OCR model: ${env.AI_OCR_MODEL})`,
  );
});
