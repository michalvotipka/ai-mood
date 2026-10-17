import { AsyncLocalStorage } from 'node:async_hooks';
import type { FastifyBaseLogger } from 'fastify';
import fp from 'fastify-plugin';

const storage = new AsyncLocalStorage<FastifyBaseLogger>();
let appLogger: FastifyBaseLogger | undefined;

// Keeps the logger of the current request in an async context for the whole request, so services
// can log with its reqId without the logger being passed through every call.
export const requestLogger = fp(async (app) => {
  appLogger = app.log;
  app.addHook('onRequest', (request, _reply, done) => storage.run(request.log, done));
});

// Logger of the current request, or the app logger outside of a request.
export const getLogger = (): FastifyBaseLogger => {
  const logger = storage.getStore() ?? appLogger;
  if (!logger) throw new Error('Logger used before the app was built');
  return logger;
};
