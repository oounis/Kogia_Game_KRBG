// Kharbga: Origins — 3D live match (Three.js, clay / Monument-Valley pastel style)
/* global THREE */

const canvas   = document.getElementById('scene3d');
const capEl    = document.getElementById('matchCap');
const popEl    = document.getElementById('comboPop');
const comboEl  = document.getElementById('comboN');
const fallback = document.getElementById('scene3dFallback');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function cap(t){ if(!capEl) return; capEl.style.opacity = 0; setTimeout(() => { capEl.textContent = t; capEl.style.opacity = 1; }, 150); }
function pop(t){ if(!popEl) return; popEl.textContent = t; popEl.classList.remove('show'); void popEl.offsetWidth; popEl.classList.add('show'); }

const N = 5, TILE = 1.25, REST_Y = 0.18;
// soft pastel (claymorphism) palette
const TEAMS = {
  coral: { body: 0xef8a6a, head: 0xf6a98c, base: 0xd96e50, glow: 0xffb27a },
  mint:  { body: 0x6fc6ad, head: 0x97dac8, base: 0x4ea791, glow: 0x9fe7d4 }
};
const tileToWorld = (c, r) => ({ x: (c - (N - 1) / 2) * TILE, z: (r - (N - 1) / 2) * TILE });

let renderer, scene, camera, boardGroup, clock;
let pieces = [], particles = [], dying = [], shake = 0, running = false;
const camBase = new THREE.Vector3(0, 6.2, 8.4);
const camLook = new THREE.Vector3(0, 0.45, 0);

// matte clay material
function clay(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: opts.r ?? 0.92, metalness: 0,
    emissive: opts.e ?? 0x000000, emissiveIntensity: opts.ei ?? 0 });
}

function makePawn(team) {
  const C = TEAMS[team], g = new THREE.Group(), bodyMats = [];
  const add = (geo, m, x, y, z) => { const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); return mesh; };
  // soft cushion base
  const base = add(new THREE.SphereGeometry(0.44, 28, 20), clay(C.base), 0, 0.14, 0); base.scale.set(1, 0.34, 1);
  // plump body
  const bm = clay(C.body); bodyMats.push(bm);
  const body = add(new THREE.SphereGeometry(0.42, 30, 24), bm, 0, 0.62, 0); body.scale.set(1, 1.12, 1);
  // head
  const hm = clay(C.head); bodyMats.push(hm);
  add(new THREE.SphereGeometry(0.3, 28, 22), hm, 0, 1.2, 0.02);
  // tiny eyes (charming, minimal)
  add(new THREE.SphereGeometry(0.045, 12, 10), clay(0x3a2a20, { r: 0.4 }), -0.11, 1.24, 0.26);
  add(new THREE.SphereGeometry(0.045, 12, 10), clay(0x3a2a20, { r: 0.4 }), 0.11, 1.24, 0.26);
  // little rounded ears
  const e1 = add(new THREE.SphereGeometry(0.1, 14, 12), clay(C.base), -0.24, 1.34, 0); e1.scale.set(0.7, 1, 0.6);
  const e2 = add(new THREE.SphereGeometry(0.1, 14, 12), clay(C.base), 0.24, 1.34, 0); e2.scale.set(0.7, 1, 0.6);
  g.userData = { bodyMats, glow: C.glow };
  return g;
}

