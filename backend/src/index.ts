import { buildApp } from './app.js';
import { env } from './config/env.js';

const app = buildApp();

// Docker publishes the port from outside the container, so listen on all interfaces, not just localhost.
await app.listen({ port: env.PORT, host: '0.0.0.0' });
app.log.info(`AI model: ${env.AI_MODEL}, OCR model: ${env.AI_OCR_MODEL}`);
