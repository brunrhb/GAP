class AnimatedA {
  constructor(span) {
    this.id     = span.dataset.aId   || null;
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

    const prevP = this.obj.p;
    this.apply(0);

    const lineEl     = this.svg.closest('.line') || this.svg.parentElement;
    const lineParent = lineEl.parentElement;
    const availWidth = parseFloat(getComputedStyle(lineParent).width);
    if (!availWidth) { this.apply(prevP); return; }

    const svgRect = this.svg.getBoundingClientRect();
    let wA = svgRect.width;
    if (!wA) {
      const fs = parseFloat(getComputedStyle(lineEl).fontSize) || 16;
      wA = fs * 0.72 * (68.19 / 36.96);
    }
    const wBar = wA * (536.32 / 68.19);

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

    const maxAWidth = availWidth - beforeW - afterW;
    this.pMax = Math.max(0, Math.min(1, (maxAWidth - wA) / (wBar - wA)));
    this.apply(prevP);
  }

  pause()  { this.tl?.pause();  }
  resume() { this.tl?.resume(); }
  toggle() { this.tl?.paused() ? this.tl.resume() : this.tl.pause(); }
}

/* ── AController ────────────────────────────────────────────
   Deux chorégraphies séparées :
   · GAP      — yoyo lent, monumental
   · PAIRING / CARING — relay : l'un passe le relais à l'autre
   ─────────────────────────────────────────────────────────── */

class AController {
  constructor() {
    this.pool    = [];
    this.relayTl = null;
  }

  init() {
    document.fonts.ready.then(() => {
      requestAnimationFrame(() => {
        document.querySelectorAll('[data-a-anim]').forEach(span => {
          this.pool.push(new AnimatedA(span));
        });
        requestAnimationFrame(() => {
          this.pool.forEach(i => i.measurePMax());
          this._choreGAP();
          this._choreRelay();

          new ResizeObserver(() => {
            const wasPlaying = !this.relayTl?.paused();
            this.pool.forEach(i => i.tl?.pause());
            this.relayTl?.pause();
            this.pool.forEach(i => i.measurePMax());
            this.pool.forEach(i => i.tl?.resume());
            if (wasPlaying) this.relayTl?.resume();
          }).observe(document.body);
        });
      });
    });
  }

  /* ── GAP : lent, souverain ── */
  _choreGAP() {
    const gap = this.pool.find(i => i.id === 'gap');
    if (!gap) return;

    const obj  = gap.obj;
    const dur  = 3.0;        // 3s d'extension — monumental
    const ease = 'sine.inOut';

    gap.tl = gsap.timeline({ repeat: -1, delay: 0.4 })
      .to(obj, {
        p: 1, duration: dur, ease,
        onUpdate: () => gap.apply(obj.p)
      })
      .to({}, { duration: 0.25 })             // souffle au bout
      .to(obj, {
        p: 0, duration: dur, ease,
        onUpdate: () => gap.apply(obj.p)
      })
      .to({}, { duration: 0.4 });             // souffle avant la prochaine
  }

  /* ── PAIRING → CARING : relay ── */
  _choreRelay() {
    const p1 = this.pool.find(i => i.id === 'pairing');
    const p2 = this.pool.find(i => i.id === 'caring');
    if (!p1 || !p2) return;

    const o1   = p1.obj;
    const o2   = p2.obj;
    const dur  = 2.4;         // durée d'extension de chaque A
    const ease = 'sine.inOut';
    const relay = 0.12;       // léger chevauchement au moment du relais

    this.relayTl = gsap.timeline({ repeat: -1, delay: 0.8 })

      // PAIRING s'allonge
      .to(o1, { p: 1, duration: dur, ease, onUpdate: () => p1.apply(o1.p) })

      // CARING démarre avant que PAIRING finisse — le relais
      .to(o2, { p: 1, duration: dur, ease, onUpdate: () => p2.apply(o2.p) }, `-=${relay}`)

      // Un souffle — les deux sont au maximum ensemble
      .to({}, { duration: 0.28 })

      // CARING se rétracte
      .to(o2, { p: 0, duration: dur, ease, onUpdate: () => p2.apply(o2.p) })

      // PAIRING se rétracte — relais inverse
      .to(o1, { p: 0, duration: dur, ease, onUpdate: () => p1.apply(o1.p) }, `-=${relay}`)

      // Pause avant la prochaine vague
      .to({}, { duration: 0.4 });

    // Les deux instances partagent la même tl pour pause/resume
    p1.tl = this.relayTl;
    p2.tl = this.relayTl;
  }

  /* ── Contrôle global — déduplique les timelines ── */
  toggleAll() {
    const tls = new Set(this.pool.map(i => i.tl).filter(Boolean));
    tls.forEach(tl => tl.paused() ? tl.resume() : tl.pause());
  }

  pauseAll()  {
    const tls = new Set(this.pool.map(i => i.tl).filter(Boolean));
    tls.forEach(tl => tl.pause());
  }

  resumeAll() {
    const tls = new Set(this.pool.map(i => i.tl).filter(Boolean));
    tls.forEach(tl => tl.resume());
  }

  invert(id) {
    const inst = this.pool.find(i => i.id === id);
    const t = inst?.tl;
    if (t) t.reversed(!t.reversed());
  }

  seekAll(p) { this.pool.forEach(i => i.apply(p)); }
}

/* ── Init ── */
const ctrl = new AController();
ctrl.init();

document.addEventListener('click', () => ctrl.toggleAll());