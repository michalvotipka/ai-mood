import type { FastifyPluginAsync } from 'fastify';
import { moodRoutes } from '../modules/mood/index.js';
import { authentication } from '../plugins/authentication.js';

export const apiRoutes: FastifyPluginAsync = async (app) => {
  await app.register(authentication);
  app.register(moodRoutes, { prefix: '/mood' });
};
