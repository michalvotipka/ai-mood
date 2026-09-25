# ai-mood

Minimal full-stack TypeScript setup: Node.js backend + React (Vite) frontend, both running in Docker.

## Structure

```
backend/   Node.js + TypeScript HTTP server (run via tsx), route GET /
frontend/  React 19 + TypeScript (.tsx) + Vite app showing "Hello World"
docker-compose.yml
```

## Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)

The app itself runs entirely in Docker. For editor support (TypeScript types, IntelliSense), also install dependencies locally using Node 24 (see `.nvmrc`):

```bash
nvm use
(cd backend && npm install) && (cd frontend && npm install)
```

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
