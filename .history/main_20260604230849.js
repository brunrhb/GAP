/* ── AnimatedA ────────────────────────────────────────────
   data-dir="-1" → SVG miroir (scaleX -1), s'étire vers la gauche
   measurePMax() stocke wA, wBar, travel (px) pour le calcul
   de durée à vitesse constante.
   ───────────────────────────────────────────────────────── */

class AnimatedA {
  constructor(span) {
    this.id     = span.dataset.aId || null;
    this.noWrap = span.hasAttribute('data-no-wrap');
    this.dir    = parseInt(span.dataset.dir || '1');
    this.pMax   = 1;
    this.wA     = 0;   // largeur du A en px (p=0)
    this.wBar   = 0;   // largeur théorique de la barre pleine en px (p=1)
    this.travel = 0;   // distance réelle parcourue par le bord (px)
    this.obj    = { p: 0 };
    this.tl     = null;

    const ns  = 'http://www.w3.org/2000/svg';
    this.svg  = document.createElementNS(ns, 'svg');
    this.path = document.createElementNS(ns, 'path');
    this.path.setAttribute('fill-rule', 'evenodd');
    this.path.setAttribute('fill', 'currentColor');
    this.svg.appendChild(this.path);

    const s = {
      display      : 'inline-block',
      height       : '1cap',
      width        : 'auto',
      verticalAlign: 'baseline',
      overflow     : 'visible'
    };
    if (this.dir === -1) {
      s.transform       = 'scaleX(-1)';
      s.transformOrigin = 'center center';
    }
    Object.assign(this.svg.style, s);

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

  measurePMax() {
    if (!this.noWrap) return;

    const prevP = this.obj.p;
    this.apply(0);

    const lineEl     = this.svg.closest('.line') || this.svg.parentElement;
    const lineParent = lineEl.parentElement;
    const svgRect    = this.svg.getBoundingClientRect();
    const availWidth = parseFloat(getComputedStyle(lineParent).width);
    const wA         = svgRect.width;

    if (!availWidth || !wA) { this.apply(prevP); return; }

    const wBar = wA * (536.34 / 68.19);

    // texte AVANT
    let beforeW = 0;
    let node = this.svg.previousSibling;
    while (node) {
      if (node.nodeType === 3 && node.textContent.trim()) {
        const rg = document.createRange(); rg.selectNodeContents(node);
        const b = rg.getBoundingClientRect(); if (b.width > 0) beforeW += b.width;
      } else if (node.nodeType === 1) {
        const b = node.getBoundingClientRect(); if (b.width > 0) beforeW += b.width;
      }
      node = node.previousSibling;
    }
    // texte APRÈS
    let afterW = 0;
    node = this.svg.nextSibling;
    while (node) {
      if (node.nodeType === 3 && node.textContent.trim()) {
        const rg = document.createRange(); rg.selectNodeContents(node);
        const b = rg.getBoundingClientRect(); if (b.width > 0) afterW += b.width;
      } else if (node.nodeType === 1) {
        const b = node.getBoundingClientRect(); if (b.width > 0) afterW += b.width;
      }
      node = node.nextSibling;
    }

    const maxAWidth = availWidth - beforeW - afterW;
    this.pMax   = Math.max(0, Math.min(1, (maxAWidth - wA) / (wBar - wA)));
    this.wA     = wA;
    this.wBar   = wBar;
    this.travel = this.pMax * (wBar - wA); // distance px parcourue par le bord

    this.apply(prevP);
  }
}

/* ── AController ──────────────────────────────────────────
   Vitesse constante (px/s) → durée = distance / vitesse.
   Indépendant de la taille d'écran : même sensation partout.

   Eases directionnels :
     aller  = sine.in   (vélocité max à l'extrémité → aucun arrêt)
     retour = sine.out  (repart à vélocité max depuis l'extrémité)
   La seule respiration est à la maison (p=0), pas à l'extension.

   GAP plus rapide que PAIRING / CARING.
   ─────────────────────────────────────────────────────── */

const VELOCITY = {
  gap     : 280,  // px/s — incisif
  pairing : 180,  // px/s — posé
  caring  : 180   // px/s — posé
};

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
          this._build();

          new ResizeObserver(() => {
            const wasPlaying = !this.masterTl?.paused();
            this.pool.forEach(i => i.measurePMax());
            this._build();                   // rebuild : durées recalculées
            if (!wasPlaying) this.masterTl?.pause();
          }).observe(document.body);
        });
      });
    });
  }

  _build() {
    const gap     = this.pool.find(i => i.id === 'gap');
    const pairing = this.pool.find(i => i.id === 'pairing');
    const caring  = this.pool.find(i => i.id === 'caring');
    if (!gap || !pairing || !caring) return;

    // durée = distance / vitesse, plancher à 0.3s
    const dur = (inst, vel) => Math.max(0.3, inst.travel / vel);

    const Dg = dur(gap,     VELOCITY.gap);
    const Dp = dur(pairing, VELOCITY.pairing);
    const Dc = dur(caring,  VELOCITY.caring);

    const go = gap.obj, po = pairing.obj, co = caring.obj;
    const IN  = 'sine.in';   // aller
    const OUT = 'sine.out';  // retour

    // Positions temporelles absolues des croisements
    const t1 = Dg;            // GAP revient + PAIRING part
    const t2 = Dg + Dp;       // PAIRING revient + CARING part
    const t3 = Dg + Dp + Dc;  // CARING revient

    if (this.masterTl) this.masterTl.kill();

    this.masterTl = gsap.timeline({ repeat: -1, delay: 0, repeatDelay: 0 });

    // GAP aller
    this.masterTl.to(go, { p:1, duration:Dg, ease:IN,  onUpdate: () => gap.apply(go.p) }, 0);
    // GAP retour + PAIRING aller (simultané)
    this.masterTl.to(go, { p:0, duration:Dg, ease:OUT, onUpdate: () => gap.apply(go.p) }, t1);
    this.masterTl.to(po, { p:1, duration:Dp, ease:IN,  onUpdate: () => pairing.apply(po.p) }, t1);
    // PAIRING retour + CARING aller (simultané)
    this.masterTl.to(po, { p:0, duration:Dp, ease:OUT, onUpdate: () => pairing.apply(po.p) }, t2);
    this.masterTl.to(co, { p:1, duration:Dc, ease:IN,  onUpdate: () => caring.apply(co.p) }, t2);
    // CARING retour
    this.masterTl.to(co, { p:0, duration:Dc, ease:OUT, onUpdate: () => caring.apply(co.p) }, t3);

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