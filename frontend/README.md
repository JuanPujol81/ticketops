# TicketOps frontend

Responsive web client for the TicketOps API, built with React 19, TypeScript, Vinext, and Cloudflare-compatible output.

## Local development

```sh
npm install
cp .env.example .env
npm run dev
```

The interface runs on `http://localhost:5173` and expects the API at `http://localhost:3000/api/v1` by default.

`NEXT_PUBLIC_API_URL` can point to another API deployment. It must include the `/api/v1` prefix.

## Product areas

- Customer registration and sign-in.
- Role-aware operational dashboard.
- Searchable ticket inbox.
- Ticket creation, detail, workflow and assignment controls.
- Transactional activity timeline.
- Administrator team and role management.
- Responsive navigation for desktop, tablet and mobile.

## Checks

```sh
npm run build
npm run lint
npm test
```
