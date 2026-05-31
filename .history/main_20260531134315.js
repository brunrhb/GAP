/* ─────────────────────────────────────────────────────────
   AnimatedA — une instance par lettre A animée
   ───────────────────────────────────────────────────────── */

class AnimatedA {
  constructor(span) {
    this.id     = span.dataset.aId || null;
    this.noWrap = span.hasAttribute('data-no-wrap');
    this.pMax   = 1;
    this.tl     = null;
    this.obj    = { p: 0 };

    const ns  = 'http://www.w3.org/2000/svg';
    this.svg  = document.createElementNS(ns, 'svg');
    this.path = document.createElementNS(ns, 'path');
    this.path.setAttribute('fill-rule', 'evenodd');
    this.path.setAttribute('fill', 'currentColor');
    this.svg.appendChild(this.path);

    Object.assign(this.svg.style, {
      display      : 'inline-block',
      height       : '1cap',
      width        : 'auto',
      verticalAlign: 'baseline',
      overflow     : 'visible'
    });

    this.apply(0);
    span.replaceWith(this.svg);
  }

  buildPath(p) {
    const pc = Math.min(p, this.pMax);
    const r  = pc * 468.15;
    const ri = pc * 467.70;
    const xo = 234.065 * (1 - pc);
    const f  = v => (xo + v).toFixed(3);
    const g  = v => (xo + v + r).toFixed(3);
    const gi = v => (xo + v + ri).toFixed(3);
    return (
      `M${f(9.79)},0 L${f(6.02)},15.99 L${f(2.29)},29.91 ` +
      `L${f(0.21)},36.96 L${f(20.55)},36.96 L${f(21.24)},30.52 ` +
      `L${g(45.46)},30.52 L${g(46.03)},36.96 L${g(68.40)},36.96 ` +
      `L${g(64.42)},23.50 L${g(58.35)},0 Z ` +
      `M${g(44.15)},21.70 L${gi(41.36)},8.82 ` +
      `L${f(25.30)},8.82 L${f(22.52)},21.70 Z`
    );
  }

  apply(p) {
    const pc   = Math.min(p, this.pMax);
    const r    = pc * 468.15;
    const xo   = 234.065 * (1 - pc);
    const xMin = xo + 0.21;
    const xMax = xo + 68.40 + r;
    this.svg.setAttribute('viewBox',
      `${xMin.toFixed(3)} 0 ${(xMax - xMin).toFixed(3)} 36.96`);
    this.path.setAttribute('d', this.buildPath(p));
  }

  /* ── pMax : minimum des deux contraintes ──────────────────
     1. Largeur disponible sur la ligne (avant + après)
     2. Hard limit : bord droit du A ≤ 75vw depuis viewport 0
     ─────────────────────────────────────────────────────── */
  measurePMax() {
    if (!this.noWrap) return;

    const prevP = this.obj.p;
    this.apply(0); // mesure toujours depuis l'état A (p=0)

    const lineEl     = this.svg.closest('.line') || this.svg.parentElement;
    const lineParent = lineEl.parentElement;
    const svgRect    = this.svg.getBoundingClientRect();
    const availWidth = parseFloat(getComputedStyle(lineParent).width);

    let wA = svgRect.width;
    if (!availWidth || !wA) { this.apply(prevP); return; }

    const wBar = wA * (536.32 / 68.19); // ratio géométrique exact

    // Texte AVANT le A
    let beforeW = 0;
    let node = this.svg.previousSibling;
    while (node) {
      if (node.nodeType === 3 && node.textContent.trim()) {
        const r = document.createRange();
        r.selectNodeContents(node);
        const b = r.getBoundingClientRect();
        if (b.width > 0) beforeW += b.width;
      } else if (node.nodeType === 1) {
        const b = node.getBoundingClientRect();
        if (b.width > 0) beforeW += b.width;
      }
      node = node.previousSibling;
    }

    // Texte APRÈS le A
    let afterW = 0;
    node = this.svg.nextSibling;
    while (node) {
      if (node.nodeType === 3 && node.textContent.trim()) {
        const r = document.createRange();
        r.selectNodeContents(node);
        const b = r.getBoundingClientRect();
        if (b.width > 0) afterW += b.width;
      } else if (node.nodeType === 1) {
        const b = node.getBoundingClientRect();
        if (b.width > 0) afterW += b.width;
      }
      node = node.nextSibling;
    }

    // Contrainte 1 — ligne parente
    const pMaxLine = (availWidth - beforeW - afterW - wA) / (wBar - wA);

    // Contrainte 2 — 75vw hard limit depuis le bord gauche viewport
    const limit75  = window.innerWidth * 0.75;
    const pMax75vw = (limit75 - svgRect.left - wA) / (wBar - wA);

    this.pMax = Math.max(0, Math.min(1, pMaxLine, pMax75vw));
    this.apply(prevP);
  }
}

