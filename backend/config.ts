// Environment is injected by docker compose (local, from .env) or by Vercel (production).
export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
};

if (!config.openaiApiKey) {
  console.warn('OPENAI_API_KEY is not set — copy .env.example to .env and fill it in.');
}
