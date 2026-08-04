"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Role = "CUSTOMER" | "AGENT" | "ADMIN";
type Status = "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type User = { id: string; name: string; email: string; role: Role };
type Ticket = {
  id: string;
  title: string;
  subject: string;
  description?: string | null;
  status: Status;
  priority: Priority;
  requesterId: string;
  assigneeId?: string | null;
  requester: Pick<User, "id" | "name" | "email">;
  assignee?: Pick<User, "id" | "name" | "email"> | null;
  createdAt: string;
  updatedAt: string;
  events?: Array<{
    id: string;
    type: string;
    createdAt: string;
    actor: Pick<User, "id" | "name" | "role">;
  }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";
const statusLabels: Record<Status, string> = {
  NEW: "Nuevo",
  IN_PROGRESS: "En curso",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};
const priorityLabels: Record<Priority, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};
const roleLabels: Record<Role, string> = {
  CUSTOMER: "Cliente",
  AGENT: "Agente",
  ADMIN: "Administrador",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function date(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [view, setView] = useState<"dashboard" | "tickets" | "users">("dashboard");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status | "ALL">("ALL");

  const request = useCallback(
    async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });
      if (response.status === 204) return undefined as T;
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "No se pudo completar la acción");
      return body;
    },
    [token],
  );

  const loadTickets = useCallback(async () => {
    if (!token) return;
    const result = await request<{ data: Ticket[] }>("/tickets?limit=100");
    setTickets(result.data);
  }, [request, token]);

  const loadUsers = useCallback(async () => {
    if (!token || user?.role === "CUSTOMER") return;
    const result = await request<{ data: User[] }>("/users?limit=100");
    setUsers(result.data);
  }, [request, token, user?.role]);

  useEffect(() => {
    const stored = sessionStorage.getItem("ticketops_token");
    queueMicrotask(() => {
      if (!stored) setLoading(false);
      else setToken(stored);
    });
  }, []);

  useEffect(() => {
    if (!token) return;
    request<{ data: User }>("/users/me")
      .then((result) => setUser(result.data))
      .catch(() => {
        sessionStorage.removeItem("ticketops_token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [request, token]);

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => {
      void Promise.all([loadTickets(), loadUsers()]).catch((error: Error) => setNotice(error.message));
    });
  }, [loadTickets, loadUsers, user]);

  const filtered = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          (status === "ALL" || ticket.status === status) &&
          `${ticket.title} ${ticket.subject} ${ticket.requester.name}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [tickets, search, status],
  );

  const stats = useMemo(
    () => ({
      active: tickets.filter((ticket) => ticket.status === "NEW" || ticket.status === "IN_PROGRESS").length,
      urgent: tickets.filter((ticket) => ticket.priority === "URGENT" && ticket.status !== "CLOSED").length,
      resolved: tickets.filter((ticket) => ticket.status === "RESOLVED").length,
      unassigned: tickets.filter((ticket) => !ticket.assigneeId && ticket.status !== "CLOSED").length,
    }),
    [tickets],
  );

  async function authenticate(mode: "login" | "register", payload: Record<string, string>) {
    setLoading(true);
    try {
      const result = await request<{ data: { token: string; user: User } }>(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      sessionStorage.setItem("ticketops_token", result.data.token);
      setToken(result.data.token);
      setUser(result.data.user);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem("ticketops_token");
    setToken(null);
    setUser(null);
    setTickets([]);
    setSelected(null);
  }

  async function refreshSelected(id: string) {
    const result = await request<{ data: Ticket }>(`/tickets/${id}`);
    setSelected(result.data);
    await loadTickets();
  }

  async function updateStatus(ticket: Ticket, nextStatus: Status) {
    try {
      await request(`/tickets/${ticket.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await refreshSelected(ticket.id);
      setNotice("Estado actualizado correctamente");
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  async function assign(ticket: Ticket, assigneeId: string | null) {
    try {
      await request(`/tickets/${ticket.id}/assignee`, {
        method: "PATCH",
        body: JSON.stringify({ assigneeId }),
      });
      await refreshSelected(ticket.id);
      setNotice("Asignación actualizada");
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  if (loading && !user) return <div className="loading-screen"><span className="brand-mark">T</span><p>Preparando tu espacio de trabajo…</p></div>;
  if (!user) return <AuthScreen onAuthenticate={authenticate} loading={loading} />;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">T</span><span>TicketOps</span></div>
        <nav aria-label="Navegación principal">
          <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><span>⌂</span>Resumen</button>
          <button className={view === "tickets" ? "active" : ""} onClick={() => setView("tickets")}><span>▤</span>Tickets <b>{stats.active}</b></button>
          {user.role === "ADMIN" && <button className={view === "users" ? "active" : ""} onClick={() => setView("users")}><span>◎</span>Equipo</button>}
        </nav>
        <div className="sidebar-foot">
          <div className="help-card"><span>?</span><strong>¿Necesitas ayuda?</strong><small>Consulta la guía de operaciones</small></div>
          <button className="profile" onClick={logout} title="Cerrar sesión">
            <span className="avatar">{initials(user.name)}</span>
            <span><strong>{user.name}</strong><small>{roleLabels[user.role]}</small></span>
            <i>↗</i>
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><p>{new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p><h1>{view === "dashboard" ? `Hola, ${user.name.split(" ")[0]}` : view === "tickets" ? "Bandeja de tickets" : "Gestión del equipo"}</h1></div>
          <div className="top-actions"><button className="icon-button" aria-label="Notificaciones">♢<span /></button><button className="primary" onClick={() => setShowCreate(true)}>＋ Nuevo ticket</button></div>
        </header>

        {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice(null)}>×</button></div>}

        {view === "dashboard" && (
          <>
            <section className="stats-grid">
              <Stat label="Tickets activos" value={stats.active} tone="violet" note="Requieren seguimiento" />
              <Stat label="Sin asignar" value={stats.unassigned} tone="amber" note="Pendientes de equipo" />
              <Stat label="Urgentes" value={stats.urgent} tone="rose" note="Atención prioritaria" />
              <Stat label="Resueltos" value={stats.resolved} tone="green" note="En espera de cierre" />
            </section>
            <section className="dashboard-grid">
              <div className="panel wide"><PanelTitle title="Actividad reciente" action="Ver todos" onAction={() => setView("tickets")} /><TicketTable tickets={tickets.slice(0, 6)} onSelect={async (ticket) => { await refreshSelected(ticket.id); }} /></div>
              <div className="panel queue"><PanelTitle title="Distribución" /><div className="donut" style={{ "--progress": `${tickets.length ? Math.round((stats.active / tickets.length) * 100) : 0}%` } as React.CSSProperties}><span><strong>{tickets.length}</strong><small>Total</small></span></div><div className="legend">{(["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"] as Status[]).map((item) => <div key={item}><i className={`dot ${item.toLowerCase()}`} /><span>{statusLabels[item]}</span><b>{tickets.filter((ticket) => ticket.status === item).length}</b></div>)}</div></div>
            </section>
          </>
        )}

        {view === "tickets" && (
          <section className="panel ticket-page">
            <div className="filters"><label className="search">⌕<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por título, asunto o cliente…" /></label><select value={status} onChange={(event) => setStatus(event.target.value as Status | "ALL")}><option value="ALL">Todos los estados</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><span className="result-count">{filtered.length} resultados</span></div>
            <TicketTable tickets={filtered} onSelect={async (ticket) => { await refreshSelected(ticket.id); }} />
          </section>
        )}

        {view === "users" && user.role === "ADMIN" && <UsersPanel users={users} currentUser={user} request={request} onUpdated={loadUsers} onNotice={setNotice} />}
      </section>

      {showCreate && <CreateTicket onClose={() => setShowCreate(false)} request={request} onCreated={async () => { setShowCreate(false); await loadTickets(); setNotice("Ticket creado correctamente"); }} />}
      {selected && <TicketDrawer ticket={selected} user={user} users={users} onClose={() => setSelected(null)} onStatus={updateStatus} onAssign={assign} />}
    </main>
  );
}

function AuthScreen({ onAuthenticate, loading }: { onAuthenticate: (mode: "login" | "register", data: Record<string, string>) => Promise<void>; loading: boolean }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    try { await onAuthenticate(mode, data); } catch (issue) { setError((issue as Error).message); }
  }
  return <main className="auth-page"><section className="auth-story"><div className="brand light"><span className="brand-mark">T</span><span>TicketOps</span></div><div><span className="eyebrow">Soporte, sin ruido</span><h1>Cada solicitud.<br /><em>Bajo control.</em></h1><p>Centraliza las conversaciones, asigna responsabilidades y convierte cada incidencia en una solución medible.</p><div className="trust-row"><div className="avatar-stack"><span>AL</span><span>MR</span><span>JS</span></div><small>Equipos ágiles trabajan mejor<br />con una bandeja compartida.</small></div></div><footer>© 2026 TicketOps · Operaciones inteligentes</footer></section><section className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><span className="mobile-brand">TicketOps</span><p className="eyebrow">{mode === "login" ? "Bienvenido de nuevo" : "Empieza ahora"}</p><h2>{mode === "login" ? "Accede a tu espacio" : "Crea tu cuenta"}</h2><p>{mode === "login" ? "Gestiona tus tickets y mantén al equipo sincronizado." : "Tu bandeja de soporte estará lista en segundos."}</p>{mode === "register" && <label>Nombre completo<input name="name" required minLength={2} placeholder="María Rodríguez" /></label>}<label>Correo electrónico<input name="email" type="email" required placeholder="nombre@empresa.com" /></label><label>Contraseña<input name="password" type="password" required minLength={8} placeholder="Mínimo 8 caracteres" /></label>{error && <div className="form-error">{error}</div>}<button className="primary submit" disabled={loading}>{loading ? "Conectando…" : mode === "login" ? "Entrar en TicketOps →" : "Crear mi cuenta →"}</button><div className="switch-mode">{mode === "login" ? "¿Aún no tienes cuenta?" : "¿Ya tienes una cuenta?"}<button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Regístrate" : "Inicia sesión"}</button></div></form></section></main>;
}

function Stat({ label, value, tone, note }: { label: string; value: number; tone: string; note: string }) { return <article className={`stat ${tone}`}><div><p>{label}</p><strong>{value}</strong><small>{note}</small></div><span>{tone === "violet" ? "↗" : tone === "amber" ? "◷" : tone === "rose" ? "!" : "✓"}</span></article>; }
function PanelTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) { return <div className="panel-title"><div><h2>{title}</h2><p>Últimos movimientos de tu espacio</p></div>{action && <button onClick={onAction}>{action} →</button>}</div>; }

function TicketTable({ tickets, onSelect }: { tickets: Ticket[]; onSelect: (ticket: Ticket) => void }) {
  if (!tickets.length) return <div className="empty"><span>✓</span><h3>Todo está bajo control</h3><p>No hay tickets que coincidan con esta vista.</p></div>;
  return <div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Estado</th><th>Prioridad</th><th>Responsable</th><th>Actualizado</th><th /></tr></thead><tbody>{tickets.map((ticket) => <tr key={ticket.id} onClick={() => onSelect(ticket)}><td><strong>{ticket.title}</strong><small>#{ticket.id.slice(0, 6).toUpperCase()} · {ticket.subject}</small></td><td><span className={`badge status-${ticket.status.toLowerCase()}`}>{statusLabels[ticket.status]}</span></td><td><span className={`priority priority-${ticket.priority.toLowerCase()}`}><i />{priorityLabels[ticket.priority]}</span></td><td>{ticket.assignee ? <span className="assignee"><i className="avatar tiny">{initials(ticket.assignee.name)}</i>{ticket.assignee.name}</span> : <span className="muted">Sin asignar</span>}</td><td className="muted">{date(ticket.updatedAt)}</td><td><button className="row-action" aria-label="Abrir ticket">›</button></td></tr>)}</tbody></table></div>;
}

function CreateTicket({ onClose, request, onCreated }: { onClose: () => void; request: <T>(path: string, options?: RequestInit) => Promise<T>; onCreated: () => Promise<void> }) {
  const [priority, setPriority] = useState<Priority>("MEDIUM"); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setError(""); const data = Object.fromEntries(new FormData(event.currentTarget).entries()); try { await request("/tickets", { method: "POST", body: JSON.stringify(data) }); await onCreated(); } catch (issue) { setError((issue as Error).message); } finally { setSaving(false); } }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="modal" onSubmit={submit}><div className="modal-head"><div><span className="eyebrow">Nueva solicitud</span><h2>Crear un ticket</h2></div><button type="button" onClick={onClose}>×</button></div><label>Título<input name="title" required maxLength={120} placeholder="Describe el problema brevemente" /></label><label>Área o asunto<input name="subject" required maxLength={120} placeholder="Ej. Facturación, Acceso, Producto" /></label><label>Descripción<textarea name="description" required={priority === "URGENT"} maxLength={2000} rows={5} placeholder="Añade el contexto necesario para resolverlo…" /></label><label>Prioridad<select name="priority" value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button className="primary" disabled={saving}>{saving ? "Creando…" : "Crear ticket"}</button></div></form></div>;
}

function TicketDrawer({ ticket, user, users, onClose, onStatus, onAssign }: { ticket: Ticket; user: User; users: User[]; onClose: () => void; onStatus: (ticket: Ticket, status: Status) => Promise<void>; onAssign: (ticket: Ticket, id: string | null) => Promise<void> }) {
  const transitions: Record<Status, Status[]> = { NEW: ["IN_PROGRESS", "CLOSED"], IN_PROGRESS: ["RESOLVED", "NEW"], RESOLVED: ["CLOSED", "IN_PROGRESS"], CLOSED: ["NEW"] };
  const available = user.role === "CUSTOMER" ? transitions[ticket.status].filter((item) => item === "CLOSED") : transitions[ticket.status];
  return <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="drawer"><div className="drawer-head"><div><span className="ticket-id">#{ticket.id.slice(0, 8).toUpperCase()}</span><h2>{ticket.title}</h2><p>{ticket.subject}</p></div><button onClick={onClose}>×</button></div><div className="drawer-badges"><span className={`badge status-${ticket.status.toLowerCase()}`}>{statusLabels[ticket.status]}</span><span className={`priority priority-${ticket.priority.toLowerCase()}`}><i />{priorityLabels[ticket.priority]}</span></div><section className="drawer-section"><h3>Descripción</h3><p>{ticket.description || "Sin descripción adicional."}</p></section><section className="drawer-section detail-grid"><div><small>Solicitante</small><strong>{ticket.requester.name}</strong><span>{ticket.requester.email}</span></div><div><small>Creado</small><strong>{date(ticket.createdAt)}</strong></div></section>{user.role !== "CUSTOMER" && <section className="drawer-section"><label>Responsable<select value={ticket.assigneeId ?? ""} onChange={(event) => void onAssign(ticket, event.target.value || null)}><option value="">Sin asignar</option>{users.filter((item) => item.role === "AGENT" || item.role === "ADMIN").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></section>}<section className="drawer-section"><h3>Siguiente acción</h3><div className="status-actions">{available.map((item) => <button key={item} onClick={() => void onStatus(ticket, item)}>{statusLabels[item]}</button>)}</div></section><section className="drawer-section timeline"><h3>Historial</h3>{ticket.events?.map((event) => <div key={event.id}><i /><span><strong>{event.actor.name}</strong><small>{event.type.replaceAll("_", " ")} · {date(event.createdAt)}</small></span></div>) ?? <p className="muted">Sin actividad registrada.</p>}</section></aside></div>;
}

function UsersPanel({ users, currentUser, request, onUpdated, onNotice }: { users: User[]; currentUser: User; request: <T>(path: string, options?: RequestInit) => Promise<T>; onUpdated: () => Promise<void>; onNotice: (message: string) => void }) {
  async function changeRole(id: string, role: Role) { try { await request(`/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }); await onUpdated(); onNotice("Rol actualizado"); } catch (error) { onNotice((error as Error).message); } }
  return <section className="panel users-panel"><div className="panel-title"><div><h2>Equipo y permisos</h2><p>{users.length} personas con acceso a TicketOps</p></div></div><div className="user-grid">{users.map((item) => <article key={item.id}><span className="avatar large">{initials(item.name)}</span><div><h3>{item.name}</h3><p>{item.email}</p></div><select value={item.role} disabled={item.id === currentUser.id} onChange={(event) => void changeRole(item.id, event.target.value as Role)}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></article>)}</div></section>;
}
