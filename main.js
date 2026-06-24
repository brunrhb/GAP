/* ── AnimatedA ────────────────────────────────────────────
   progression d'animation (obj.p : 0→1) ≠ facteur d'extension
   réel (pExtend). apply(progress) mappe 0→1 vers 0→pExtend.
   pExtend n'est PLUS plafonné à 1 : la barre s'allonge autant
   que nécessaire pour remplir l'espace dispo de la div.
   ───────────────────────────────────────────────────────── */

class AnimatedA {
  constructor(span) {
    this.id      = span.dataset.aId || null;
    this.noWrap  = span.hasAttribute('data-no-wrap');
    this.dir     = parseInt(span.dataset.dir || '1');
    this.pExtend = 0;   // facteur d'extension réel (peut dépasser 1)
    this.wA      = 0;
    this.wBar    = 0;
    this.travel  = 0;   // distance px parcourue par le bord
    this.obj     = { p: 0 };
    this.tl      = null;

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

  buildPath(pc) {
    // pc = facteur d'extension absolu (0 = A, 1 = barre naturelle, >1 = plus longue)
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

  apply(progress) {
    const pc   = progress * this.pExtend;   // 0→1 mappé vers 0→pExtend
    const r    = pc * 468.15;
    const xo   = 234.065 * (1 - pc);
    const xMin = xo + 0.21;
    const xMax = xo + 68.40 + r;
    this.svg.setAttribute('viewBox',
      `${xMin.toFixed(3)} 0 ${(xMax - xMin).toFixed(3)} 36.96`);
    this.path.setAttribute('d', this.buildPath(pc));
  }

  measurePMax() {
    if (!this.noWrap) return;

    const prevP = this.obj.p;
    this.apply(0); // progress=0 → pc=0 → toujours l'état A, peu importe pExtend

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

    // PAS de cap à 1 : la barre remplit exactement l'espace dispo
    this.pExtend = Math.max(0, (maxAWidth - wA) / (wBar - wA));
    this.wA      = wA;
    this.wBar    = wBar;
    this.travel  = this.pExtend * (wBar - wA); // distance réelle parcourue

    this.apply(prevP);
  }
}

/* ── AController ──────────────────────────────────────────
   Vitesse constante (px/s). GAP plus rapide.
   Eases directionnels : aller = sine.in, retour = sine.out.
   ─────────────────────────────────────────────────────── */

const VELOCITY = {
  gap     : 250,
  pairing : 180,
  caring  : 180
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
            this._build();
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

    const dur = (inst, vel) => Math.max(0.3, inst.travel / vel);

    const Dg = dur(gap,     VELOCITY.gap);
    const Dp = dur(pairing, VELOCITY.pairing);
    const Dc = dur(caring,  VELOCITY.caring);

    const go = gap.obj, po = pairing.obj, co = caring.obj;
    const IN  = 'none';
    const OUT = 'none';

    if (this.masterTl) this.masterTl.kill();

    this.masterTl = gsap.timeline({ repeat: -1, delay: 1.2, repeatDelay: 0.4 });

    // — GAP aller-retour complet, seul —
    let t = 0;
    this.masterTl.to(go, { p:1, duration:Dg, ease:IN,  onUpdate: () => gap.apply(go.p) }, t);
    t += Dg;
    this.masterTl.to(go, { p:0, duration:Dg, ease:OUT, onUpdate: () => gap.apply(go.p) }, t);
    t += Dg;

    // — PAIRING part et reste étendu —
    this.masterTl.to(po, { p:1, duration:Dp, ease:IN,  onUpdate: () => pairing.apply(po.p) }, t);
    t += Dp;
    // (PAIRING reste à p=1 — aucun tween de retour pour l'instant)

    // — Dès PAIRING arrivé : CARING aller-retour complet —
    this.masterTl.to(co, { p:1, duration:Dc, ease:IN,  onUpdate: () => caring.apply(co.p) }, t);
    t += Dc;
    this.masterTl.to(co, { p:0, duration:Dc, ease:OUT, onUpdate: () => caring.apply(co.p) }, t);
    t += Dc;

    // — Dès CARING revenu : PAIRING repart (retour seul) —
    this.masterTl.to(po, { p:0, duration:Dp, ease:OUT, onUpdate: () => pairing.apply(po.p) }, t);

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

/* ── Lang switch ─────────────────────────────────────────── */
(function () {
  const STORAGE_KEY = 'tgg-lang';
  const validLangs  = ['fr', 'en', 'nl'];

  function setLang(lang) {
    if (!validLangs.includes(lang)) lang = 'fr';
    const html = document.documentElement;
    validLangs.forEach(l => html.classList.remove('show-' + l));
    html.classList.add('show-' + lang);
    html.setAttribute('lang', lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (err) {}
    document.querySelectorAll('[data-lang-btn]').forEach(b => {
      b.classList.toggle('active', b.dataset.langBtn === lang);
    });
  }

  // Restore saved preference on load
  const saved = localStorage.getItem(STORAGE_KEY);
  setLang(saved && validLangs.includes(saved) ? saved : 'fr');

  document.querySelectorAll('[data-lang-btn]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      setLang(btn.dataset.langBtn);
    });
  });
})();

/* ── Nav : page courante + taille adaptée ─────────────────── */
// Marque le lien de la page courante
const _currentFile = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-list a').forEach(a => {
  const href = a.getAttribute('href')?.split('/').pop() || 'index.html';
  if (href === _currentFile) a.setAttribute('aria-current', 'page');
});

// Calcule la font-size des items pour éviter l'overlap avec le contenu
function sizeNavItems() {
  if (window.innerWidth > 800) return;
  const headerEl = document.querySelector('.site-header');
  const mainEl   = document.querySelector('main');
  if (!headerEl || !mainEl) return;
  const gap  = mainEl.getBoundingClientRect().top
             - headerEl.getBoundingClientRect().bottom;
  const n    = document.querySelectorAll('.nav-list li:not(:has(a[aria-current="page"]))').length;
  const itemH = (gap - 16) / Math.max(n, 1);
  const fs    = Math.min(Math.max(itemH * 0.65, 13), 32);
  document.querySelectorAll('.nav-list a')
    .forEach(a => { a.style.fontSize = fs + 'px'; });
}

/* ── Mobile nav toggle ───────────────────────────────────── */
const navToggle = document.querySelector('.nav-toggle');
const mainNav   = document.querySelector('.main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', e => {
    e.stopPropagation(); // ne pas déclencher ctrl.toggleAll
    const isOpen = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.textContent = isOpen ? '✕' : '☰';
    if (isOpen) sizeNavItems();
  });
}

window.addEventListener('resize', () => {
  if (window.innerWidth > 800 && mainNav?.classList.contains('open')) {
    mainNav.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
    if (navToggle) navToggle.textContent = '☰';
  }
  sizeNavItems();
});

document.addEventListener('click', e => {
  // Ferme le menu si ouvert et clic hors nav
  if (mainNav?.classList.contains('open') && !mainNav.contains(e.target)) {
    mainNav.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
    if (navToggle) navToggle.textContent = '☰';
    return;
  }
  ctrl.toggleAll();
});