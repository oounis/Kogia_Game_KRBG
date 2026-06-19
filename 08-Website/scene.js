// Kharbga: Origins — 3D match with glowing crystal gems (Three.js, local UMD)
/* global THREE */

const canvas   = document.getElementById('scene3d');
const capEl    = document.getElementById('matchCap');
const popEl    = document.getElementById('comboPop');
const comboEl  = document.getElementById('comboN');
const fallback = document.getElementById('scene3dFallback');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function cap(t){ if(!capEl) return; capEl.style.opacity = 0; setTimeout(() => { capEl.textContent = t; capEl.style.opacity = 1; }, 150); }
function pop(t){ if(!popEl) return; popEl.textContent = t; popEl.classList.remove('show'); void popEl.offsetWidth; popEl.classList.add('show'); }

const N = 5, TILE = 1.25, REST_Y = 0.55;
const TEAMS = {
  pink: { color: 0xe6a73e, emissive: 0xd98a1e, glow: 0xffd089 },   // warm gold crew
  cyan: { color: 0x5f8c98, emissive: 0x3d6b78, glow: 0x9ec7d2 }    // slate crew
};
const tileToWorld = (c, r) => ({ x: (c - (N - 1) / 2) * TILE, z: (r - (N - 1) / 2) * TILE });

let renderer, scene, camera, boardGroup, clock;
let pieces = [], particles = [], dying = [], shake = 0, running = false;
const camBase = new THREE.Vector3(0, 5.8, 8.2), camLook = new THREE.Vector3(0, 0.5, 0);

function gemMat(C, ei = 0.55) {
  return new THREE.MeshStandardMaterial({ color: C.color, emissive: C.emissive, emissiveIntensity: ei,
    metalness: 0.35, roughness: 0.16, flatShading: true });
}
function makeGem(team) {
  const C = TEAMS[team], g = new THREE.Group();
  const m = gemMat(C);
  const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), m);
  gem.position.y = REST_Y; gem.castShadow = true; g.add(gem);
  g.userData = { gem, mat: m, glow: C.glow };
  return g;
}

function buildBoard() {
  boardGroup = new THREE.Group(); scene.add(boardGroup);
  const span = N * TILE;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(span + 0.9, 0.4, span + 0.9),
    new THREE.MeshStandardMaterial({ color: 0xc9a86a, roughness: 0.7, metalness: 0.05 }));
  frame.position.y = -0.42; frame.receiveShadow = true; boardGroup.add(frame);
  const base = new THREE.Mesh(new THREE.BoxGeometry(span + 0.4, 0.4, span + 0.4),
    new THREE.MeshStandardMaterial({ color: 0xb98f50, roughness: 0.8, metalness: 0.04 }));
  base.position.y = -0.18; base.receiveShadow = true; boardGroup.add(base);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const isMid = (c === (N - 1) / 2 && r === (N - 1) / 2);
    const col = isMid ? 0xf0d49a : ((c + r) % 2 ? 0xecd1a0 : 0xdcb87a);
    const m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.7, metalness: 0.04,
      emissive: isMid ? 0xdd9f2c : 0x000000, emissiveIntensity: isMid ? 0.4 : 0 });
    const t = new THREE.Mesh(new THREE.BoxGeometry(TILE * 0.9, 0.12, TILE * 0.9), m);
    const w = tileToWorld(c, r); t.position.set(w.x, 0.06, w.z); t.receiveShadow = true; boardGroup.add(t);
  }
}

function addPiece(team, c, r) {
  const g = makeGem(team); g.scale.setScalar(0.92);
  const w = tileToWorld(c, r); g.position.set(w.x, 0, w.z);
  boardGroup.add(g);
  const p = { g, team, c, r, phase: Math.random() * 6.28, anim: null, squash: 0, promoted: false, crown: null, grow: 0 };
  pieces.push(p); return p;
}

