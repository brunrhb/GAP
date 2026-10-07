/* ============================================================================
 * GAP — PresetStore
 * ----------------------------------------------------------------------------
 * Single drop-in module for saving / loading / sharing presets.
 *
 * HOW TO USE
 *   1. Drop this file in your site root (next to your editor HTML).
 *   2. Load it once:  <script src="preset-store.js"></script>
 *      (or  import { PresetStore } from './preset-store.js'  as an ES module)
 *   3. Call the async API — it returns Promises so the SAME code works whether
 *      the data lives in localStorage or on your server.
 *
 *        await GAP.PresetStore.list('animmix');
 *        await GAP.PresetStore.save({ kind:'animmix', name:'GAP 2', data:{...} });
 *        await GAP.PresetStore.remove(id);
 *
 * WHERE PRESETS LIVE
 *   API_URL = "/api/presets" → shared library (Cloudflare Worker + D1, see
 *   worker.js). When that library cannot be reached (Live Server / localhost,
 *   offline, D1 table missing…), presets are kept in THIS browser
 *   (localStorage) instead of failing, and flagged `local: true`. They are
 *   listed together with the shared ones and can be sent to the server later
 *   with `push(id)`.
 *   `status` tells the UI where the last operation went: "serveur" | "local".
 *
 * TEAM KEY (optional)
 *   If the Worker has a GAP_WRITE_KEY secret, writes need the header
 *   X-GAP-Key. A 401 is thrown as an Error with `status = 401`; the editor
 *   then asks for the key once and stores it with setTeamKey().
 * ========================================================================== */