function buildBoard() {
  boardGroup = new THREE.Group(); scene.add(boardGroup);
  const span = N * TILE;
  // soft frame (bevel) + base
  const frame = new THREE.Mesh(new THREE.BoxGeometry(span + 1.0, 0.4, span + 1.0), clay(0xfff6e9, { r: 0.95 }));
  frame.position.y = -0.5; frame.receiveShadow = true; boardGroup.add(frame);
  const baseB = new THREE.Mesh(new THREE.BoxGeometry(span + 0.5, 0.42, span + 0.5), clay(0xf4e6cb, { r: 0.95 }));
  baseB.position.y = -0.22; baseB.receiveShadow = true; boardGroup.add(baseB);
  // tiles — gentle two-tone with a soft coral Citadel
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const isMid = (c === (N - 1) / 2 && r === (N - 1) / 2);
    const col = isMid ? 0xffc89a : ((c + r) % 2 ? 0xfff1dc : 0xf3dfba);
    const m = clay(col, { r: 0.9, e: isMid ? 0xff9a5a : 0x000000, ei: isMid ? 0.35 : 0 });
    const t = new THREE.Mesh(new THREE.BoxGeometry(TILE * 0.9, 0.14, TILE * 0.9), m);
    const w = tileToWorld(c, r); t.position.set(w.x, 0.07, w.z); t.receiveShadow = true; boardGroup.add(t);
  }
}

function addPiece(team, c, r) {
  const g = makePawn(team); g.scale.setScalar(0.72);
  const w = tileToWorld(c, r); g.position.set(w.x, REST_Y, w.z);
  boardGroup.add(g);
  const p = { g, team, c, r, phase: Math.random() * 6.28, anim: null, squash: 0, promoted: false, crown: null, grow: 0 };
  pieces.push(p); return p;
}

function hop(p, c, r, dur = 0.55, arc = 0.85) {
  return new Promise(res => {
    const from = { x: p.g.position.x, z: p.g.position.z }, to = tileToWorld(c, r);
    p.c = c; p.r = r; p.anim = { from, to, t: 0, dur, arc, done: res };
  });
}
const easeIO = (p) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

function spawnParticles(pos, color) {
  const m = clay(color, { r: 0.5, e: color, ei: 0.3 });
  for (let i = 0; i < 12; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), m);
    s.position.copy(pos); s.position.y += 0.6; boardGroup.add(s);
    const a = Math.random() * 6.28, sp = 0.03 + Math.random() * 0.05;
    particles.push({ s, vx: Math.cos(a) * sp, vy: 0.06 + Math.random() * 0.07, vz: Math.sin(a) * sp, life: 1 });
  }
}
function capture(p) { spawnParticles(p.g.position, TEAMS[p.team].glow); dying.push({ g: p.g, t: 0 }); pieces = pieces.filter(x => x !== p); }
function squash(p) { p.squash = 1; }
function shakeNow() { shake = 0.28; }
function promote(p) {
  p.promoted = true; p.grow = 1;
  p.g.userData.bodyMats.forEach(bm => { bm.emissive = new THREE.Color(p.g.userData.glow); bm.emissiveIntensity = 0.45; });
  const crown = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 12, 24), clay(0xf2c66a, { r: 0.4, e: 0xe0a23a, ei: 0.4 }));
  crown.rotation.x = Math.PI / 2; crown.position.y = 1.62; crown.castShadow = true; p.g.add(crown); p.crown = crown;
}

function clearBoard() {
  pieces.forEach(p => boardGroup.remove(p.g));
  dying.forEach(d => boardGroup.remove(d.g));
  particles.forEach(pt => boardGroup.remove(pt.s));
  pieces = []; dying = []; particles = [];
}

