import { z } from 'zod';

// Environment is injected by docker compose (locally from .env) or by the hosting platform.
const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().int().positive().default(43400),
  // Where the browser loads the app (and this BFF under /auth and /api).
  APP_URL: z.url().default('http://localhost:43200'),
  BACKEND_URL: z.url().default('http://localhost:43100'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  // Keycloak realm as the browser sees it. It's also the `iss` of the tokens.
  KEYCLOAK_URL: z.url().default('http://localhost:43300/realms/ai-mood'),
  // The same realm as this service reaches it (inside docker compose: keycloak:8080).
  KEYCLOAK_INTERNAL_URL: z.url().optional(),
  KEYCLOAK_CLIENT_ID: z.string().default('bff'),
  KEYCLOAK_CLIENT_SECRET: z.string().min(1),
  // Signs the session cookie.
  SESSION_SECRET: z.string().min(32),
});

export const env = envSchema.parse(process.env);
