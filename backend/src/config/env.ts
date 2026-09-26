import { z } from 'zod';

const DEFAULT_AI_MODEL = 'google/gemini-2.5-flash-lite';

// Environment is injected by docker compose (locally from .env) or by the hosting platform.
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(43100),
  AI_GATEWAY_API_KEY: z.string().default(''),
  AI_MODEL: z
    .string()
    .trim()
    .transform((v) => v || DEFAULT_AI_MODEL)
    .default(DEFAULT_AI_MODEL),
});

export const env = envSchema.parse(process.env);

if (!env.AI_GATEWAY_API_KEY) {
  console.warn('AI_GATEWAY_API_KEY is not set.');
}
