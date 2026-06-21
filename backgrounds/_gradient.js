// GAP · Mesh gradient engine — WebGL/Three.js
// Partagé par toutes les pages backgrounds/
// Appelé avec: initGradient(canvas, config)

const VS = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

const FS = `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec3  uColor1;
  uniform vec3  uColor2;
  uniform vec3  uColor3;
  uniform float uSpeed;
  uniform float uStrength;
  uniform float uGrain;

  // ── noise ──────────────────────────────────────────────────────────────────
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
  }

  float gnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(
      mix(dot(hash2(i),             f              ),
          dot(hash2(i + vec2(1,0)), f - vec2(1, 0)), u.x),
      mix(dot(hash2(i + vec2(0,1)), f - vec2(0, 1)),
          dot(hash2(i + vec2(1,1)), f - vec2(1, 1)), u.x),
      u.y
    ) * 0.5 + 0.5;
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.55;
    for (int i = 0; i < 5; i++) {
      v += gnoise(p) * a;
      p = p * 2.03 + vec2(3.1, 1.7);
      a *= 0.48;
    }
    return v;
  }

  float hash1(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // ── main ───────────────────────────────────────────────────────────────────
  void main() {
    vec2 uv = vUv;
    float t  = uTime * uSpeed * 0.12;

    // large-blob base (low frequency)
    vec2 p = uv * 1.1;

    // domain warp layer 1
    vec2 q = vec2(
      fbm(p + vec2(0.0,  t)),
      fbm(p + vec2(5.2,  t + 1.7))
    );

    // domain warp layer 2
    vec2 r = vec2(
      fbm(p + uStrength * q + vec2(1.3, t * 0.4)),
      fbm(p + uStrength * q + vec2(8.5, t * 0.3 + 2.1))
    );

    float n1 = fbm(p + uStrength * r);
    float n2 = fbm(p + uStrength * (r + q * 0.5) + vec2(4.0, 0.0));

    // 3-colour blend
    vec3 col = mix(uColor1, uColor2, smoothstep(0.28, 0.72, n1));
    col       = mix(col,    uColor3, smoothstep(0.38, 0.80, n2) * 0.62);

    // subtle directional sheen (fake lighting on normal field)
    float ex = fbm(p + uStrength * r + vec2(0.01, 0.0));
    float ey = fbm(p + uStrength * r + vec2(0.0, 0.01));
    vec3  nm = normalize(vec3((ex - n1) * 20.0, (ey - n1) * 20.0, 1.0));
    vec3  li = normalize(vec3(0.5, 0.8, 1.5));
    col += col * max(dot(nm, li), 0.0) * 0.08;

    // animated fine grain (changes 24×/sec)
    float grain = hash1(gl_FragCoord.xy * 0.7 + vec2(floor(uTime * 24.0))) - 0.5;
    col += grain * uGrain;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`

window.initGradient = function(canvas, cfg) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    preserveDrawingBuffer: true   // needed for PNG export
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)

  const scene  = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const mat = new THREE.ShaderMaterial({
    vertexShader:   VS,
    fragmentShader: FS,
    uniforms: {
      uTime:       { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uColor1:     { value: new THREE.Color(cfg.color1) },
      uColor2:     { value: new THREE.Color(cfg.color2) },
      uColor3:     { value: new THREE.Color(cfg.color3) },
      uSpeed:      { value: cfg.speed    ?? 0.3  },
      uStrength:   { value: cfg.strength ?? 1.2  },
      uGrain:      { value: cfg.grain    ?? 0.038 }
    }
  })

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat))

  // resize
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    mat.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight)
  })

  // render loop
  function tick(t) {
    requestAnimationFrame(tick)
    mat.uniforms.uTime.value = t * 0.001
    renderer.render(scene, camera)
  }
  requestAnimationFrame(tick)

  // PNG export
  window.savePNG = function(name) {
    renderer.render(scene, camera)
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = (name || 'gap-gradient') + '.png'
    a.click()
  }
}
