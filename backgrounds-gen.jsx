#target photoshop
// ─────────────────────────────────────────────────────────────
// GAP — Background Variations Generator v2
// Compatible Cloud Documents (.psdc) — sans snapshots
// Restauration par transform inverse exact (ordre inversé)
// ─────────────────────────────────────────────────────────────

var doc = app.activeDocument;

// Dossier d'export
var exportFolder = new Folder(Folder.desktop + "/BACKGROUNDS");
if (!exportFolder.exists) exportFolder.create();

// ── Trouver le groupe LIGHTES ────────────────────────────────
// La couche LIGHTES doit être sélectionnée dans le panneau avant de lancer
var group;
if (doc.activeLayer.typename === "LayerSet") {
    group = doc.activeLayer;
} else {
    for (var i = 0; i < doc.layers.length; i++) {
        if (doc.layers[i].typename === "LayerSet" && doc.layers[i].name === "LIGHTES") {
            group = doc.layers[i];
            break;
        }
    }
}
if (!group) {
    alert("Groupe LIGHTES introuvable.\nSélectionne le groupe LIGHTES dans le panneau Calques avant de relancer.");
}

// ── Export PNG (as copy) ─────────────────────────────────────
function exportPNG(filename) {
    var file = new File(exportFolder + "/" + filename + ".png");
    var opts = new PNGSaveOptions();
    opts.interlaced = false;
    doc.saveAs(file, opts, true);
}

function pad(n) { return n < 10 ? "0" + n : "" + n; }

// ── Variations : [scale%, dx(px), dy(px), angle(deg), suffix] ─
var V = [

    // ── S : small, contenu (50-65%) ─────────────────────────
    [ 55,    0,    0,    0,  "S.center.0"         ],
    [ 55,    0,    0,   22,  "S.center.22"        ],
    [ 55,    0,    0,  -28,  "S.center.m28"       ],
    [ 62, -180, -280,   12,  "S.topleft.12"       ],
    [ 60,  190, -260,  -18,  "S.topright.m18"     ],

    // ── M : medium, ancré (80-100%) ─────────────────────────
    [ 88,    0, -260,    0,  "M.top.0"            ],
    [ 90,  290,    0,   25,  "M.right.25"         ],
    [ 85, -270,  240,  -15,  "M.bottomleft.m15"   ],
    [ 95,    0,  310,    0,  "M.bottom.0"         ],
    [ 82,  230, -190,   38,  "M.topright.38"      ],
    [ 90, -290,    0,  -22,  "M.left.m22"         ],

    // ── L : large, débordement partiel (130-165%) ───────────
    [135,    0, -480,    0,  "L.top.0"            ],
    [145,  430,    0,   18,  "L.right.18"         ],
    [135, -410,  140,  -14,  "L.left.m14"         ],
    [155,    0,  480,   22,  "L.bottom.22"        ],
    [140,  310, -360,  -38,  "L.topright.m38"     ],
    [140, -310,  360,   30,  "L.bottomleft.30"    ],
    [150,    0,    0,   48,  "L.center.48"        ],

    // ── XL : champ de couleur (190-230%) ────────────────────
    [200, -500, -430,    0,  "XL.topleft.0"       ],
    [200,  500, -330,   22,  "XL.topright.22"     ],
    [220,    0, -560,   52,  "XL.top.52"          ],
    [200, -630,  190,  -32,  "XL.left.m32"        ],
    [200,  630,  190,   32,  "XL.right.32"        ],
    [220,    0,  560,    0,  "XL.bottom.0"        ],
    [200, -410,  500,   20,  "XL.bottomleft.20"   ],
    [200,  410,  500,  -20,  "XL.bottomright.m20" ],

    // ── XXL : hors-champ, suggestion (260-320%) ─────────────
    [280, -720, -530,    0,  "XXL.topleft.0"      ],
    [310,    0, -680,   68,  "XXL.top.68"         ],
    [280,  720, -430,  -50,  "XXL.topright.m50"   ],
    [280, -820,    0,   34,  "XXL.left.34"        ],
    [280,  820,  340,  -24,  "XXL.right.m24"      ],

];

// ── Run ──────────────────────────────────────────────────────
for (var i = 0; i < V.length; i++) {
    var v   = V[i];
    var sc  = v[0], dx = v[1], dy = v[2], ang = v[3], sfx = v[4];
    var fname = "FOND." + pad(i + 1) + "." + sfx;

    doc.activeLayer = group;

    // → Transforms (scale → rotate → translate)
    group.resize(sc, sc, AnchorPosition.MIDDLECENTER);
    if (ang !== 0)            group.rotate(ang, AnchorPosition.MIDDLECENTER);
    if (dx !== 0 || dy !== 0) group.translate(dx, dy);

    // Export
    exportPNG(fname);

    // ← Restore : exact inverse, ordre inversé
    if (dx !== 0 || dy !== 0) group.translate(-dx, -dy);
    if (ang !== 0)            group.rotate(-ang, AnchorPosition.MIDDLECENTER);
    group.resize(100 / sc * 100, 100 / sc * 100, AnchorPosition.MIDDLECENTER);
}

alert("Done ! " + V.length + " PNGs exportés → Desktop/BACKGROUNDS/");
