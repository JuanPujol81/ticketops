# TicketOps

TicketOps is a backend portfolio project for ticket operations workflows. It starts as a modular monolith using Node.js, TypeScript, Express, PostgreSQL, Prisma, Redis, BullMQ, Docker Compose, and Vitest.

## Tech Stack

- Node.js + TypeScript
- Express
- PostgreSQL + Prisma
- Redis + BullMQ
- Docker Compose
- Vitest

## Local Setup

```sh
npm install
cp .env.example .env
docker compose up -d
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Scripts

- `npm run dev` starts the API in watch mode.
- `npm run build` compiles TypeScript.
- `npm start` runs the compiled API.
- `npm test` runs Vitest.
- `npm run lint` runs ESLint.
- `npm run format` formats the repository.

## Architecture

The backend is organized as a modular monolith. Domain modules live under `src/modules`, while infrastructure shared by modules lives under `src/shared`.
