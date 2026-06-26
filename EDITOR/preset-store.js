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
 *      the data lives in localStorage (now) or on your server (later).
 *
 *        await GAP.PresetStore.list('animmix');
 *        await GAP.PresetStore.save({ kind:'animmix', name:'GAP 2', data:{...} });
 *        await GAP.PresetStore.remove(id);
 *
 * SWAPPING TO YOUR SERVER
 *   Everything talks to one private backend object: `backend`.
 *   Today it is `localBackend` (browser localStorage).
 *   When your site has a domain + API, replace `const backend = localBackend;`
 *   with `const backend = httpBackend('/api/presets');` (a ready-made stub is
 *   included at the bottom). NOTHING ELSE in your app needs to change.
 * ========================================================================== */

(function (global) {
  "use strict";

  const SCHEMA_VERSION = 1;
  const STORAGE_KEY = "gap_presets_v1";

  // ── helpers ───────────────────────────────────────────────────────────────
  function uid() {
    return "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }
  function now() { return new Date().toISOString(); }

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

  // ── localStorage backend (default) ────────────────────────────────────────
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
  };

  // ── ready-made HTTP backend (use this once your server exists) ────────────
  //   const backend = httpBackend('/api/presets');
  function httpBackend(baseUrl) {
    const json = (r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); };
    return {
      async all() { return fetch(baseUrl, { credentials: "include" }).then(json); },
      async writeAll() { throw new Error("httpBackend uses per-item routes; see PresetStore.save/remove notes"); },
      // Per-item routes — PresetStore.save/remove will prefer these if present:
      async create(p) { return fetch(baseUrl, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) }).then(json); },
      async update(p) { return fetch(baseUrl + "/" + encodeURIComponent(p.id), { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) }).then(json); },
      async destroy(id) { return fetch(baseUrl + "/" + encodeURIComponent(id), { method: "DELETE", credentials: "include" }).then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); }); },
    };
  }

  // ── pick your backend HERE ──────────────────────────────────────────────
  // Leave API_URL = null while there is no server → presets live in this
  // browser (localStorage). The day the site is deployed, set API_URL to your
  // endpoint (e.g. "/api/presets" or "https://api.gap.xyz/presets") and the
  // library becomes SHARED across the whole team automatically — no files to
  // exchange, nothing to drop in the root. That single line is the only change.
  const API_URL = null;
  const backend = API_URL ? httpBackend(API_URL) : localBackend;

  // ── public API ────────────────────────────────────────────────────────────
  const PresetStore = {
    SCHEMA_VERSION,

    /** List presets, optionally filtered by kind. Newest first. */
    async list(kind) {
      const all = await backend.all();
      const items = kind ? all.filter((p) => p.kind === kind) : all;
      return items.slice().sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    },

    /** Get one preset by id (or null). */
    async get(id) {
      const all = await backend.all();
      return all.find((p) => p.id === id) || null;
    },

    /** Create or update a preset. Returns the stored preset (with id/timestamps). */
    async save(preset) {
      const p = normalize(preset);
      // server backend with per-item routes
      if (backend.create && backend.update) {
        return preset.id ? backend.update(p) : backend.create(p);
      }
      const all = await backend.all();
      const i = all.findIndex((x) => x.id === p.id);
      if (i >= 0) all[i] = p; else all.unshift(p);
      await backend.writeAll(all);
      return p;
    },

    /** Delete a preset by id. */
    async remove(id) {
      if (backend.destroy) return backend.destroy(id);
      const all = await backend.all();
      await backend.writeAll(all.filter((p) => p.id !== id));
    },

    // ── sharing helpers (work with any backend) ──────────────────────────────

    /** Serialize a preset to a shareable JSON string (for download / paste). */
    exportString(preset) {
      const p = normalize(preset);
      return JSON.stringify(p, null, 2);
    },

    /** Trigger a .json file download for a preset. */
    download(preset) {
      const p = normalize(preset);
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
      return this.save({ ...obj, id: undefined });   // new id so imports never clash
    },

    /** Encode a preset into a URL-hash fragment for link sharing. */
    toHash(preset) {
      const p = normalize(preset);
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