async function play() {
  clearBoard();
  addPiece('coral', 0, 2); addPiece('coral', 2, 0); addPiece('coral', 2, 4); addPiece('coral', 4, 2);
  const t1 = addPiece('mint', 1, 2), t2 = addPiece('mint', 2, 1), t3 = addPiece('mint', 2, 3), t4 = addPiece('mint', 3, 2);
  addPiece('mint', 0, 4); addPiece('coral', 4, 4);
  const m = addPiece('coral', 1, 0);
  comboEl && (comboEl.textContent = '0');

  cap('Two packs face off — Coral to move…'); await sleep(1300);
  cap('Hop into the Citadel and surround them!');
  await hop(m, 2, 2, 0.6, 1.05); await sleep(260);

  const words = ['', '', 'DOUBLE!', 'TRIPLE!', 'ONSLAUGHT!', 'ANNIHILATION!'];
  const targets = [t1, t2, t3, t4]; let hits = 0;
  for (const tg of targets) {
    squash(m); capture(tg); hits++; comboEl && (comboEl.textContent = hits); shakeNow();
    if (hits >= 2) pop(words[Math.min(hits, 5)]);
    cap(hits === 1 ? 'CAPTURE! 🎯' : 'Combo x' + hits + '!');
    await sleep(650);
  }
  await sleep(520);
  cap('7 captures — crown your Centurion!');
  promote(m); pop('CENTURION! 👑'); shakeNow(); await sleep(1500);
  cap('The Centurion glides across the board!');
  await hop(m, 3, 2, 0.5, 0.4); await hop(m, 1, 2, 0.6, 0.4); await hop(m, 2, 2, 0.6, 0.4);
  cap('Your turn — fancy one more? 🐾'); await sleep(1600);
  play();
}

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}

function loop() {
  const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime;
  // gentle SWAY (not a full spin)
  boardGroup.rotation.y = Math.sin(time * 0.32) * 0.13;

  pieces.forEach(p => {
    if (p.anim) {
      const a = p.anim; a.t += dt; const pr = Math.min(a.t / a.dur, 1), e = easeIO(pr);
      p.g.position.x = a.from.x + (a.to.x - a.from.x) * e;
      p.g.position.z = a.from.z + (a.to.z - a.from.z) * e;
      p.g.position.y = REST_Y + a.arc * Math.sin(Math.PI * pr);
      if (pr >= 1) { p.g.position.y = REST_Y; p.anim = null; p.squash = 1; a.done && a.done(); }
    } else {
      p.g.position.y = REST_Y + Math.sin(time * 1.8 + p.phase) * 0.035;
    }
    if (p.squash > 0) { p.squash = Math.max(0, p.squash - dt * 4); const s = Math.sin(p.squash * Math.PI) * 0.16; p.g.scale.set(0.72 * (1 + s), 0.72 * (1 - s), 0.72 * (1 + s)); }
    else if (p.grow > 0) { p.grow = Math.max(0, p.grow - dt * 2); const s = 0.72 * (1 + Math.sin(p.grow * Math.PI) * 0.28); p.g.scale.setScalar(s); }
    else p.g.scale.setScalar(p.promoted ? 0.8 : 0.72);
    if (p.crown) p.crown.rotation.z += dt * 1.6;
  });

  particles = particles.filter(pt => {
    pt.vy -= dt * 0.35; pt.s.position.x += pt.vx; pt.s.position.y += pt.vy; pt.s.position.z += pt.vz;
    pt.life -= dt * 1.7; pt.s.scale.setScalar(Math.max(0.01, pt.life));
    if (pt.life <= 0) { boardGroup.remove(pt.s); return false; } return true;
  });
  dying = dying.filter(d => {
    d.t += dt * 2.6; const k = Math.max(0, 1 - d.t); d.g.scale.setScalar(0.72 * k); d.g.rotation.y += dt * 10; d.g.position.y = REST_Y + d.t * 0.5;
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
  camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100); camera.position.copy(camBase); camera.lookAt(camLook);

  // soft, clay-friendly lighting (lots of fill, gentle shadows)
  scene.add(new THREE.HemisphereLight(0xfff5e8, 0xe8c9a6, 0.95));
  scene.add(new THREE.AmbientLight(0xfff2e0, 0.25));
  const key = new THREE.DirectionalLight(0xfff1da, 0.9); key.position.set(4.5, 9, 6); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 5; key.shadow.bias = -0.0006;
  key.shadow.camera.near = 1; key.shadow.camera.far = 36;
  key.shadow.camera.left = -7; key.shadow.camera.right = 7; key.shadow.camera.top = 7; key.shadow.camera.bottom = -7;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffd9b8, 0.3); fill.position.set(-5, 4, -4); scene.add(fill);

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