/* ─────────────────────────────────────────────────────────
   AController
   Mode tiré au hasard à chaque chargement :
     • Option 1 : séquence cycle GAP → PAIRING ↔ CARING
     • Option 2 : 1 seul à la fois, choix aléatoire
   ───────────────────────────────────────────────────────── */

class AController {
  constructor() {
    this.pool      = [];
    this.masterTl  = null; // option 1
    this.currentTl = null; // option 2
    this.running   = false;
    this.lastPick  = null;
    this.mode      = Math.random() < 0.5 ? 1 : 2;
  }

  init() {
    document.fonts.ready.then(() => {
      requestAnimationFrame(() => {
        document.querySelectorAll('[data-a-anim]').forEach(span =>
          this.pool.push(new AnimatedA(span))
        );
        requestAnimationFrame(() => {
          this.pool.forEach(i => i.measurePMax());

          if (this.mode === 1) {
            this._startCycle();
          } else {
            this.running = true;
            this._runRandom();
          }

          new ResizeObserver(() => {
            const p1 = this.masterTl?.paused() ?? true;
            const p2 = this.currentTl?.paused() ?? true;
            this.masterTl?.pause();
            this.currentTl?.pause();
            this.pool.forEach(i => i.measurePMax());
            if (!p1) this.masterTl?.resume();
            if (!p2) this.currentTl?.resume();
          }).observe(document.body);
        });
      });
    });
  }

  /* ── Option 1 : séquence cyclique ─────────────────────── */
  _startCycle() {
    const gap     = this.pool.find(i => i.id === 'gap');
    const pairing = this.pool.find(i => i.id === 'pairing');
    const caring  = this.pool.find(i => i.id === 'caring');
    if (!gap || !pairing || !caring) return;

    const go  = gap.obj;
    const po  = pairing.obj;
    const co  = caring.obj;
    const D   = 4.0;              // durée d'extension (secondes)
    const E   = 'sine.inOut';     // easing fluide, aucune rupture de vélocité

    this.masterTl = gsap.timeline({ repeat: -1, delay: 1.5 })

      // — GAP aller-retour complet —
      .to(go, { p:1, duration:D, ease:E, onUpdate: () => gap.apply(go.p) })
      .to(go, { p:0, duration:D, ease:E, onUpdate: () => gap.apply(go.p) })
      .to({}, { duration: 0.7 })

      // — PAIRING s'étend —
      .to(po, { p:1, duration:D, ease:E, onUpdate: () => pairing.apply(po.p) })

      // — PAIRING revient + CARING s'étend simultanément —
      // (quand PAIRING commence à revenir, CARING démarre)
      .to(po, { p:0, duration:D, ease:E, onUpdate: () => pairing.apply(po.p) })
      .to(co, { p:1, duration:D, ease:E, onUpdate: () => caring.apply(co.p) }, '<')

      // — CARING revient (PAIRING est déjà à 0, il reste là) —
      .to(co, { p:0, duration:D, ease:E, onUpdate: () => caring.apply(co.p) })

      // — Respiration avant le prochain cycle —
      .to({}, { duration: 1.2 });

    // Même tl pour tous → toggleAll déduplique via Set
    gap.tl = pairing.tl = caring.tl = this.masterTl;
  }

  /* ── Option 2 : 1 à la fois, aléatoire ────────────────── */
  _runRandom() {
    if (!this.running) return;

    // Évite deux fois de suite le même A
    const candidates = this.pool.length > 1
      ? this.pool.filter(i => i !== this.lastPick)
      : this.pool;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    this.lastPick = pick;

    const obj = pick.obj;
    const D   = 4.0;
    const E   = 'sine.inOut';

    this.currentTl = gsap.timeline({
      delay     : this.currentTl ? 0.7 : 1.5, // pause initiale vs inter-pick
      onComplete: () => this._runRandom()
    })
      .to(obj, { p:1, duration:D, ease:E, onUpdate: () => pick.apply(obj.p) })
      .to(obj, { p:0, duration:D, ease:E, onUpdate: () => pick.apply(obj.p) });

    pick.tl = this.currentTl;
  }

  /* ── Contrôle ─────────────────────────────────────────── */
  toggleAll() {
    // Set déduplique si plusieurs instances partagent la même tl
    const tls = new Set(this.pool.map(i => i.tl).filter(Boolean));
    tls.forEach(tl => tl.paused() ? tl.resume() : tl.pause());
  }

  seekAll(p) { this.pool.forEach(i => i.apply(p)); }
}

/* ── Init ── */
const ctrl = new AController();
ctrl.init();

document.addEventListener('click', () => ctrl.toggleAll());