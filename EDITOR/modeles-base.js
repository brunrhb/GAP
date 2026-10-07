/* ============================================================================
 * GAP — Modèles de base (read-only, shipped with the editor)
 * ----------------------------------------------------------------------------
 * Listed first in the "Modèles" panel; applying one replaces the composition
 * (⌘Z / ↶ to go back). They cannot be deleted from the editor — edit this file.
 *
 * Format v2 — everything in NATIVE px of the format (1080×1350 for an IG post…):
 *   {
 *     id: "base-…", name: "…",
 *     data: {
 *       v: 2, format: "ig-post", fmtW: 1080, fmtH: 1350,
 *       frames: [ { id, x, y, w, h, font: "main1"|"main2"|"corps1"|"corps2"|"corps3",
 *                   fontSize, color, opacity, text, html }, … ],
 *       bgColor, bgSelected (id from BUILT_IN_BG), bgScale, bgRotate, bgPosX, bgPosY,
 *       shaderBg, auraOn, bridgeAnims: { bridgeId: { animate, pe0, pe1, dur } }
 *     }
 *   }
 * A template opened in another format is mapped onto it (positions follow the
 * page, sizes scale uniformly). To add one: build it in the editor, "+ Modèle",
 * then "↓" to download its .json and paste the `data` object here.
 * ========================================================================== */
window.GAP_MODELES_BASE = [];
