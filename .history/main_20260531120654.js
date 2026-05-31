const forme = document.getElementById('forme');

function buildPath(p) {
  const r  = p * 468.15;   // extension outer droite
  const ri = p * 467.70;   // extension inner droite ← corrigé (était 451.79)
  const xo = 234.065 * (1 - p);

  const f  = v => (xo + v).toFixed(3);
  const g  = v => (xo + v + r).toFixed(3);
  const gi = v => (xo + v + ri).toFixed(3);

  const ext =
    `M${f(9.79)},0 ` +
    `L${f(6.02)},15.99 ` +
    `L${f(2.29)},29.91 ` +
    `L${f(0.21)},36.96 ` +
    `L${f(20.55)},36.96 ` +
    `L${f(21.24)},30.52 ` +
    `L${g(45.46)},30.52 ` +
    `L${g(46.03)},36.96 ` +
    `L${g(68.40)},36.96 ` +
    `L${g(64.42)},23.50 ` +
    `L${g(58.35)},0 Z`;

  const inn =
    `M${g(44.15)},21.70 ` +
    `L${gi(41.36)},8.82 ` +
    `L${f(25.30)},8.82 ` +
    `L${f(22.52)},21.70 Z`;

  return ext + ' ' + inn;
}

forme.setAttribute('d', buildPath(0));

const obj = { p: 0 };

const tl = gsap.timeline({ repeat: -1, yoyo: true, repeatDelay: 3, delay: 1 });
tl.to(obj, {
  p: 1,
  duration: 5,
  ease: 'power3.inOut',
  onUpdate: () => forme.setAttribute('d', buildPath(obj.p))
});

document.addEventListener('click', () => {
  tl.paused() ? tl.resume() : tl.pause();
});