function hop(p, c, r, dur = 0.55, arc = 0.9) {
  return new Promise(res => {
    const from = { x: p.g.position.x, z: p.g.position.z }, to = tileToWorld(c, r);
    p.c = c; p.r = r; p.anim = { from, to, t: 0, dur, arc, done: res };
  });
}
const easeIO = (p) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

function spawnShards(pos, color) {
  const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, flatShading: true, roughness: 0.2 });
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Mesh(new THREE.TetrahedronGeometry(0.12), m);
    s.position.copy(pos); s.position.y += REST_Y; boardGroup.add(s);
    const a = Math.random() * 6.28, sp = 0.04 + Math.random() * 0.06;
    particles.push({ s, vx: Math.cos(a) * sp, vy: 0.07 + Math.random() * 0.08, vz: Math.sin(a) * sp,
      rx: Math.random() * 0.4, ry: Math.random() * 0.4, life: 1 });
  }
}
function capture(p) { spawnShards(p.g.position, TEAMS[p.team].glow); dying.push({ g: p.g, t: 0 }); pieces = pieces.filter(x => x !== p); }
function squash(p) { p.squash = 1; }
function shakeNow() { shake = 0.3; }
function promote(p) {
  p.promoted = true; p.grow = 1;
  p.g.userData.mat.emissiveIntensity = 0.95;
  const crown = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.07, 12, 26),
    new THREE.MeshStandardMaterial({ color: 0xffe27a, emissive: 0xffc23a, emissiveIntensity: 0.7, metalness: 0.6, roughness: 0.2 }));
  crown.rotation.x = Math.PI / 2; crown.position.y = REST_Y + 0.6; crown.castShadow = true; p.g.add(crown); p.crown = crown;
}

function clearBoard() {
  [...pieces, ...dying].forEach(o => boardGroup.remove(o.g)); particles.forEach(pt => boardGroup.remove(pt.s));
  pieces = []; dying = []; particles = [];
}

async function play() {
  clearBoard();
  addPiece('pink', 0, 2); addPiece('pink', 2, 0); addPiece('pink', 2, 4); addPiece('pink', 4, 2);
  const t1 = addPiece('cyan', 1, 2), t2 = addPiece('cyan', 2, 1), t3 = addPiece('cyan', 2, 3), t4 = addPiece('cyan', 3, 2);
  addPiece('cyan', 0, 4); addPiece('pink', 4, 4);
  const m = addPiece('pink', 1, 0);
  comboEl && (comboEl.textContent = '0');

  cap('Two crews face off — Pink to move…'); await sleep(1300);
  cap('Hop into the center and surround them!');
  await hop(m, 2, 2, 0.6, 1.1); await sleep(250);

  const words = ['', '', 'DOUBLE!', 'TRIPLE!', 'ONSLAUGHT!', 'ANNIHILATION!'];
  const targets = [t1, t2, t3, t4]; let hits = 0;
  for (const tg of targets) {
    squash(m); capture(tg); hits++; comboEl && (comboEl.textContent = hits); shakeNow();
    if (hits >= 2) pop(words[Math.min(hits, 5)]);
    cap(hits === 1 ? 'CAPTURE! ✦' : 'Combo x' + hits + '!');
    await sleep(640);
  }
  await sleep(520);
  cap('7 captures — crown your Centurion!');
  promote(m); pop('CENTURION! 👑'); shakeNow(); await sleep(1500);
  cap('The Centurion glides across the board!');
  await hop(m, 3, 2, 0.5, 0.45); await hop(m, 1, 2, 0.6, 0.45); await hop(m, 2, 2, 0.6, 0.45);
  cap('Your turn — fancy one more? ✨'); await sleep(1600);
  play();
}

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}

