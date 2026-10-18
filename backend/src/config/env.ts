import { z } from 'zod';
import { databaseUrlSchema } from './database.js';

const DEFAULT_AI_MODEL = 'google/gemini-2.5-flash-lite';
// Flash-Lite mixes up the order and sides of messages on wider (desktop) screenshots.
const DEFAULT_AI_OCR_MODEL = 'google/gemini-2.5-flash';

// Environment is injected by docker compose (locally from .env) or by the hosting platform.
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(43100),
  AI_GATEWAY_API_KEY: z.string().default(''),
  AI_MODEL: z
    .string()
    .trim()
    .transform((v) => v || DEFAULT_AI_MODEL)
    .default(DEFAULT_AI_MODEL),
  // Vision model that transcribes uploaded screenshots to text.
  AI_OCR_MODEL: z
    .string()
    .trim()
    .transform((v) => v || DEFAULT_AI_OCR_MODEL)
    .default(DEFAULT_AI_OCR_MODEL),
  // Access tokens from Keycloak are verified against these.
  OIDC_ISSUER_URL: z.url().default('http://localhost:43300/realms/ai-mood'),
  // Where the backend downloads Keycloak's signing keys. In docker compose it's Keycloak's internal address.
  OIDC_JWKS_URL: z
    .url()
    .default('http://localhost:43300/realms/ai-mood/protocol/openid-connect/certs'),
  OIDC_AUDIENCE: z.string().default('ai-mood-backend'),
});

export const env = {
  ...envSchema.parse(process.env),
  DATABASE_URL: databaseUrlSchema.parse(process.env),
};

if (!env.AI_GATEWAY_API_KEY) {
  console.warn('AI_GATEWAY_API_KEY is not set.');
}
