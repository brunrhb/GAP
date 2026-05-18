// auras.js – méthode canvas 2D
// Une seule aura fixe (deux calques superposés)

(function() {
  // Créer le canvas et l’insérer après .background-layer
  const canvas = document.createElement('canvas');
  canvas.id = 'aura-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '1'; // entre fond (0) et contenu (2)
  canvas.style.pointerEvents = 'none';
  document.body.insertBefore(canvas, document.querySelector('.content'));

  let ctx = canvas.getContext('2d');
  let width, height;

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    drawAura();
  }

  function drawAura() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    
    // Centre de l'aura (fixe)
    const centerX = width / 2;
    const centerY = height / 2;

    // --- Calque spread (large, moins chaud) ---
    ctx.save();
    ctx.filter = 'blur(70px)';
    ctx.globalAlpha = 0.66;
    
    // Dégradé radial spread
    const spreadGrd = ctx.createRadialGradient(centerX - 50, centerY - 40, 50, centerX, centerY, 280);
    spreadGrd.addColorStop(0, '#F0DDC9');
    spreadGrd.addColorStop(1, '#D6D3E2');
    ctx.fillStyle = spreadGrd;
    
    // Forme déformée (ellipse + rotation)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(0.2); // légère rotation
    ctx.scale(1.3, 0.9); // étirement non uniforme
    ctx.beginPath();
    ctx.ellipse(0, 0, 300, 300, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // --- Calque cœur (plus petit, plus chaud) ---
    const heartGrd = ctx.createRadialGradient(centerX + 40, centerY - 20, 40, centerX + 10, centerY + 10, 150);
    heartGrd.addColorStop(0, '#F5B88C');
    heartGrd.addColorStop(1, '#E8A87C');
    ctx.fillStyle = heartGrd;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-0.15);
    ctx.scale(1.1, 0.85);
    ctx.beginPath();
    ctx.ellipse(0, 0, 150, 150, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.restore(); // restaure le filter et globalAlpha
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
  });
  
  resizeCanvas();
})();