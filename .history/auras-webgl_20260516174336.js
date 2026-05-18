import * as THREE from 'three';

// Scene avec fond transparent
const scene = new THREE.Scene();
scene.background = null;

// Caméra orthographique (pour sprites plein écran)
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

// Renderer avec transparence
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.zIndex = '1';
renderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(renderer.domElement);



// Fonction pour créer une texture de cercle flou
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

// Textures
const spreadTex = createBlurredCircleTexture('#F0DDC9', 200, 70);
const heartTex = createBlurredCircleTexture('#F5B88C', 100, 70);

// Matériaux
const spreadMat = new THREE.SpriteMaterial({ map: spreadTex, color: 0xffffff, transparent: true, opacity: 0.66, blending: THREE.AdditiveBlending });
const heartMat = new THREE.SpriteMaterial({ map: heartTex, color: 0xffaa88, transparent: true, opacity: 0.66, blending: THREE.AdditiveBlending });

// Sprites
const spreadSprite = new THREE.Sprite(spreadMat);
const heartSprite = new THREE.Sprite(heartMat);

// Taille : spread plus grand, cœur plus petit
spreadSprite.scale.set(600, 600, 1);
heartSprite.scale.set(300, 300, 1);

// Position centrée (coordonnées normalisées : 0,0 = centre de l'écran)
spreadSprite.position.set(0, 0, 0);
heartSprite.position.set(0, 0, 0);

scene.add(spreadSprite);
scene.add(heartSprite);

// Animation
function animate() {
  spreadMat.color.setHex(0xff00ff); // magenta vif
  spreadMat.opacity = 1;
  spreadMat.transparent = false;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// Redimensionnement
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});