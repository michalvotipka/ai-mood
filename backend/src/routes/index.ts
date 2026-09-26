import { Hono } from 'hono';
import { moodRoutes } from '../modules/mood/index.js';

export const apiRoutes = new Hono().route('/mood', moodRoutes);
