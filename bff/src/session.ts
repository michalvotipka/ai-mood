import cookie from '@fastify/cookie';
import session from '@fastify/session';
import type { FastifyInstance } from 'fastify';
import type { Redis } from 'ioredis';
import { env } from './env.js';

export type User = {
  name: string;
  roles: string[];
};

declare module 'fastify' {
  interface Session {
    // Between /auth/login and /auth/callback.
    login?: { state: string; codeVerifier: string };
    // After a successful sign-in.
    user?: User;
    tokens?: { accessToken: string; refreshToken: string; idToken: string; expiresAt: number };
  }
}

// Signed out after 30 minutes without a request. Every response extends it (rolling).
const IDLE_TIMEOUT_SECONDS = 30 * 60;

// The browser gets only a random session ID in an httpOnly cookie. Tokens stay here, in Redis.
export const registerSession = async (app: FastifyInstance, redis: Redis) => {
  const key = (sessionId: string) => `session:${sessionId}`;

  await app.register(cookie);
  await app.register(session, {
    secret: env.SESSION_SECRET,
    cookieName: 'sid',
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      // Not sent with cross-site requests other than plain link navigations (CSRF protection).
      sameSite: 'lax',
      maxAge: IDLE_TIMEOUT_SECONDS * 1000,
    },
    store: {
      get: (sessionId, callback) => {
        redis
          .get(key(sessionId))
          .then((value) => callback(null, value && JSON.parse(value)), callback);
      },
      set: (sessionId, data, callback) => {
        redis
          .set(key(sessionId), JSON.stringify(data), 'EX', IDLE_TIMEOUT_SECONDS)
          .then(() => callback(), callback);
      },
      destroy: (sessionId, callback) => {
        redis.del(key(sessionId)).then(() => callback(), callback);
      },
    },
  });
};
