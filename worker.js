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
 *   3. The table is created automatically on the first API call
 *      (CREATE TABLE IF NOT EXISTS below). To create it by hand instead, run in
 *      the D1 "Console" tab:
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
 *
 * OPTIONAL — TEAM KEY FOR WRITES
 *   Without it anyone who finds the URL can add or delete presets. To require a
 *   key for POST / PUT / DELETE (reading stays open):
 *     npx wrangler secret put GAP_WRITE_KEY      (or Dashboard → Worker →
 *     Settings → Variables and Secrets → add a Secret named GAP_WRITE_KEY)
 *   The editor asks for the key once (header X-GAP-Key) and remembers it.
 * ========================================================================== */

const MAX_BODY = 1800000;   // bytes — D1 rows are limited to ~2 MB

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

// the table is created once per Worker instance, the first time the API is used
let tableReady = null;
function ensureTable(db) {
  if (!tableReady) {
    tableReady = db.prepare(
      "CREATE TABLE IF NOT EXISTS presets (id TEXT PRIMARY KEY, kind TEXT, name TEXT, updated_at TEXT, body TEXT)"
    ).run().catch((e) => { tableReady = null; throw e; });
  }
  return tableReady;
}

async function readPreset(request) {
  const text = await request.text();
  if (text.length > MAX_BODY) {
    const e = new Error("preset trop lourd (" + Math.round(text.length / 1024) + " ko)");
    e.status = 413;
    throw e;
  }
  const p = JSON.parse(text);
  if (!p || typeof p !== "object") throw new Error("preset invalide");
  return p;
}

async function handleApi(request, env, path) {
  const db = env.DB;
  const method = request.method;
  const id = path.startsWith("/api/presets/") ? decodeURIComponent(path.slice("/api/presets/".length)) : null;

  if (method === "OPTIONS") return new Response(null, { headers: cors() });

  // optional team key for every write
  if (env.GAP_WRITE_KEY && method !== "GET" && request.headers.get("X-GAP-Key") !== env.GAP_WRITE_KEY) {
    return json({ error: "clé d'équipe requise" }, 401);
  }

  await ensureTable(db);

  // GET /api/presets — list all
  if (method === "GET" && !id) {
    const { results } = await db.prepare("SELECT body FROM presets ORDER BY updated_at DESC").all();
    const arr = (results || []).map((r) => safeParse(r.body)).filter(Boolean);
    return json(arr);
  }

  // POST /api/presets — create
  if (method === "POST" && !id) {
    let p;
    try { p = await readPreset(request); } catch (e) { return json({ error: e.message }, e.status || 400); }
    if (!p.id) p.id = "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    await db.prepare("INSERT OR REPLACE INTO presets (id, kind, name, updated_at, body) VALUES (?,?,?,?,?)")
      .bind(p.id, p.kind || "", p.name || "", p.updatedAt || "", JSON.stringify(p)).run();
    return json(p);
  }

  // PUT /api/presets/:id — update
  if (method === "PUT" && id) {
    let p;
    try { p = await readPreset(request); } catch (e) { return json({ error: e.message }, e.status || 400); }
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
    "Access-Control-Allow-Headers": "Content-Type, X-GAP-Key",
  }, extra || {});
}
