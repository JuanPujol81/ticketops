# TicketOps

TicketOps is a production-oriented REST API for support-ticket operations. It is implemented as a modular TypeScript monolith with authentication, role-based access, ticket workflow rules, audit history, health checks, and containerized infrastructure.

## Features

- Registration and login with bcrypt password hashing and signed JWT access tokens.
- `CUSTOMER`, `AGENT`, and `ADMIN` authorization roles.
- Ticket creation, search, filtering, pagination, sorting, updates, assignment, status transitions, and deletion.
- Ownership isolation: customers only see their own tickets.
- Durable ticket audit events stored transactionally with each change.
- PostgreSQL through Prisma, plus Redis/BullMQ infrastructure for asynchronous consumers.
- Liveness and dependency-aware readiness endpoints.
- Centralized validation and predictable API errors.
- Graceful shutdown for HTTP, Prisma, Redis, and BullMQ connections.
- Unit and HTTP contract tests with Vitest and Supertest.

## Stack

Node.js 20+, TypeScript, Express 5, PostgreSQL 16, Prisma 6, Redis 7, BullMQ, Zod, JWT, bcryptjs, Vitest, ESLint, Docker Compose.

## Quick start

```sh
npm install
cp .env.example .env
docker compose up -d
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

In another terminal, start the web application:

```sh
cd frontend
npm install
cp .env.example .env
npm run dev
```

The API listens on `http://localhost:3000` and the frontend on `http://localhost:5173`. PostgreSQL uses host port `5433`; Redis uses `6379`.

Generate a secure production secret with `openssl rand -base64 48` and set it as `JWT_SECRET`. The included default is accepted only outside production.

## API overview

All application endpoints use the `/api/v1` prefix. Protected endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint                       | Access            | Purpose                        |
| ------ | ------------------------------ | ----------------- | ------------------------------ |
| GET    | `/health`                      | Public            | Process liveness               |
| GET    | `/ready`                       | Public            | PostgreSQL and Redis readiness |
| POST   | `/api/v1/auth/register`        | Public            | Register a customer            |
| POST   | `/api/v1/auth/login`           | Public            | Obtain an access token         |
| GET    | `/api/v1/users/me`             | Authenticated     | Current profile                |
| GET    | `/api/v1/users`                | Agent/admin       | Paginated users                |
| PATCH  | `/api/v1/users/:id/role`       | Admin             | Change a user's role           |
| GET    | `/api/v1/tickets`              | Authenticated     | Search/list tickets            |
| POST   | `/api/v1/tickets`              | Authenticated     | Create a ticket                |
| GET    | `/api/v1/tickets/:id`          | Authenticated     | Ticket and audit history       |
| PATCH  | `/api/v1/tickets/:id`          | Owner/agent/admin | Edit ticket fields             |
| PATCH  | `/api/v1/tickets/:id/status`   | Authenticated     | Apply a valid transition       |
| PATCH  | `/api/v1/tickets/:id/assignee` | Agent/admin       | Assign or unassign             |
| DELETE | `/api/v1/tickets/:id`          | Admin             | Permanently delete             |

The list endpoint supports `status`, `priority`, `assigneeId`, `search`, `page`, `limit`, `sortBy`, and `sortOrder`. See [docs/api.md](docs/api.md) for request examples, role rules, transitions, and error contracts.

## Architecture

```text
HTTP request
  -> route (authentication/authorization)
  -> controller (transport parsing)
  -> service (business policy)
  -> repository (Prisma transaction)
  -> PostgreSQL
```

Each domain lives in `src/modules/<domain>`. Shared infrastructure and HTTP concerns live in `src/shared`. Controllers do not query Prisma directly, and repositories do not contain authorization policy. Ticket changes and their audit event are committed in one database transaction.

More detail is in [docs/architecture.md](docs/architecture.md).

## Commands

```sh
npm run dev              # development watch mode
npm run build            # strict TypeScript compilation
npm start                # run compiled server
npm test                 # test suite
npm run lint             # static analysis
npm run format           # format repository
npm run prisma:generate  # generate Prisma client
npm run prisma:migrate   # create/apply a development migration
npm run user:promote -- user@example.com ADMIN # bootstrap/change a role
```

For a deployment, apply committed migrations non-interactively with `npx prisma migrate deploy`, then run `npm run build && npm start`.

## Environment

| Variable         | Required   | Default                | Description                             |
| ---------------- | ---------- | ---------------------- | --------------------------------------- |
| `NODE_ENV`       | No         | `development`          | `development`, `test`, or `production`  |
| `PORT`           | No         | `3000`                 | Positive HTTP port                      |
| `DATABASE_URL`   | Yes        | —                      | PostgreSQL connection URL               |
| `REDIS_URL`      | Yes        | —                      | Redis connection URL                    |
| `JWT_SECRET`     | Production | Development-only value | Minimum 32 characters                   |
| `JWT_EXPIRES_IN` | No         | `1h`                   | JWT duration understood by jsonwebtoken |
| `CORS_ORIGIN`    | No         | `*`                    | Allowed web origin                      |

## Quality gate

Before release:

```sh
npm run prisma:generate
npm run build
npm test
npm run lint
npm audit
```

Public registration always creates a `CUSTOMER`. Bootstrap the first administrator with `npm run user:promote -- user@example.com ADMIN` after that account registers. The command also accepts `AGENT` and `CUSTOMER` for controlled role administration.
