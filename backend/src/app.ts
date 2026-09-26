import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { apiRoutes } from './routes/index.js';

export const app = new Hono()
  .use(logger())
  .get('/', (c) => c.json({ message: 'Hello from ai-mood backend' }))
  .route('/api', apiRoutes)
  .onError(errorHandler)
  .notFound(notFoundHandler);
