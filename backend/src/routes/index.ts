import type { FastifyPluginAsync } from 'fastify';
import { moodRoutes } from '../modules/mood/index.js';

export const apiRoutes: FastifyPluginAsync = async (app) => {
  app.register(moodRoutes, { prefix: '/mood' });
};
