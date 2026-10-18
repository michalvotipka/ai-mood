import httpProxy from '@fastify/http-proxy';
import type { FastifyInstance } from 'fastify';
import { getAccessToken } from './auth.js';
import { env } from './env.js';

declare module 'fastify' {
  interface FastifyRequest {
    accessToken?: string;
  }
}

// /api/** goes to the backend with the user's access token instead of the session cookie.
export const proxyRoutes = async (app: FastifyInstance) => {
  await app.register(httpProxy, {
    upstream: env.BACKEND_URL,
    prefix: '/api',
    rewritePrefix: '/api',
    preHandler: async (request, reply) => {
      request.accessToken = await getAccessToken(request.session);
      if (!request.accessToken) return reply.code(401).send({ error: 'Not signed in' });
    },
    replyOptions: {
      rewriteRequestHeaders: (request, { cookie: _cookie, ...headers }) => ({
        ...headers,
        authorization: `Bearer ${request.accessToken}`,
      }),
    },
  });
};
