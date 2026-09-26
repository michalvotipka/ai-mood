import { Hono } from 'hono';

export const apiRoutes = new Hono().route('/mood', new Hono().post('/')); // TBD