(function (global) {
  "use strict";

  const SCHEMA_VERSION = 1;
  const STORAGE_KEY = "gap_presets_v1";
  const KEY_STORAGE = "gap_team_key";

  // ── helpers ───────────────────────────────────────────────────────────────
  function uid() {
    return "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }
  function now() { return new Date().toISOString(); }
  function teamKey() { try { return global.localStorage.getItem(KEY_STORAGE) || ""; } catch (e) { return ""; } }

  // Normalise + validate a preset before it is stored.
  function normalize(preset) {
    if (!preset || typeof preset !== "object") throw new Error("Preset invalide");
    if (!preset.name || !String(preset.name).trim()) throw new Error("Le preset doit avoir un nom");
    return {
      id: preset.id || uid(),
      version: SCHEMA_VERSION,
      kind: preset.kind || "animmix",          // 'animmix' | 'dessous' | 'template' | ...
      name: String(preset.name).trim(),
      author: preset.author || "",
      createdAt: preset.createdAt || now(),
      updatedAt: now(),
      data: preset.data || {},                 // free-form payload, owned by the editor
    };
  }
  function strip(p) { const o = Object.assign({}, p); delete o.local; return o; }

  // ── localStorage backend ──────────────────────────────────────────────────
  const localBackend = {
    async all() {
      try {
        const raw = global.localStorage.getItem(STORAGE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch (e) { return []; }
    },
    async writeAll(arr) {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    },
    async upsert(p) {
      const all = await this.all();
      const i = all.findIndex((x) => x.id === p.id);
      if (i >= 0) all[i] = p; else all.unshift(p);
      await this.writeAll(all);
      return p;
    },
    async destroy(id) {
      const all = await this.all();
      await this.writeAll(all.filter((p) => p.id !== id));
    },
  };

  // ── same-origin server backend (Cloudflare Worker + D1) ───────────────────
  // Each preset is its own row, so simultaneous saves never clobber each other.
  function httpBackend(baseUrl) {
    const headers = (extra) => {
      const h = Object.assign({ "Accept": "application/json" }, extra || {});
      const k = teamKey();
      if (k) h["X-GAP-Key"] = k;
      return h;
    };
    const fail = (r, t) => { const e = new Error(r.status + " " + (t || "").slice(0, 200)); e.status = r.status; throw e; };
    const json = (r) => {
      if (!r.ok) return r.text().then((t) => fail(r, t));
      const ct = r.headers.get("content-type") || "";
      if (ct.indexOf("json") < 0) return r.text().then((t) => fail({ status: 502 }, "réponse non JSON"));
      return r.json();
    };
    return {
      async all() {
        const arr = await fetch(baseUrl, { headers: headers() }).then(json);
        if (!Array.isArray(arr)) throw new Error("réponse inattendue");
        return arr;
      },
      async create(p) {
        return fetch(baseUrl, { method: "POST", headers: headers({ "Content-Type": "application/json" }), body: JSON.stringify(p) }).then(json);
      },
      async update(p) {
        return fetch(baseUrl + "/" + encodeURIComponent(p.id), { method: "PUT", headers: headers({ "Content-Type": "application/json" }), body: JSON.stringify(p) }).then(json);
      },
      async destroy(id) {
        const r = await fetch(baseUrl + "/" + encodeURIComponent(id), { method: "DELETE", headers: headers() });
        if (!r.ok) fail(r, await r.text());
      },
    };
  }

  // ── CONFIGURE HERE ─────────────────────────────────────────────────────────
  // API_URL = null   → presets in THIS browser only (localStorage).
  // API_URL = "/api/presets" → shared library via your Cloudflare Worker + D1,
  //   with this browser as a fallback when the server is unreachable.
  const API_URL = "/api/presets";

  const server = API_URL ? httpBackend(API_URL) : null;
  let status = server ? "" : "local";

  // run a server call; any network / HTTP failure except 401 (wrong key) → null
  async function tryServer(fn) {
    if (!server) return { ok: false };
    try {
      const r = await fn();
      status = "serveur";
      return { ok: true, r };
    } catch (e) {
      if (e && e.status === 401) throw e;
      status = "local";
      return { ok: false, e };
    }
  }

  // ── public API ────────────────────────────────────────────────────────────
  const PresetStore = {
    SCHEMA_VERSION,
    get status() { return status; },
    setTeamKey(k) { try { global.localStorage.setItem(KEY_STORAGE, k || ""); } catch (e) {} },

    /** List presets (shared + this browser), optionally filtered by kind. Newest first. */
    async list(kind) {
      const local = (await localBackend.all()).map((p) => Object.assign({}, p, { local: true }));
      const res = await tryServer(() => server.all());
      const remote = res.ok ? res.r : [];
      // same id on both sides (edited while offline): keep the most recent version
      const byId = new Map();
      remote.concat(local).forEach((p) => {
        const cur = byId.get(p.id);
        if (!cur || (p.updatedAt || "") > (cur.updatedAt || "")) byId.set(p.id, p);
      });
      const all = Array.from(byId.values());
      const items = kind ? all.filter((p) => p.kind === kind) : all;
      return items.slice().sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    },

    /** Get one preset by id (or null). */
    async get(id) {
      const all = await this.list();
      return all.find((p) => p.id === id) || null;
    },

    /** Create or update a preset. Returns the stored preset (with id/timestamps).
     *  Server first; if the server is unreachable the preset is kept in this
     *  browser and returned with `local: true`. */
    async save(preset) {
      const p = normalize(preset);
      if (!preset.local) {
        const res = await tryServer(() => (preset.id ? server.update(p) : server.create(p)));
        if (res.ok) return res.r;
      }
      await localBackend.upsert(p);
      return Object.assign({}, p, { local: true });
    },

    /** Delete a preset by id (isLocal: it lives in this browser). */
    async remove(id, isLocal) {
      if (isLocal || !server) return localBackend.destroy(id);
      const res = await tryServer(() => server.destroy(id));
      if (!res.ok) throw new Error("serveur injoignable — rien n'a été supprimé");
    },

    /** Send a preset kept in this browser to the shared library. true if it worked. */
    async push(id) {
      const p = (await localBackend.all()).find((x) => x.id === id);
      if (!p) return false;
      const res = await tryServer(() => server.create(strip(p)));
      if (!res.ok) return false;
      await localBackend.destroy(id);
      return true;
    },

    // ── sharing helpers (work with any backend) ──────────────────────────────

    /** Serialize a preset to a shareable JSON string (for download / paste). */
    exportString(preset) {
      const p = normalize(strip(preset));
      return JSON.stringify(p, null, 2);
    },

    /** Trigger a .json file download for a preset. */
    download(preset) {
      const p = normalize(strip(preset));
      const blob = new Blob([this.exportString(p)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gap-preset-" + p.name.replace(/[^a-z0-9]/gi, "-").toLowerCase() + ".json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    },

    /** Parse a JSON string (or object) and save it as a new preset (fresh id). */
    async importFrom(jsonOrString) {
      const obj = typeof jsonOrString === "string" ? JSON.parse(jsonOrString) : jsonOrString;
      return this.save(Object.assign({}, strip(obj), { id: undefined }));   // new id so imports never clash
    },

    /** Encode a preset into a URL-hash fragment for link sharing. */
    toHash(preset) {
      const p = normalize(strip(preset));
      return "#preset=" + encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(p)))));
    },

    /** Read a preset from the current URL hash, if any (returns preset or null). */
    fromHash(hash) {
      const h = hash || (global.location && global.location.hash) || "";
      const m = h.match(/preset=([^&]+)/);
      if (!m) return null;
      try { return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1]))))); }
      catch (e) { return null; }
    },
  };

  // expose both as a global (GAP.PresetStore) and as a module export
  global.GAP = global.GAP || {};
  global.GAP.PresetStore = PresetStore;
  if (typeof module !== "undefined" && module.exports) module.exports = { PresetStore };

})(typeof window !== "undefined" ? window : this);
