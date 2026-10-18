import sensible from '@fastify/sensible';
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { prisma } from './db/index.js';
import { requestLogger } from './logger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { apiRoutes } from './routes/index.js';

export const buildApp = () => {
  const app = Fastify({
    logger: process.env.NODE_ENV === 'production' ? true : { transport: { target: 'pino-pretty' } },
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(requestLogger);
  app.register(sensible);
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  app.get('/', async () => ({ message: 'Hello from backend' }));
  app.register(apiRoutes, { prefix: '/api' });

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  return app;
};
