import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.zIndex = '1';
renderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(renderer.domElement);

// Texture sans filtre, dégradé radial progressif
function createSoftCircleTexture(color, radius, opacityAtCenter = 1.0) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const center = 512;
  const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(0.3, color);
  grad.addColorStop(0.7, `rgba(0,0,0,0)`);
  grad.addColorStop(1, `rgba(0,0,0,0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Spread : grand, doux, moins chaud
const spreadTex = createSoftCircleTexture('#F0DDC9', 280);
// Cœur : plus petit, plus chaud, plus opaque
const heartTex = createSoftCircleTexture('#F5B88C', 120);

const spreadMat = new THREE.SpriteMaterial({ map: spreadTex, color: 0xffffff, transparent: true, opacity: 0.66, blending: THREE.AdditiveBlending });
const heartMat = new THREE.SpriteMaterial({ map: heartTex, color: 0xffaa88, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending });

const spreadSprite = new THREE.Sprite(spreadMat);
const heartSprite = new THREE.Sprite(heartMat);

spreadSprite.scale.set(600, 600, 1);
heartSprite.scale.set(200, 200, 1); // plus compact

spreadSprite.position.set(0, 0, 0);
heartSprite.position.set(0, 0, 0);

scene.add(spreadSprite);
scene.add(heartSprite);

function animate() {
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});