# ai-mood

Minimal full-stack TypeScript setup: Node.js backend + React (Vite) frontend, both running in Docker.

## Structure

```
backend/src/
  index.ts          server entry (Hono on Node)
  app.ts            app setup: middleware, routes, error handling
  config/           env parsing & validation (zod)
  routes/           URL → controller mapping
  controllers/      request/response handling (HTTP layer)
  services/         business logic, AI calls (no HTTP here)
  schemas/          zod request schemas + inferred types
  modules/<name>/   self-contained feature modules (schema, prompt, service, routes), e.g. mood
  middleware/       shared middleware (validation, errors)

frontend/src/
  api/              fetch client + typed API calls
  features/<name>/  components, hooks and types per feature (e.g. chat)
  App.tsx           page composition

docker-compose.yml
```

## Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)

The app itself runs entirely in Docker. For editor support (TypeScript types, IntelliSense), also install dependencies locally using Node 24 (see `.nvmrc`):

```bash
nvm use
(cd backend && npm install) && (cd frontend && npm install)
```

## Environment variables

Secrets live in a root `.env` file, which is gitignored. Only `.env.example` is committed.

```bash
cp .env.example .env   # then fill in AI_GATEWAY_API_KEY
```

- `AI_GATEWAY_API_KEY`: [Vercel AI Gateway](https://vercel.com/ai-gateway) key (Vercel dashboard → AI Gateway → API Keys). The app doesn't need to be deployed on Vercel.
- `AI_MODEL` (optional): any model id from the [model list](https://vercel.com/ai-gateway/models), e.g. `openai/gpt-4.1-mini`, `openai/gpt-5-mini`. Defaults to `google/gemini-2.5-flash-lite` (set in `backend/src/config/env.ts`).
- `AI_OCR_MODEL` (optional): vision model that transcribes uploaded screenshots to text before the mood analysis. Same default as `AI_MODEL`.

`docker compose` passes `.env` to the **backend only**, so the key never reaches the browser bundle. After editing `.env`, run `docker compose up -d backend` (a plain restart doesn't re-read it). In production, set the same variables in the hosting platform's environment settings.

## Run

```bash
docker compose up --build
```

- Frontend: http://localhost:43200
- Backend:  http://localhost:43100

Both services reload automatically when you edit source files.

Stop with `Ctrl+C`, or run `docker compose down`.

### Port already in use?

Override the host ports with environment variables:

```bash
BACKEND_PORT=43101 FRONTEND_PORT=43201 docker compose up --build
```

## Useful commands

```bash
docker compose up -d --build                 # run in background
docker compose logs -f                       # follow logs
docker compose down                          # stop and remove containers
docker compose exec frontend npm install <pkg>   # add a frontend dependency
docker compose exec backend npm install <pkg>    # add a backend dependency
docker compose exec backend npm run typecheck    # type-check backend
docker compose exec frontend npm run typecheck   # type-check frontend
```

After changing dependencies, rebuild and refresh the `node_modules` volumes: `docker compose up --build -V`.
