import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = null; // transparent

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.insertBefore(renderer.domElement, document.querySelector('.content'));
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.zIndex = '1';
renderer.domElement.style.pointerEvents = 'none';

// Création d'une texture de cercle flou (simulation de blur via gradient)
function createBlurredCircleTexture(color, radius, blurStrength) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 512);
  const center = 256;
  const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.filter = `blur(${blurStrength}px)`;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const spreadTex = createBlurredCircleTexture('#F0DDC9', 200, 70);
const heartTex = createBlurredCircleTexture('#F5B88C', 100, 70);

const spreadMat = new THREE.SpriteMaterial({ map: spreadTex, color: 0xffffff, transparent: true, opacity: 0.66, blending: THREE.AdditiveBlending });
const heartMat = new THREE.SpriteMaterial({ map: heartTex, color: 0xffaa88, transparent: true, opacity: 0.66, blending: THREE.AdditiveBlending });

const spreadSprite = new THREE.Sprite(spreadMat);
const heartSprite = new THREE.Sprite(heartMat);

spreadSprite.scale.set(600, 600, 1);
heartSprite.scale.set(300, 300, 1);

scene.add(spreadSprite);
scene.add(heartSprite);

function animate() {
  // Pour l'instant fixe, mais tu pourras animer position, scale, rotation
  spreadSprite.position.set(0, 0, 0);
  heartSprite.position.set(0, 0, 0);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});