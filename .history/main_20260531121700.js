/* ─────────────────────────────────────────
   AnimatedA
   height = 1cap (s'aligne sur la casse de la police)
   width  = auto via viewBox dynamique (pousse les voisins)

   data-attributes :
     data-delay="0.8"   délai démarrage (s)
     data-speed="1"     multiplicateur vitesse
     data-no-wrap       calcule p_max pour ne pas déborder
   ───────────────────────────────────────── */

class AnimatedA {
  constructor(span) {
    this.delay  = parseFloat(span.dataset.delay || 0);
    this.speed  = parseFloat(span.dataset.speed || 1);
    this.noWrap = span.hasAttribute('data-no-wrap');
    this.pMax   = 1;
    this.tl     = null;

    const ns  = 'http://www.w3.org/2000/svg';
    this.svg  = document.createElementNS(ns, 'svg');
    this.path = document.createElementNS(ns, 'path');

    Object.assign(this.svg.style, {
      display      : 'inline-block',
      height       : '1cap',
      width        : 'auto',
      verticalAlign: 'baseline',
      overflow     : 'visible'
    });
    this.path.setAttribute('fill-rule', 'evenodd');
    this.path.setAttribute('fill', 'currentColor');
    this.svg.appendChild(this.path);

    this.apply(0);
    span.replaceWith(this.svg);
  }

  /* ── Géométrie : seul p change ─────────── */

  apply(p) {
    const pc = Math.min(p, this.pMax);
    const r  = pc * 468.15;
    const ri = pc * 467.70;
    const xo = 234.065 * (1 - pc);

    const f  = v => (xo + v).toFixed(3);
    const g  = v => (xo + v + r).toFixed(3);
    const gi = v => (xo + v + ri).toFixed(3);

    // viewBox dynamique → width auto suit automatiquement
    const xMin = xo + 0.21;
    const xMax = xo + 68.40 + r;
    this.svg.setAttribute('viewBox',
      `${xMin.toFixed(3)} 0 ${(xMax - xMin).toFixed(3)} 36.96`);

    this.path.setAttribute('d',
      `M${f(9.79)},0 L${f(6.02)},15.99 L${f(2.29)},29.91 ` +
      `L${f(0.21)},36.96 L${f(20.55)},36.96 L${f(21.24)},30.52 ` +
      `L${g(45.46)},30.52 L${g(46.03)},36.96 L${g(68.40)},36.96 ` +
      `L${g(64.42)},23.50 L${g(58.35)},0 Z ` +
      `M${g(44.15)},21.70 L${gi(41.36)},8.82 ` +
      `L${f(25.30)},8.82 L${f(22.52)},21.70 Z`
    );
  }

  /* ── data-no-wrap : limite l'expansion ─── */

  measurePMax() {
    if (!this.noWrap) return;

    const svgRect = this.svg.getBoundingClientRect();
    const padL    = parseFloat(getComputedStyle(document.body).paddingLeft) || 0;
    const lineW   = window.innerWidth - padL * 2;
    const beforeA = svgRect.left - padL;

    // Mesurer le contenu qui suit sur la même ligne
    let afterA = 0;
    let node   = this.svg.nextSibling;
    while (node) {
      if (node.nodeType === 3 && node.textContent.trim()) {
        const r = document.createRange();
        r.selectNodeContents(node);
        afterA += r.getBoundingClientRect().width;
      } else if (node.nodeType === 1) {
        afterA += node.getBoundingClientRect().width;
      }
      node = node.nextSibling;
    }

    const h    = svgRect.height;
    const wA   = h * 68.19  / 36.96;  // largeur A au repos
    const wBar = h * 536.32 / 36.96;  // largeur barre pleine
    const maxW = lineW - beforeA - afterA;

    this.pMax = Math.max(0, Math.min(1, (maxW - wA) / (wBar - wA)));
  }

  /* ── Animation ─────────────────────────── */

  start({ duration = 2, repeatDelay = 2 } = {}) {
    const obj = { p: 0 };
    this.tl   = gsap.timeline({
      repeat     : -1,
      yoyo       : true,
      repeatDelay,
      delay      : this.delay
    }).to(obj, {
      p        : 1,
      duration : duration / this.speed,
      ease     : 'power3.inOut',
      onUpdate : () => this.apply(obj.p)
    });
    return this;
  }

  pause()  { this.tl?.pause();  }
  resume() { this.tl?.resume(); }
  toggle() { this.tl?.paused() ? this.tl.resume() : this.tl.pause(); }
}

/* ─────────────────────────────────────────
   AController
   ctrl.toggleAll()      pause / reprise tous
   ctrl.invert(n)        inverse la direction du A n
   ctrl.seekAll(0.5)     positionne tous à p=0.5
   ───────────────────────────────────────── */

class AController {
  constructor() { this.pool = []; }

  init(opts = {}) {
    // Attendre les fonts avant de mesurer les layouts
    document.fonts.ready.then(() => {
      document.querySelectorAll('[data-a-anim]').forEach(span => {
        const inst = new AnimatedA(span);
        inst.measurePMax();
        inst.start(opts);
        this.pool.push(inst);
      });

      // Recalcul au resize
      new ResizeObserver(() =>
        this.pool.forEach(i => i.measurePMax())
      ).observe(document.body);
    });
  }

  toggleAll() { this.pool.forEach(i => i.toggle()); }
  pauseAll()  { this.pool.forEach(i => i.pause());  }
  resumeAll() { this.pool.forEach(i => i.resume()); }
  invert(n)   { const i = this.pool[n]; if (i) i.tl.reversed(!i.tl.reversed()); }
  seekAll(p)  { this.pool.forEach(i => i.apply(p)); }
}

/* ── Init ───────────────────────────────── */

const ctrl = new AController();
ctrl.init({ duration: 2, repeatDelay: 2 });

document.addEventListener('click', () => ctrl.toggleAll());