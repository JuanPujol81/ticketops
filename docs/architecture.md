# Architecture

## Decisions

TicketOps is a modular monolith. This keeps deployment and database transactions simple while preserving boundaries that can later become separate services if scale requires it.

- **Routes** define endpoints and attach authentication/role middleware.
- **Controllers** translate HTTP input/output and validate with Zod.
- **Services** enforce ownership, role policy, ticket transitions, and other business rules.
- **Repositories** own Prisma queries and transactions.
- **Shared infrastructure** contains configuration, logging, errors, database, Redis, and queue clients.

Dependencies point inward: transport depends on application services, and services depend on persistence abstractions. No repository decides whether a caller is authorized.

## Domains

### Auth

Registration normalizes email addresses, hashes passwords with bcrypt cost 12, and always creates a customer. Login returns a signed, expiring JWT containing only the user ID and role. Password hashes never leave the repository/service boundary.

### Users

Authenticated users can fetch their own profile. Agents can read the user directory for ticket assignment, while only administrators can change another user's role. Self-demotion is rejected to reduce accidental administrative lockout.

### Tickets

Customers can create and view their own tickets. Agents and administrators can operate across tickets. Assignment is restricted to agents/admins. Administrative deletion is explicit and permanent.

Status is a state machine:

```text
NEW -> IN_PROGRESS -> RESOLVED -> CLOSED
 |          ^            |         |
 +-> CLOSED +------------+         +-> NEW
             IN_PROGRESS <- RESOLVED
NEW <- IN_PROGRESS
```

Every create, edit, assignment, and status change writes a `TicketEvent` in the same transaction as the ticket mutation. `GET /tickets/:id` exposes the ordered history to authorized readers.

## Security boundaries

- JWT verification occurs before all user/ticket routes.
- Role checks are enforced at routing boundaries; ownership is enforced in services.
- Unauthorized access to another customer's ticket returns 404 to avoid disclosing existence.
- All body, path, and query inputs are schema validated.
- Public registration cannot choose a role.
- Passwords are capped at 72 characters to match bcrypt's effective input limit.
- Express implementation headers are disabled; CORS is configurable.

JWT roles are authorization snapshots. After changing a user's role, previously issued tokens retain the former role until expiry; use a short expiry or add token revocation before deploying to higher-risk environments.

## Reliability and operations

`/health` confirms that the process can serve HTTP. `/ready` checks PostgreSQL and Redis, allowing an orchestrator to stop routing traffic when dependencies are unavailable. SIGINT/SIGTERM stop accepting traffic and close all shared clients.

PostgreSQL is the source of truth. Redis/BullMQ is prepared for notification, SLA, and analytics consumers; durable ticket history does not depend on Redis availability.

## Data migration

The v1 migration preserves tickets created under the earlier schema by attaching them to a disabled migration-owner administrator. Deployments should reassign those records and then keep or remove that account according to their data-retention policy.
