# API reference

Base URL: `http://localhost:3000/api/v1`

## Authentication

Register:

```sh
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","password":"correct-horse-42"}'
```

Login:

```sh
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","password":"correct-horse-42"}'
```

Successful authentication returns `{ "data": { "user": ..., "token": "..." } }`. Use the token on protected requests:

```text
Authorization: Bearer <token>
```

## Tickets

Create:

```sh
curl -X POST http://localhost:3000/api/v1/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Checkout failure","subject":"Payments","description":"Card confirmation times out","priority":"HIGH"}'
```

List and filter:

```sh
curl -H "Authorization: Bearer $TOKEN" \
  'http://localhost:3000/api/v1/tickets?status=NEW&priority=HIGH&search=checkout&page=1&limit=20&sortBy=createdAt&sortOrder=desc'
```

Update fields:

```sh
curl -X PATCH http://localhost:3000/api/v1/tickets/$TICKET_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"description":"Updated diagnostic details"}'
```

Change status:

```sh
curl -X PATCH http://localhost:3000/api/v1/tickets/$TICKET_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"IN_PROGRESS"}'
```

Assign (`AGENT`/`ADMIN`):

```sh
curl -X PATCH http://localhost:3000/api/v1/tickets/$TICKET_ID/assignee \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"assigneeId":"00000000-0000-0000-0000-000000000001"}'
```

Set `assigneeId` to `null` to unassign.

### Workflow rules

- `NEW` → `IN_PROGRESS` or `CLOSED`
- `IN_PROGRESS` → `RESOLVED` or `NEW`
- `RESOLVED` → `CLOSED` or `IN_PROGRESS`
- `CLOSED` → `NEW`
- Customers may only move their own ticket to `CLOSED`.
- Closed tickets must be reopened before editing.
- Urgent tickets require a description.
- Customers cannot change priority after creation.

## Pagination

List responses have this shape:

```json
{
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 0, "pages": 0 }
}
```

`limit` is capped at 100.

## Errors

Errors use a stable envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": []
  }
}
```

Common statuses are 400 validation/business input, 401 authentication, 403 authorization, 404 missing or hidden resource, 409 conflict/invalid transition, and 500 unexpected failure.