function loop() {
  const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime;
  boardGroup.rotation.y = Math.sin(time * 0.3) * 0.14;

  pieces.forEach(p => {
    if (p.g.userData.gem) { p.g.userData.gem.rotation.y += dt * 0.8; p.g.userData.gem.rotation.x += dt * 0.35; }
    if (p.anim) {
      const a = p.anim; a.t += dt; const pr = Math.min(a.t / a.dur, 1), e = easeIO(pr);
      p.g.position.x = a.from.x + (a.to.x - a.from.x) * e;
      p.g.position.z = a.from.z + (a.to.z - a.from.z) * e;
      p.g.position.y = a.arc * Math.sin(Math.PI * pr);
      if (pr >= 1) { p.g.position.y = 0; p.anim = null; p.squash = 1; a.done && a.done(); }
    } else { p.g.position.y = Math.sin(time * 1.7 + p.phase) * 0.05; }
    if (p.squash > 0) { p.squash = Math.max(0, p.squash - dt * 4); const s = Math.sin(p.squash * Math.PI) * 0.18; p.g.scale.set(0.92 * (1 + s), 0.92 * (1 - s), 0.92 * (1 + s)); }
    else if (p.grow > 0) { p.grow = Math.max(0, p.grow - dt * 2); p.g.scale.setScalar(0.92 * (1 + Math.sin(p.grow * Math.PI) * 0.3)); }
    else p.g.scale.setScalar(p.promoted ? 1.05 : 0.92);
    if (p.crown) p.crown.rotation.z += dt * 1.6;
  });

  particles = particles.filter(pt => {
    pt.vy -= dt * 0.4; pt.s.position.x += pt.vx; pt.s.position.y += pt.vy; pt.s.position.z += pt.vz;
    pt.s.rotation.x += pt.rx; pt.s.rotation.y += pt.ry; pt.life -= dt * 1.6; pt.s.scale.setScalar(Math.max(0.01, pt.life));
    if (pt.life <= 0) { boardGroup.remove(pt.s); return false; } return true;
  });
  dying = dying.filter(d => {
    d.t += dt * 2.6; const k = Math.max(0, 1 - d.t); d.g.scale.setScalar(0.92 * k); d.g.rotation.y += dt * 12; d.g.position.y = d.t * 0.5;
    if (d.t >= 1) { boardGroup.remove(d.g); return false; } return true;
  });

  shake = Math.max(0, shake - dt);
  camera.position.set(camBase.x + (Math.random() * 2 - 1) * shake, camBase.y + (Math.random() * 2 - 1) * shake * 0.5, camBase.z);
  camera.lookAt(camLook);
  renderer.render(scene, camera);
}

try {
  if (!canvas) throw new Error('no canvas');
  if (typeof THREE === 'undefined') throw new Error('THREE not loaded');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100); camera.position.copy(camBase); camera.lookAt(camLook);

  scene.add(new THREE.AmbientLight(0xfff1d8, 0.6));
  scene.add(new THREE.HemisphereLight(0xfff3e0, 0xc9a86a, 0.5));
  const key = new THREE.DirectionalLight(0xfff4e2, 0.95); key.position.set(4, 9, 5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 4; key.shadow.bias = -0.0006;
  key.shadow.camera.near = 1; key.shadow.camera.far = 36;
  key.shadow.camera.left = -7; key.shadow.camera.right = 7; key.shadow.camera.top = 7; key.shadow.camera.bottom = -7;
  scene.add(key);
  const pl1 = new THREE.PointLight(0xffd089, 0.5, 24); pl1.position.set(-5, 4, 3); scene.add(pl1);
  const pl2 = new THREE.PointLight(0xffb060, 0.4, 24); pl2.position.set(5, 4, -3); scene.add(pl2);

  clock = new THREE.Clock();
  buildBoard();
  if (fallback) fallback.style.display = 'none';
  resize(); window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  renderer.setAnimationLoop(loop);

  const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting && !running) { running = true; play(); io.disconnect(); } }), { threshold: 0.2 });
  io.observe(canvas);
} catch (err) {
  console.warn('3D scene failed:', err);
  if (canvas) canvas.style.display = 'none';
  if (fallback) { fallback.style.display = 'block'; fallback.textContent = '3D needs a WebGL browser 🎮'; }
}
