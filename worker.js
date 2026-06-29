/* ============================================================================
 * GAP — Cloudflare Worker
 * ----------------------------------------------------------------------------
 * Serves the static site AND a shared-preset API on the same domain, backed
 * by D1 (SQLite). Each preset is its own row → simultaneous saves never clash.
 *
 *   GET    /api/presets        → all presets (JSON array)
 *   POST   /api/presets        → create one  (body = preset JSON) → returns it
 *   PUT    /api/presets/:id     → update one  (body = preset JSON) → returns it
 *   DELETE /api/presets/:id     → delete one
 *   everything else            → static file (your existing site)
 *
 * DEPLOY (one time)
 *   1. Create the D1 database (Cloudflare dashboard → Storage & Databases → D1
 *      → Create, name it "gap_presets") and copy its Database ID.
 *   2. Paste that ID into wrangler.toml (database_id).
 *   3. Create the table — in the D1 "Console" tab, run:
 *
 *        CREATE TABLE IF NOT EXISTS presets (
 *          id         TEXT PRIMARY KEY,
 *          kind       TEXT,
 *          name       TEXT,
 *          updated_at TEXT,
 *          body       TEXT
 *        );
 *
 *   4. Commit worker.js + wrangler.toml to the repo root and push.
 *   5. In preset-store.js set  API_URL = "/api/presets"  and push.
 *   Done — the preset library is shared across the whole domain.
 * ========================================================================== */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/api/presets" || path.startsWith("/api/presets/")) {
      try {
        return await handleApi(request, env, path);
      } catch (e) {
        return json({ error: String(e && e.message || e) }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleApi(request, env, path) {
  const db = env.DB;
  const method = request.method;
  const id = path.startsWith("/api/presets/") ? decodeURIComponent(path.slice("/api/presets/".length)) : null;

  if (method === "OPTIONS") return new Response(null, { headers: cors() });

  // GET /api/presets — list all
  if (method === "GET" && !id) {
    const { results } = await db.prepare("SELECT body FROM presets ORDER BY updated_at DESC").all();
    const arr = (results || []).map((r) => safeParse(r.body)).filter(Boolean);
    return json(arr);
  }

  // POST /api/presets — create
  if (method === "POST" && !id) {
    const p = await request.json();
    await db.prepare("INSERT OR REPLACE INTO presets (id, kind, name, updated_at, body) VALUES (?,?,?,?,?)")
      .bind(p.id, p.kind || "", p.name || "", p.updatedAt || "", JSON.stringify(p)).run();
    return json(p);
  }

  // PUT /api/presets/:id — update
  if (method === "PUT" && id) {
    const p = await request.json();
    p.id = id;
    await db.prepare("INSERT OR REPLACE INTO presets (id, kind, name, updated_at, body) VALUES (?,?,?,?,?)")
      .bind(id, p.kind || "", p.name || "", p.updatedAt || "", JSON.stringify(p)).run();
    return json(p);
  }

  // DELETE /api/presets/:id
  if (method === "DELETE" && id) {
    await db.prepare("DELETE FROM presets WHERE id = ?").bind(id).run();
    return new Response("ok", { headers: cors() });
  }

  return new Response("Method Not Allowed", { status: 405, headers: cors() });
}

function safeParse(s) { try { return JSON.parse(s); } catch (e) { return null; } }

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: cors({ "Content-Type": "application/json" }),
  });
}

function cors(extra) {
  return Object.assign({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }, extra || {});
}
