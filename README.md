# ai-mood

Minimal full-stack TypeScript setup: Node.js (Fastify) backend + React (Vite) frontend, both running in Docker.

## Architecture

- **Feature modules.** Each feature lives in `modules/<name>/` on both backend and frontend (e.g. `mood`). A module is self-contained and exposes its public API only through its `index.ts`; import from there, not from its internals.
- **Backend layers.** Within a module, `*.routes.ts` handles HTTP, `*.service.ts` holds business logic and AI calls (no HTTP here), `*.schema.ts` defines zod schemas and their inferred types, and `*.prompt.ts` holds the AI prompts.
- **Shared code stays outside modules.** Env config, middleware and route mounting live at the top level of `backend/src`; the HTTP client lives in `frontend/src/api`.
- **Database.** PostgreSQL via [Prisma](https://www.prisma.io/). The schema and migrations live in `backend/prisma/`, the shared Prisma client in `backend/src/db/` (services import it from there). The generated client (`backend/src/generated/`) is gitignored and regenerated on `npm install` and on backend start.

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
- `AI_OCR_MODEL` (optional): vision model that transcribes uploaded screenshots to text before the mood analysis. Defaults to `google/gemini-2.5-flash` — `flash-lite` mixes up the order and sides of messages on wider screenshots.

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: PostgreSQL credentials. The `db` service creates the database with them, the backend connects with them.
- `POSTGRES_HOST`, `POSTGRES_PORT`: where the database is reachable from your machine, e.g. `localhost` and a free port such as `45432` (used by the Prisma CLI on the host; docker compose publishes the db on that port). Inside docker compose the backend connects to `db:5432` instead.

The backend builds the connection string from these in `backend/src/config/database.ts` (the only place it's put together), so the password may contain any characters.

`docker compose` passes `.env` to the **backend only**, so the key never reaches the browser bundle. After editing `.env`, run `docker compose up -d backend` (a plain restart doesn't re-read it). In production, set the same variables in the hosting platform's environment settings.

## Run

```bash
docker compose up --build
```

- Frontend: http://localhost:43200 (sign in as `user`/`user`, or `admin`/`admin` with the `admin` role)
- Backend:  http://localhost:43100
- Keycloak: http://localhost:43300 (admin console: `admin`/`admin`)
- PostgreSQL: `localhost:<POSTGRES_PORT>` (from `.env`)

Pending migrations are applied automatically when the backend starts.

Both services reload automatically when you edit source files.

Stop with `Ctrl+C`, or run `docker compose down`.

### Port already in use?

Override the host ports with environment variables:

```bash
BACKEND_PORT=43101 FRONTEND_PORT=43201 docker compose up --build
```

## Authentication

[Keycloak](https://www.keycloak.org/) with the realm from `keycloak/realm.json`, imported whenever the container is created, and a BFF (backend for frontend) in `bff/`. The browser never sees a token.

```
browser ── session cookie ──► BFF ── Bearer token ──► backend
                               ├─ Keycloak (sign-in)
                               └─ Redis (sessions)
```

1. **Sign-in** (`bff/src/auth.ts`): `/auth/login` sends the browser to Keycloak's login page (Authorization Code flow with PKCE). Keycloak returns to `/auth/callback`, where the BFF exchanges the code for tokens.
2. **Session** (`bff/src/session.ts`): the tokens are stored in Redis, the browser gets only a random session ID in an `httpOnly`, `SameSite=Lax` cookie. It expires after 30 minutes without a request; Keycloak's session (8 hours at most) ends it too.
3. **Proxy** (`bff/src/proxy.ts`): `/api/**` goes to the backend with `Authorization: Bearer <access token>` instead of the cookie. The BFF refreshes the access token shortly before it expires.
4. **Backend** (`backend/src/plugins/authentication.ts`) verifies the token on every `/api` request (signature, issuer, audience, expiry) and puts the user, including roles, into `request.user`.
5. **CSRF**: besides the `SameSite` cookie, the BFF requires the `X-Requested-With` header on anything but GET. The frontend's axios client always sends it.
6. **Security headers**: the BFF sends [helmet](https://github.com/fastify/fastify-helmet)'s defaults. The page gets a Content Security Policy from `frontend/vite.config.ts` (only its own scripts, no framing): strict for `vite preview` of the build, with inline scripts and styles allowed in dev, which Vite needs. A production web server must send the same headers.

`SESSION_SECRET` in `.env` signs the session cookie. Users registered in the app or changes made in the Keycloak admin console are lost when the Keycloak container is recreated.

## Deployment

Production runs on a single AWS EC2 server with `docker-compose.prod.yml`, the server is created by Terraform. See [deploy/README.md](deploy/README.md).

## Useful commands

```bash
docker compose up -d --build                 # run in background
docker compose logs -f                       # follow logs
docker compose down                          # stop and remove containers
docker compose exec frontend npm install <pkg>   # add a frontend dependency
docker compose exec backend npm install <pkg>    # add a backend dependency
docker compose exec backend npm run typecheck    # type-check backend
docker compose exec frontend npm run typecheck   # type-check frontend
docker compose exec backend npm run lint         # lint (also: lint:fix, format, format:check)
docker compose exec frontend npm run lint
```

## Database

```bash
docker compose exec backend npm run db:migrate -- --name <name>   # after editing schema.prisma: create and apply a migration
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'   # SQL console
docker compose down -v                                           # stop and delete all data (db volume)
```

After changing dependencies, rebuild and refresh the `node_modules` volumes: `docker compose up --build -V`.
