import type { FastifyRequest } from 'fastify';
import { env } from '../config/env.js';

// preHandler hook for routes that call the AI Gateway.
export const requireAiKey = async (request: FastifyRequest) => {
  if (!env.AI_GATEWAY_API_KEY) {
    throw request.server.httpErrors.internalServerError(
      'AI_GATEWAY_API_KEY is not configured on the server',
    );
  }
};
