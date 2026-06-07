class AnimatedA {
  constructor(span) {
    this.delay  = parseFloat(span.dataset.delay || 0);
    this.speed  = parseFloat(span.dataset.speed || 1);
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

  measurePMax() {
    if (!this.noWrap) return;

    // Reset à p=0 pour mesurer dans l'état stable A
    const prevP = this.obj.p;
    this.apply(0);

    // Largeur disponible = largeur du parent de la ligne (.block)
    const lineEl     = this.svg.closest('.line') || this.svg.parentElement;
    const lineParent = lineEl.parentElement;
    // getComputedStyle().width = largeur layout stable, pas affectée par l'overflow
    const availWidth = parseFloat(getComputedStyle(lineParent).width);
    if (!availWidth) { this.apply(prevP); return; }

    // Largeur réelle du A : rect.width à p=0 (scaleY du parent n'affecte pas X)
    const svgRect = this.svg.getBoundingClientRect();
    let wA = svgRect.width;
    if (!wA) {
      const fs = parseFloat(getComputedStyle(lineEl).fontSize) || 16;
      wA = fs * 0.72 * (68.19 / 36.96);
    }
    const wBar = wA * (536.32 / 68.19);

    // Mesurer le texte AVANT le A sur la même ligne
    let beforeW = 0;
    let node = this.svg.previousSibling;
    while (node) {
      if (node.nodeType === 3 && node.textContent.trim()) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const r = range.getBoundingClientRect();
        if (r.width > 0) beforeW += r.width;
      } else if (node.nodeType === 1) {
        const r = node.getBoundingClientRect();
        if (r.width > 0) beforeW += r.width;
      }
      node = node.previousSibling;
    }

    // Mesurer le texte APRÈS le A sur la même ligne
    let afterW = 0;
    node = this.svg.nextSibling;
    while (node) {
      if (node.nodeType === 3 && node.textContent.trim()) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const r = range.getBoundingClientRect();
        if (r.width > 0) afterW += r.width;
      } else if (node.nodeType === 1) {
        const r = node.getBoundingClientRect();
        if (r.width > 0) afterW += r.width;
      }
      node = node.nextSibling;
    }

    // Place disponible pour le A = largeur ligne - avant - après
    const maxAWidth = availWidth - beforeW - afterW;
    this.pMax = Math.max(0, Math.min(1, (maxAWidth - wA) / (wBar - wA)));

    // Restaure l'état courant avec le nouveau pMax
    this.apply(prevP);
  }

  start({ duration = 2, repeatDelay = 1.5 } = {}) {
    const obj = this.obj;
    this.tl   = gsap.timeline({
      repeat     : -1,
      yoyo       : true,
      repeatDelay,
      delay      : this.delay
    }).to(obj, {
      p       : 1,
      duration: duration / this.speed,
      ease    : 'power3.inOut',
      onUpdate: () => this.apply(obj.p)
    });
    return this;
  }

  pause()  { this.tl?.pause();  }
  resume() { this.tl?.resume(); }
  toggle() { this.tl?.paused() ? this.tl.resume() : this.tl.pause(); }
}

class AController {
  constructor() { this.pool = []; }

  init(opts = {}) {
    document.fonts.ready.then(() => {
      requestAnimationFrame(() => {
        document.querySelectorAll('[data-a-anim]').forEach(span => {
          this.pool.push(new AnimatedA(span));
        });
        requestAnimationFrame(() => {
          this.pool.forEach(i => {
            i.measurePMax();
            i.start(opts);
          });
          new ResizeObserver(() => {
            this.pool.forEach(i => {
              i.tl?.pause();
              i.measurePMax();
              i.tl?.resume();
            });
          }).observe(document.body);
        });
      });
    });
  }

  toggleAll() { this.pool.forEach(i => i.toggle()); }
  pauseAll()  { this.pool.forEach(i => i.pause());  }
  resumeAll() { this.pool.forEach(i => i.resume()); }
  invert(n)   { const t = this.pool[n]?.tl; if (t) t.reversed(!t.reversed()); }
  seekAll(p)  { this.pool.forEach(i => i.apply(p)); }
}

const ctrl = new AController();
ctrl.init({ duration: 2, repeatDelay: 1.5 });

document.addEventListener('click', () => ctrl.toggleAll());