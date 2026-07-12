# TicketOps

TicketOps is a backend portfolio project for ticket operations workflows. The project is being built as a modular Node.js API with TypeScript, Express, PostgreSQL, Prisma, Redis, BullMQ, Docker Compose, and Vitest.

The current implementation focuses on the foundation of the service:

- Express application bootstrapping.
- Centralized environment configuration with Zod validation.
- A `/health` endpoint.
- Docker Compose services for PostgreSQL and Redis.
- Prisma schema and initial migration for tickets.
- Automated checks for build, tests, and linting.

## Tech Stack

- Node.js + TypeScript
- Express
- PostgreSQL + Prisma
- Redis + BullMQ
- Docker Compose
- Vitest

## Requirements

- Node.js 20 or newer
- npm
- Docker Desktop
- Git

## Local Setup

```sh
npm install
cp .env.example .env
docker compose up -d
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

The API runs on:

```text
http://localhost:3000
```

Health check:

```sh
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

## Environment Variables

Environment variables are loaded and validated in `src/config/env.ts`.

| Variable | Description | Example |
| --- | --- | --- |
| `NODE_ENV` | Runtime environment. Must be `development`, `test`, or `production`. | `development` |
| `PORT` | API port. Must be a positive integer. | `3000` |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma. | `postgresql://ticketops:ticketops@localhost:5433/ticketops?schema=public` |
| `REDIS_URL` | Redis connection string. | `redis://localhost:6379` |

PostgreSQL is exposed on host port `5433` to avoid conflicts with other local apps. Inside Docker, PostgreSQL still listens on port `5432`.

## Scripts

- `npm run dev` starts the API in watch mode.
- `npm run build` compiles TypeScript.
- `npm start` runs the compiled API.
- `npm test` runs Vitest.
- `npm run lint` runs ESLint.
- `npm run format` formats the repository.
- `npm run prisma:generate` generates the Prisma client.
- `npm run prisma:migrate` creates/applies local Prisma migrations.
- `npm run prisma:studio` opens Prisma Studio.

## Quality Checks

Before considering a step complete, run:

```sh
npm run build
npm test
npm run lint
```

The current test suite includes:

- A health-check test for `GET /health`.
- Environment configuration tests for valid settings and invalid `PORT` handling.

## Architecture

The backend is organized as a modular monolith.

```text
src/
  app.ts                 Express app factory
  server.ts              HTTP server entrypoint
  config/
    env.ts               Centralized environment loading and validation
  modules/               Domain modules
  shared/                Shared infrastructure helpers
tests/
  unit/                  Unit tests
prisma/
  schema.prisma          Database schema
  migrations/            Prisma migrations
```

At this stage, the server intentionally initializes only the Express app and validated configuration. Prisma, Redis, BullMQ, authentication, logging, and ticket routes exist as project structure, but are not wired into application startup yet.

## API

### `GET /health`

Returns a simple status response confirming the API is running.

Response:

```json
{
  "status": "ok"
}
```
