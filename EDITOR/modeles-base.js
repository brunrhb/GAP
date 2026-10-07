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
 * safe zone, sizes scale uniformly). To add one: build it in the editor,
 * "+ Modèle", then "↓" to download its .json and paste the `data` object here.
 *
 * The three first ones rebuild the hand-made carousel posts in uploads/
 * (A.png "Call for Mentors", B.png "Seeking…", C.png "Mind the gap"), measured
 * against those images with the real Obviously font. B and C continue each
 * other: the A-pont of THE GAP leaves B on the right and comes back in C on the
 * left. Background: closest built-in one (FOND.3, 140 %, top).
 * ========================================================================== */
window.GAP_MODELES_BASE = [
 {
  "id": "base-gap-call-for-mentors",
  "name": "Call for Mentors — dates + PAIRING IS CARING",
  "data": {
   "v": 2,
   "format": "ig-post",
   "fmtW": 1080,
   "fmtH": 1350,
   "frames": [
    {
     "id": "f1",
     "type": "text",
     "x": 181,
     "y": 179.5,
     "w": 860,
     "h": 364,
     "font": "corps1",
     "fontSize": 151.5,
     "color": "#9da09e",
     "opacity": 100,
     "text": "oct.26\n— june.27",
     "html": "oct.26\n— june.27"
    },
    {
     "id": "f2",
     "type": "text",
     "x": 177,
     "y": 317,
     "w": 860,
     "h": 114,
     "font": "corps3",
     "fontSize": 95,
     "color": "#000000",
     "opacity": 100,
     "text": "Call for Mentors",
     "html": "Call for Mentors"
    },
    {
     "id": "f3",
     "type": "text",
     "x": 126,
     "y": 608.4,
     "w": 900,
     "h": 92,
     "font": "main2",
     "fontSize": 99,
     "color": "#ffffff",
     "opacity": 100,
     "text": "PAIRING",
     "html": "P<span class=\"v2-inline-bridge\" contenteditable=\"false\" data-bridge-id=\"brbase1\" data-pe=\"0.079\" data-size=\"74.25\"><svg width=\"211.005\" height=\"74.25\" viewBox=\"215.854 0 105.033 36.96\" preserveAspectRatio=\"none\" style=\"display:block;color:inherit;overflow:visible;\"><path d=\"M225.434,0 L221.664,15.99 L217.934,29.91 L215.854,36.96 L236.194,36.96 L236.884,30.52 L297.947,30.52 L298.517,36.96 L320.887,36.96 L316.907,23.50 L310.837,0 Z M296.637,21.70 L293.812,8.82 L240.944,8.82 L238.164,21.70 Z\" fill=\"currentColor\" fill-rule=\"evenodd\"></path></svg><span class=\"v2-bridge-ext-handle\"></span></span>IRING"
    },
    {
     "id": "f4",
     "type": "text",
     "x": 126,
     "y": 710.4,
     "w": 900,
     "h": 92,
     "font": "main2",
     "fontSize": 99,
     "color": "#ffffff",
     "opacity": 100,
     "text": "IS CARING",
     "html": "IS C<span class=\"v2-inline-bridge\" contenteditable=\"false\" data-bridge-id=\"brbase2\" data-pe=\"0.079\" data-size=\"74.25\"><svg width=\"211.005\" height=\"74.25\" viewBox=\"215.854 0 105.033 36.96\" preserveAspectRatio=\"none\" style=\"display:block;color:inherit;overflow:visible;\"><path d=\"M225.434,0 L221.664,15.99 L217.934,29.91 L215.854,36.96 L236.194,36.96 L236.884,30.52 L297.947,30.52 L298.517,36.96 L320.887,36.96 L316.907,23.50 L310.837,0 Z M296.637,21.70 L293.812,8.82 L240.944,8.82 L238.164,21.70 Z\" fill=\"currentColor\" fill-rule=\"evenodd\"></path></svg><span class=\"v2-bridge-ext-handle\"></span></span>RING"
    }
   ],
   "bgColor": null,
   "shaderBg": null,
   "auraOn": false,
   "bridgeAnims": {},
   "bgSelected": "fond-03",
   "bgScale": 140,
   "bgRotate": 0,
   "bgPosX": 50,
   "bgPosY": 0
  }
 },
 {
  "id": "base-gap-seeking",
  "name": "Seeking… — texte long + THE GAP",
  "data": {
   "v": 2,
   "format": "ig-post",
   "fmtW": 1080,
   "fmtH": 1350,
   "frames": [
    {
     "id": "f1",
     "type": "text",
     "x": 121,
     "y": 143.3,
     "w": 880,
     "h": 914,
     "font": "corps2",
     "fontSize": 63.5,
     "color": "#ffffff",
     "opacity": 100,
     "text": "Seeking\n\nexperienced\nartists,curators, and\ncultural workers, from\nvisual arts, performing\narts, digital /multimedia\narts, and multidisciplinary\npractices\n\nto support\nemerging artists",
     "html": "Seeking\n\n<b>experienced</b>\n<b>artists</b>,<b>curators</b>, and\n<b>cultural workers</b>, from\n<b>visual arts</b>, <b>performing</b>\n<b>arts</b>, <b>digital /multimedia</b>\n<b>arts</b>, and <b>multidisciplinary</b>\n<b>practices</b>\n\nto <b>support</b>\n<b>emerging artists</b>"
    },
    {
     "id": "f2",
     "type": "text",
     "x": 572,
     "y": 1112,
     "w": 900,
     "h": 66,
     "font": "main1",
     "fontSize": 70,
     "color": "#000000",
     "opacity": 100,
     "text": "THEGA",
     "html": "<span style=\"font-size:0.45em;vertical-align:0.38em;letter-spacing:0.18em\">THE</span>G<span class=\"v2-inline-bridge\" contenteditable=\"false\" data-bridge-id=\"brbase3\" data-pe=\"0.8\" data-size=\"52.5\"><svg width=\"628.849\" height=\"52.5\" viewBox=\"47.023 0 442.710 36.96\" preserveAspectRatio=\"none\" style=\"display:block;color:inherit;overflow:visible;\"><path d=\"M56.603,0 L52.833,15.99 L49.103,29.91 L47.023,36.96 L67.363,36.96 L68.053,30.52 L466.793,30.52 L467.363,36.96 L489.733,36.96 L485.753,23.50 L479.683,0 Z M465.483,21.70 L462.333,8.82 L72.113,8.82 L69.333,21.70 Z\" fill=\"currentColor\" fill-rule=\"evenodd\"></path></svg><span class=\"v2-bridge-ext-handle\"></span></span>"
    }
   ],
   "bgColor": null,
   "shaderBg": null,
   "auraOn": false,
   "bridgeAnims": {},
   "bgSelected": "fond-03",
   "bgScale": 140,
   "bgRotate": 0,
   "bgPosX": 50,
   "bgPosY": 0
  }
 },
 {
  "id": "base-gap-mind-the-gap",
  "name": "Mind the gap — GAP GROUP BXL",
  "data": {
   "v": 2,
   "format": "ig-post",
   "fmtW": 1080,
   "fmtH": 1350,
   "frames": [
    {
     "id": "f1",
     "type": "text",
     "x": 120,
     "y": 295,
     "w": 600,
     "h": 230,
     "font": "corps3",
     "fontSize": 64,
     "color": "#ffffff",
     "opacity": 100,
     "text": "Mind\nthe\ngap",
     "html": "Mind\nthe\ngap"
    },
    {
     "id": "f2",
     "type": "text",
     "x": -394,
     "y": 1110,
     "w": 1300,
     "h": 70,
     "font": "main1",
     "fontSize": 76,
     "color": "#000000",
     "opacity": 100,
     "text": "A P  GROUP BXL",
     "html": "<span class=\"v2-inline-bridge\" contenteditable=\"false\" data-bridge-id=\"brbase4\" data-pe=\"0.685\" data-size=\"57\"><svg width=\"599.723\" height=\"57\" viewBox=\"73.940 0 388.873 36.96\" preserveAspectRatio=\"none\" style=\"display:block;color:inherit;overflow:visible;\"><path d=\"M83.520,0 L79.750,15.99 L76.020,29.91 L73.940,36.96 L94.280,36.96 L94.970,30.52 L439.873,30.52 L440.443,36.96 L462.813,36.96 L458.833,23.50 L452.763,0 Z M438.563,21.70 L435.465,8.82 L99.030,8.82 L96.250,21.70 Z\" fill=\"currentColor\" fill-rule=\"evenodd\"></path></svg><span class=\"v2-bridge-ext-handle\"></span></span> P  GROUP<span style=\"font-size:0.45em;vertical-align:0.38em;letter-spacing:0.18em\"> BXL</span>"
    }
   ],
   "bgColor": null,
   "shaderBg": null,
   "auraOn": false,
   "bridgeAnims": {},
   "bgSelected": "fond-03",
   "bgScale": 140,
   "bgRotate": 0,
   "bgPosX": 50,
   "bgPosY": 0
  }
 }
];
