import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { ZodError } from 'zod';

export const errorHandler = (err: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
  // Route schema validation (body, query, params).
  if (hasZodFastifySchemaValidationErrors(err)) {
    const issues = err.validation.map(({ instancePath, message }) => ({
      path: instancePath,
      message,
    }));
    return reply.code(400).send({ error: 'Invalid request', issues });
  }
  // Manual validation in a handler (e.g. multipart uploads).
  if (err instanceof ZodError) {
    const issues = err.issues.map(({ path, message }) => ({
      path: path.length ? `/${path.join('/')}` : '',
      message,
    }));
    return reply.code(400).send({ error: 'Invalid request', issues });
  }
  // HTTP errors thrown on purpose (@fastify/sensible httpErrors) and Fastify's own errors.
  if (err.statusCode) {
    if (err.statusCode >= 500) request.log.error(err);
    const message = err.statusCode === 413 ? 'Upload is too large' : err.message;
    return reply.code(err.statusCode).send({ error: message });
  }
  request.log.error(err, 'Unhandled error');
  return reply.code(500).send({ error: 'Internal server error' });
};

export const notFoundHandler = (_request: FastifyRequest, reply: FastifyReply) =>
  reply.code(404).send({ error: 'Not found' });
