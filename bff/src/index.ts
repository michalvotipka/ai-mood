import helmet from '@fastify/helmet';
import Fastify from 'fastify';
import { Redis } from 'ioredis';
import { authRoutes } from './auth.js';
import { env } from './env.js';
import { proxyRoutes } from './proxy.js';
import { registerSession } from './session.js';

const app = Fastify({
  logger: env.NODE_ENV === 'production' ? true : { transport: { target: 'pino-pretty' } },
});

// Security headers (nosniff, HSTS, no framing, ...) on every response of the BFF.
await app.register(helmet);
await registerSession(app, new Redis(env.REDIS_URL));

// CSRF protection on top of the SameSite cookie: a request that changes something must carry a
// custom header. A foreign page can't add one without a CORS preflight, which this BFF never allows.
app.addHook('onRequest', async (request, reply) => {
  const changesState = !['GET', 'HEAD'].includes(request.method);
  if (changesState && request.headers['x-requested-with'] !== 'XMLHttpRequest') {
    return reply.code(403).send({ error: 'Missing X-Requested-With header' });
  }
});

await app.register(authRoutes);
await app.register(proxyRoutes);

// Docker publishes the port from outside the container, so listen on all interfaces.
await app.listen({ port: env.PORT, host: '0.0.0.0' });
