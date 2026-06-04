/* ── AnimatedA ────────────────────────────────────────────
   data-dir="-1" → scaleX(-1) sur le SVG
   Le A s'étire VERS LA GAUCHE (PAIRING, text-align:right)
   La contrainte pMax vient de la largeur du bloc parent
   ───────────────────────────────────────────────────────── */

class AnimatedA {
  constructor(span) {
    this.id     = span.dataset.aId || null;
    this.noWrap = span.hasAttribute('data-no-wrap');
    this.dir    = parseInt(span.dataset.dir || '1'); // 1=droite, -1=gauche
    this.pMax   = 1;
    this.obj    = { p: 0 };
    this.tl     = null;

    const ns  = 'http://www.w3.org/2000/svg';
    this.svg  = document.createElementNS(ns, 'svg');
    this.path = document.createElementNS(ns, 'path');
    this.path.setAttribute('fill-rule', 'evenodd');
    this.path.setAttribute('fill', 'currentColor');
    this.svg.appendChild(this.path);

    const svgStyle = {
      display      : 'inline-block',
      height       : '1cap',
      width        : 'auto',
      verticalAlign: 'baseline',
      overflow     : 'visible'
    };

    // PAIRING : miroir horizontal — le A apparaît côté droit (près de IRING)
    // la barre s'étire vers la gauche (vers P)
    if (this.dir === -1) {
      svgStyle.transform       = 'scaleX(-1)';
      svgStyle.transformOrigin = 'center center';
    }

    Object.assign(this.svg.style, svgStyle);
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

  /* ── pMax : la largeur du bloc parent est la seule contrainte
     Elle est identique pour les deux sens (gauche et droite)
     car c'est une contrainte de largeur totale :
     beforeW + wA + afterW ≤ availWidth
     ──────────────────────────────────────────────────────── */
  measurePMax() {
    if (!this.noWrap) return;

    const prevP  = this.obj.p;
    this.apply(0); // mesure depuis l'état A stable

    const lineEl     = this.svg.closest('.line') || this.svg.parentElement;
    const lineParent = lineEl.parentElement;
    const svgRect    = this.svg.getBoundingClientRect();
    const availWidth = parseFloat(getComputedStyle(lineParent).width);
    const wA         = svgRect.width;

    if (!availWidth || !wA) { this.apply(prevP); return; }

    const wBar = wA * (536.34 / 68.19); // rapport géométrique exact

    // texte AVANT le A (dans le DOM)
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

    // texte APRÈS le A (dans le DOM)
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

    const maxAWidth = availWidth - beforeW - afterW;
    this.pMax = Math.max(0, Math.min(1, (maxAWidth - wA) / (wBar - wA)));
    this.apply(prevP);
  }
}

/* ── AController ──────────────────────────────────────────
   Vague cyclique — croisements sans pauses :
   GAP s'étire → revient (= PAIRING part simultanément)
   PAIRING s'étire → revient (= CARING part simultanément)
   CARING s'étire → revient → cycle
   ─────────────────────────────────────────────────────── */

class AController {
  constructor() {
    this.pool     = [];
    this.masterTl = null;
  }

  init() {
    document.fonts.ready.then(() => {
      requestAnimationFrame(() => {
        document.querySelectorAll('[data-a-anim]').forEach(span =>
          this.pool.push(new AnimatedA(span))
        );
        requestAnimationFrame(() => {
          this.pool.forEach(i => i.measurePMax());
          this._startCycle();

          new ResizeObserver(() => {
            const was = !this.masterTl?.paused();
            this.masterTl?.pause();
            this.pool.forEach(i => i.measurePMax());
            if (was) this.masterTl?.resume();
          }).observe(document.body);
        });
      });
    });
  }

  _startCycle() {
    const gap     = this.pool.find(i => i.id === 'gap');
    const pairing = this.pool.find(i => i.id === 'pairing');
    const caring  = this.pool.find(i => i.id === 'caring');
    if (!gap || !pairing || !caring) return;

    const go = gap.obj;
    const po = pairing.obj;
    const co = caring.obj;
    const D  = 4.5;          // durée de chaque extension
    const E  = 'sine.inOut'; // vélocité continue, jamais brusque

    // Cycle total = 4D = 18s
    // t=0    : GAP s'étire
    // t=D    : GAP revient IMMÉDIATEMENT + PAIRING part simultanément
    // t=2D   : PAIRING revient IMMÉDIATEMENT + CARING part simultanément
    // t=3D   : CARING revient seul
    // t=4D   : fin du cycle → pause 0.5s → recommence

    this.masterTl = gsap.timeline({
      repeat     : -1,
      delay      : 1.5,
      repeatDelay: 0.5
    })
      .to(go, { p:1, duration:D, ease:E, onUpdate: () => gap.apply(go.p) })

      .to(go, { p:0, duration:D, ease:E, onUpdate: () => gap.apply(go.p) })
      .to(po, { p:1, duration:D, ease:E, onUpdate: () => pairing.apply(po.p) }, '<')

      .to(po, { p:0, duration:D, ease:E, onUpdate: () => pairing.apply(po.p) })
      .to(co, { p:1, duration:D, ease:E, onUpdate: () => caring.apply(co.p) }, '<')

      .to(co, { p:0, duration:D, ease:E, onUpdate: () => caring.apply(co.p) });

    gap.tl = pairing.tl = caring.tl = this.masterTl;
  }

  toggleAll() {
    const tls = new Set(this.pool.map(i => i.tl).filter(Boolean));
    tls.forEach(tl => tl.paused() ? tl.resume() : tl.pause());
  }

  seekAll(p) { this.pool.forEach(i => i.apply(p)); }
}

const ctrl = new AController();
ctrl.init();

document.addEventListener('click', () => ctrl.toggleAll());