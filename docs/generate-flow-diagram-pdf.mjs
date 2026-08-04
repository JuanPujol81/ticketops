import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>TicketOps — Architecture &amp; Flow Diagrams</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <style>
    @page { margin: 20mm 15mm; size: A4; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      line-height: 1.5;
      max-width: 900px;
      margin: 0 auto;
      padding: 24px 32px 48px;
      font-size: 11pt;
    }
    h1 { font-size: 22pt; margin: 0 0 4px; color: #111; border-bottom: 3px solid #059669; padding-bottom: 8px; }
    h2 { font-size: 14pt; margin: 28px 0 10px; color: #047857; page-break-after: avoid; }
    h3 { font-size: 11pt; margin: 16px 0 8px; color: #374151; }
    p, li { margin: 0 0 8px; }
    .subtitle { color: #6b7280; font-size: 10pt; margin-bottom: 24px; }
    .legend { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px 16px; margin: 0 0 20px; font-size: 10pt; }
    .legend span { display: inline-block; margin-right: 16px; }
    .implemented { color: #047857; font-weight: 600; }
    .planned { color: #b45309; font-weight: 600; }
    .diagram {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin: 12px 0 20px;
      page-break-inside: avoid;
      overflow: hidden;
    }
    .mermaid { text-align: center; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 20px;
      font-size: 10pt;
    }
    th, td {
      border: 1px solid #d1d5db;
      padding: 8px 10px;
      text-align: left;
    }
    th { background: #ecfdf5; font-weight: 600; }
    tr:nth-child(even) td { background: #f9fafb; }
    .badge-impl { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 999px; font-size: 9pt; }
    .badge-plan { background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 999px; font-size: 9pt; }
    ul { padding-left: 20px; margin: 0 0 12px; }
    code { background: #f3f4f6; padding: 1px 5px; border-radius: 3px; font-size: 9pt; }
    footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 9pt; }
  </style>
</head>
<body>
  <h1>TicketOps</h1>
  <p class="subtitle">Target Architecture &amp; Flow Diagrams — Generated July 15, 2026</p>

  <p>
    TicketOps is a modular Node.js backend for ticket operations workflows. It uses TypeScript,
    Express, PostgreSQL, Prisma, Redis, and BullMQ. The diagrams below show the intended system
    design, with current implementation status noted where relevant.
  </p>

  <div class="legend">
    <span class="implemented">■ Implemented</span>
    <span class="planned">■ Planned / stubbed</span>
  </div>

  <h2>1. System Architecture (Target)</h2>
  <div class="diagram">
    <pre class="mermaid">
flowchart TB
    Client["HTTP Client / API Consumer"]

    subgraph API["Express API (:3000)"]
        Server["server.ts"]
        App["createApp() — app.ts"]
        Health["GET /health"]
        Ready["GET /ready"]
        AuthMod["/auth routes"]
        UsersMod["/users routes"]
        TicketsMod["/tickets routes"]
        ErrHandler["errorHandler middleware"]
    end

    subgraph Config["Configuration"]
        Env["config/env.ts<br/>Zod validation"]
    end

    subgraph Shared["Shared Infrastructure"]
        Prisma["shared/db/prisma.ts"]
        Redis["shared/queue/redis.ts"]
        Queue["ticket-events BullMQ Queue"]
        Logger["shared/logger/logger.ts"]
        HttpErr["shared/errors/http-error.ts"]
    end

    subgraph Workers["Background Workers (planned)"]
        Worker["ticket-events Worker"]
    end

    subgraph Infra["Docker Compose"]
        PG["PostgreSQL :5433"]
        RD["Redis :6379"]
    end

    Client --> Server
    Server --> App
    App --> Env
    App --> Health
    App --> Ready
    App --> AuthMod
    App --> UsersMod
    App --> TicketsMod
    App --> ErrHandler

    Ready --> Prisma
    TicketsMod --> Prisma
    UsersMod --> Prisma
    AuthMod --> Prisma

    TicketsMod --> Queue
    Queue --> Redis
    Worker --> Redis
    Worker --> Prisma

    Prisma --> PG
    Redis --> RD
    ErrHandler --> Logger
    ErrHandler --> HttpErr
    </pre>
  </div>

  <h2>2. Application Bootstrap Flow</h2>
  <div class="diagram">
    <pre class="mermaid">
flowchart TD
    Start([npm run dev / npm start]) --> LoadEnv["dotenv loads .env"]
    LoadEnv --> Validate["env.ts validates with Zod<br/>NODE_ENV, PORT, DATABASE_URL, REDIS_URL"]
    Validate -->|Invalid| Fail([Process exits on parse error])
    Validate -->|Valid| CreateApp["createApp() builds Express app"]
    CreateApp --> Mount["Mount JSON parser + routes"]
    Mount --> Listen["app.listen(PORT)"]
    Listen --> Running([API running on localhost:3000])
    </pre>
  </div>

  <h2>3. Request Handling Flow (Target)</h2>
  <div class="diagram">
    <pre class="mermaid">
flowchart TD
    Req([Incoming HTTP Request]) --> Parser["express.json() middleware"]
    Parser --> Route{Route match?}

    Route -->|GET /health| Health["Return status: ok"]
    Route -->|GET /ready| Ready["verifyDatabaseConnection()"]
    Ready -->|DB ok| ReadyOk["200 status: ready"]
    Ready -->|DB fail| ReadyFail["503 status: unavailable"]

    Route -->|/auth/*| Auth["auth.routes.ts<br/>login, sessions, tokens"]
    Route -->|/users/*| Users["users.routes.ts<br/>user management"]
    Route -->|/tickets/*| Tickets["tickets.routes.ts<br/>CRUD + status transitions"]

    Auth --> Handler["Module handler"]
    Users --> Handler
    Tickets --> Handler

    Handler -->|Success| JSON["JSON response"]
    Handler -->|HttpError| Err["errorHandler → status + message"]
    Handler -->|Unknown error| Err500["errorHandler → 500 Internal Server Error"]

    Tickets -->|On create/update| Event["Enqueue ticket-events job"]
    Event --> BullMQ["BullMQ Queue via Redis"]
    </pre>
  </div>

  <h2>4. Ticket Lifecycle Flow</h2>
  <div class="diagram">
    <pre class="mermaid">
stateDiagram-v2
    [*] --> NEW: Create ticket
    NEW --> IN_PROGRESS: Assign / start work
    IN_PROGRESS --> RESOLVED: Fix completed
    RESOLVED --> CLOSED: Confirm closure
    IN_PROGRESS --> CLOSED: Close without resolve
    NEW --> CLOSED: Cancel / close immediately

    note right of NEW
      Default status on creation
      (Prisma TicketStatus enum)
    end note

    note right of IN_PROGRESS
      Active handling phase
    end note

    note right of RESOLVED
      Work done, pending confirmation
    end note

    note right of CLOSED
      Terminal state
    end note
    </pre>
  </div>

  <h2>5. Ticket Event Pipeline (Target)</h2>
  <p>Async side effects (notifications, audit logs, integrations) are decoupled via BullMQ.</p>
  <div class="diagram">
    <pre class="mermaid">
sequenceDiagram
    actor Client
    participant API as tickets.routes.ts
    participant DB as Prisma / PostgreSQL
    participant Q as ticket-events Queue
    participant Redis as Redis
    participant W as Background Worker

    Client->>API: POST /tickets (create)
    API->>DB: prisma.ticket.create()
    DB-->>API: Ticket record
    API->>Q: add job { event: ticket.created, ticketId }
    Q->>Redis: Persist job
    API-->>Client: 201 Created

    Redis->>W: Deliver job
    W->>DB: Optional: write audit / update metadata
    W->>W: Send notification / webhook (planned)
    W-->>Redis: Acknowledge job complete
    </pre>
  </div>

  <h2>6. Readiness &amp; Health Checks</h2>
  <div class="diagram">
    <pre class="mermaid">
flowchart LR
    subgraph Liveness["Liveness — GET /health"]
        H1["No external deps"] --> H2["Always returns 200 ok"]
    end

    subgraph Readiness["Readiness — GET /ready"]
        R1["prisma.$queryRaw SELECT 1"] --> R2{Connection ok?}
        R2 -->|Yes| R3["200 status: ready"]
        R2 -->|No| R4["503 status: unavailable"]
    end

    Orchestrator["Docker / K8s / load balancer"] --> Liveness
    Orchestrator --> Readiness
    </pre>
  </div>

  <h2>7. Module Structure</h2>
  <div class="diagram">
    <pre class="mermaid">
flowchart TD
    subgraph src["src/"]
        app["app.ts — Express factory"]
        server["server.ts — entrypoint"]
        config["config/env.ts"]

        subgraph modules["modules/ (domain)"]
            auth["auth/auth.routes.ts"]
            users["users/users.routes.ts"]
            tickets["tickets/tickets.routes.ts"]
        end

        subgraph shared["shared/ (infrastructure)"]
            db["db/prisma.ts"]
            redis["queue/redis.ts"]
            queue["queue/ticket-events.queue.ts"]
            errors["errors/http-error.ts"]
            http["http/error-handler.ts"]
            log["logger/logger.ts"]
        end
    end

    subgraph data["Data layer"]
        schema["prisma/schema.prisma"]
        migrations["prisma/migrations/"]
    end

    server --> app
    app --> config
    app --> modules
    modules --> shared
    db --> schema
    schema --> migrations
    </pre>
  </div>

  <h2>8. Data Model</h2>
  <div class="diagram">
    <pre class="mermaid">
erDiagram
    Ticket {
        uuid id PK
        string subject
        string description
        TicketStatus status
        datetime createdAt
        datetime updatedAt
    }
    </pre>
  </div>

  <h3>TicketStatus enum</h3>
  <table>
    <thead><tr><th>Value</th><th>Meaning</th></tr></thead>
    <tbody>
      <tr><td><code>NEW</code></td><td>Ticket created, not yet assigned or started</td></tr>
      <tr><td><code>IN_PROGRESS</code></td><td>Actively being worked on</td></tr>
      <tr><td><code>RESOLVED</code></td><td>Work completed, awaiting closure</td></tr>
      <tr><td><code>CLOSED</code></td><td>Terminal state</td></tr>
    </tbody>
  </table>

  <h2>9. API Endpoints</h2>
  <table>
    <thead><tr><th>Endpoint</th><th>Status</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td><code>GET /health</code></td><td><span class="badge-impl">Implemented</span></td><td>Liveness check — returns <code>{ status: "ok" }</code></td></tr>
      <tr><td><code>GET /ready</code></td><td><span class="badge-impl">Implemented</span></td><td>Readiness check — verifies PostgreSQL via Prisma</td></tr>
      <tr><td><code>GET /tickets</code></td><td><span class="badge-plan">Stub</span></td><td>List tickets — currently returns empty array</td></tr>
      <tr><td><code>POST /tickets</code></td><td><span class="badge-plan">Planned</span></td><td>Create ticket + enqueue ticket-events job</td></tr>
      <tr><td><code>GET /tickets/:id</code></td><td><span class="badge-plan">Planned</span></td><td>Fetch single ticket</td></tr>
      <tr><td><code>PATCH /tickets/:id</code></td><td><span class="badge-plan">Planned</span></td><td>Update ticket / change status</td></tr>
      <tr><td><code>/auth/*</code></td><td><span class="badge-plan">Stub</span></td><td>Authentication routes (router exists, no handlers)</td></tr>
      <tr><td><code>/users/*</code></td><td><span class="badge-plan">Stub</span></td><td>User management routes (router exists, no handlers)</td></tr>
    </tbody>
  </table>

  <h2>10. Local Development Stack</h2>
  <div class="diagram">
    <pre class="mermaid">
flowchart LR
    Dev["Developer"] --> NPM["npm run dev<br/>(tsx watch)"]
    Dev --> Docker["docker compose up -d"]

    Docker --> PG["ticketops-postgres<br/>host :5433"]
    Docker --> RD["ticketops-redis<br/>host :6379"]

    NPM --> API["Express API :3000"]
    API --> PG
    API --> RD

    Dev --> Prisma["npm run prisma:migrate"]
    Prisma --> PG
    </pre>
  </div>

  <h2>11. Environment Variables</h2>
  <table>
    <thead><tr><th>Variable</th><th>Validated by</th><th>Example</th></tr></thead>
    <tbody>
      <tr><td><code>NODE_ENV</code></td><td>Zod enum</td><td><code>development</code></td></tr>
      <tr><td><code>PORT</code></td><td>Zod positive int</td><td><code>3000</code></td></tr>
      <tr><td><code>DATABASE_URL</code></td><td>Zod URL</td><td><code>postgresql://ticketops:ticketops@localhost:5433/ticketops</code></td></tr>
      <tr><td><code>REDIS_URL</code></td><td>Zod URL</td><td><code>redis://localhost:6379</code></td></tr>
    </tbody>
  </table>

  <h2>12. Implementation Status Summary</h2>
  <table>
    <thead><tr><th>Component</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td>Express bootstrap (<code>server.ts</code>, <code>app.ts</code>)</td><td><span class="badge-impl">Implemented</span></td></tr>
      <tr><td>Environment validation (<code>config/env.ts</code>)</td><td><span class="badge-impl">Implemented</span></td></tr>
      <tr><td><code>GET /health</code></td><td><span class="badge-impl">Implemented</span></td></tr>
      <tr><td><code>GET /ready</code> with Prisma check</td><td><span class="badge-impl">Implemented</span></td></tr>
      <tr><td>Prisma schema + Ticket model + migrations</td><td><span class="badge-impl">Implemented</span></td></tr>
      <tr><td>Docker Compose (PostgreSQL + Redis)</td><td><span class="badge-impl">Implemented</span></td></tr>
      <tr><td>Redis client + BullMQ queue definition</td><td><span class="badge-plan">Defined, not wired</span></td></tr>
      <tr><td>Module routers (auth, users, tickets)</td><td><span class="badge-plan">Stubbed, not mounted</span></td></tr>
      <tr><td>Error handler middleware</td><td><span class="badge-plan">Defined, not mounted</span></td></tr>
      <tr><td>Background worker for ticket-events</td><td><span class="badge-plan">Planned</span></td></tr>
      <tr><td>Full ticket CRUD + status transitions</td><td><span class="badge-plan">Planned</span></td></tr>
      <tr><td>Authentication</td><td><span class="badge-plan">Planned</span></td></tr>
    </tbody>
  </table>

  <footer>TicketOps — docs/ticketops-flow-diagrams.pdf</footer>

  <script>
    mermaid.initialize({ startOnLoad: true, theme: "default", securityLevel: "loose" });
  </script>
</body>
</html>`;

const htmlPath = path.join(__dirname, 'ticketops-flow-diagrams.html');
const pdfPath = path.join(__dirname, 'ticketops-flow-diagrams.pdf');

fs.writeFileSync(htmlPath, html);

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => document.querySelectorAll('.mermaid svg').length >= 9, {
  timeout: 30000,
});
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '15mm', right: '12mm', bottom: '15mm', left: '12mm' },
});
await browser.close();

console.log(`PDF written to: ${pdfPath}`);
