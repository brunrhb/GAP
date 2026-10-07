/* ============================================================================
 * GAP — Récupérer les modèles enregistrés avec l'ancien éditeur
 * ----------------------------------------------------------------------------
 * Avant octobre 2026, « + Modèle » enregistrait les modèles DANS LE NAVIGATEUR
 * (localStorage) de la page où l'éditeur tournait — par exemple l'aperçu de
 * l'éditeur dans Claude Design — et en px d'écran (ils dépendaient de la taille
 * de la fenêtre). Ce script les sort de là et les convertit au format v2
 * (px natifs du format), prêts pour le nouvel éditeur.
 *
 * MODE D'EMPLOI
 *   1. Ouvre l'éditeur là où tu as fait tes modèles, dans le même navigateur
 *      (Claude Design → projet EDITOR → aperçu ; ou le site ; ou Live Server),
 *      avec la même taille de fenêtre / de panneau qu'à l'époque si possible.
 *   2. Ouvre la console (clic droit → Inspecter → onglet Console).
 *      Dans Claude Design, l'éditeur est dans une iframe : en haut de la
 *      console, menu « top » → choisis l'iframe de l'aperçu.
 *   3. Colle tout ce fichier, Entrée.
 *   4. Un fichier « gap-modeles-recuperes.json » se télécharge.
 *      Dans le nouvel éditeur : Modèles → « Importer un fichier .json ».
 *
 * La conversion utilise la taille de la zone de travail de la page où tu lances
 * le script (= celle des modèles si tu ne l'as pas changée). Le résultat est
 * aussi affiché dans la console.
 * ========================================================================== */
(() => {
  const FORMATS = {
    "ig-post": [1080, 1350], "ig-square": [1080, 1080], "ig-story": [1080, 1920],
    "li-post": [1200, 628], "li-portrait": [1080, 1350], "affiche-a4": [2480, 3508],
    "affiche-a3": [3508, 4961], "affiche-land": [4961, 3508], "carre-40": [4000, 4000],
  };
  let items = [];
  try { items = JSON.parse(localStorage.getItem("gap_presets_v1") || "[]"); } catch (e) {}
  const tpls = (Array.isArray(items) ? items : []).filter((p) => p && p.kind === "template");
  if (!tpls.length) {
    console.warn("[GAP] Aucun modèle dans ce navigateur pour cette page (" + location.origin + ").");
    return;
  }
  // canvas area of the editor (the grey zone around the page) — where v1 coordinates live
  const area = document.querySelector(".v2-canvas-area");
  const cw = area ? area.clientWidth : Math.max(300, innerWidth - 220);
  const ch = area ? area.clientHeight : Math.max(300, innerHeight - 49);
  const layout = (w, h) => {
    const s = Math.max(0.02, Math.min((cw - 96) / w, (ch - 96) / h, 1));
    return { x: (cw - w * s) / 2, y: (ch - h * s) / 2, s };
  };
  const r2 = (v) => Math.round(v * 100) / 100;
  const scaleBridges = (html, k) => {
    if (!html || html.indexOf("v2-inline-bridge") < 0) return html;
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    tmp.querySelectorAll(".v2-inline-bridge").forEach((b) => {
      const sz = parseFloat(b.dataset.size);
      if (sz) b.dataset.size = String(r2(sz * k));
      const svg = b.querySelector("svg");
      if (svg) ["width", "height"].forEach((a) => { const v = parseFloat(svg.getAttribute(a)); if (v) svg.setAttribute(a, String(r2(v * k))); });
    });
    return tmp.innerHTML;
  };
  const out = tpls.map((p) => {
    const d = p.data || {};
    if (d.v >= 2) return p;                                  // already native px
    const [W, H] = FORMATS[d.format] || FORMATS["ig-post"];
    const L = layout(W, H);
    const frames = (d.frames || []).map((f) => {
      const q = { ...f, x: r2(((f.x || 0) - L.x) / L.s), y: r2(((f.y || 0) - L.y) / L.s) };
      if (f.type === "a-bridge") { q.size = r2((f.size || 90) / L.s); return q; }
      q.w = r2((f.w || 300) / L.s); q.h = r2((f.h || 100) / L.s); q.fontSize = r2((f.fontSize || 16) / L.s);
      if (f.html) q.html = scaleBridges(f.html, 1 / L.s);
      return q;
    });
    return { ...p, data: { ...d, v: 2, format: d.format || "ig-post", fmtW: W, fmtH: H, frames,
                           recupere: { depuis: location.origin, zone: [cw, ch], le: new Date().toISOString() } } };
  });
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "gap-modeles-recuperes.json";
  a.click();
  console.log("[GAP] " + out.length + " modèle(s) converti(s) (zone " + cw + "×" + ch + ") :", out.map((p) => p.name));
  return out;
})();
