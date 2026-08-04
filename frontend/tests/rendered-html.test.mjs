import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost:5173/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders TicketOps metadata and application shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>TicketOps — Soporte bajo control<\/title>/i);
  assert.match(html, /Preparando tu espacio de trabajo/);
  assert.match(html, /property="og:image" content="http:\/\/localhost:5173\/og.png"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("contains the complete product surfaces", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(page, /Bandeja de tickets/);
  assert.match(page, /Gestión del equipo/);
  assert.match(page, /Crear un ticket/);
  assert.match(page, /Historial/);
  assert.match(page, /sessionStorage/);
  assert.match(css, /@media \(max-width:760px\)/);
  assert.match(css, /prefers-reduced-motion/);
});
