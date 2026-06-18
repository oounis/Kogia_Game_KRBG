// Kharbga: Origins — 3D live match (Three.js, local UMD global build)
/* global THREE */

const canvas   = document.getElementById('scene3d');
const capEl    = document.getElementById('matchCap');
const popEl    = document.getElementById('comboPop');
const comboEl  = document.getElementById('comboN');
const fallback = document.getElementById('scene3dFallback');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function cap(t){ if(!capEl) return; capEl.style.opacity = 0; setTimeout(() => { capEl.textContent = t; capEl.style.opacity = 1; }, 150); }
function pop(t){ if(!popEl) return; popEl.textContent = t; popEl.classList.remove('show'); void popEl.offsetWidth; popEl.classList.add('show'); }

const N = 5, TILE = 1.3;
const TEAMS = {
  gold: { body: 0xffb71e, head: 0xffd778, ear: 0xe09100, helm: 0xff5b39, glow: 0xffd24a },
  teal: { body: 0x13b58f, head: 0x6fe0c6, ear: 0x0c8e6f, helm: 0x2176d6, glow: 0x47e7c4 }
};
const tileToWorld = (c, r) => ({ x: (c - (N - 1) / 2) * TILE, z: (r - (N - 1) / 2) * TILE });

let renderer, scene, camera, boardGroup, clock;
let pieces = [], particles = [], dying = [], shake = 0, running = false;
const camBase = new THREE.Vector3(0, 8.4, 10.4);

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: opts.r ?? 0.5, metalness: opts.m ?? 0.05,
    emissive: opts.e ?? 0x000000, emissiveIntensity: opts.ei ?? 0 });
}

function makeDog(team) {
  const C = TEAMS[team], g = new THREE.Group(), bodyMats = [];
  const add = (geo, m, x, y, z) => { const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); mesh.castShadow = true; g.add(mesh); return mesh; };
  // base coin
  add(new THREE.CylinderGeometry(0.46, 0.54, 0.2, 30), mat(C.ear, { r: 0.4 }), 0, 0.1, 0);
  // body
  const bm = mat(C.body); bodyMats.push(bm);
  const body = add(new THREE.SphereGeometry(0.46, 26, 20), bm, 0, 0.72, 0); body.scale.set(1, 1.12, 0.95);
  // head
  const hm = mat(C.head); bodyMats.push(hm);
  add(new THREE.SphereGeometry(0.37, 26, 20), hm, 0, 1.42, 0.04);
  // snout + nose
  add(new THREE.SphereGeometry(0.17, 18, 14), hm, 0, 1.34, 0.34);
  add(new THREE.SphereGeometry(0.07, 12, 10), mat(0x2a1a12, { r: 0.3 }), 0, 1.37, 0.5);
  // ears
  const em = mat(C.ear);
  const e1 = add(new THREE.SphereGeometry(0.14, 14, 12), em, -0.33, 1.55, 0); e1.scale.set(0.65, 1.25, 0.5); e1.rotation.z = 0.4;
  const e2 = add(new THREE.SphereGeometry(0.14, 14, 12), em, 0.33, 1.55, 0); e2.scale.set(0.65, 1.25, 0.5); e2.rotation.z = -0.4;
  // eyes
  add(new THREE.SphereGeometry(0.06, 10, 8), mat(0x201510, { r: 0.2 }), -0.14, 1.46, 0.32);
  add(new THREE.SphereGeometry(0.06, 10, 8), mat(0x201510, { r: 0.2 }), 0.14, 1.46, 0.32);
  // helmet dome + crest
  const helm = add(new THREE.SphereGeometry(0.39, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(C.helm, { r: 0.35 }), 0, 1.5, 0.02);
  const crest = add(new THREE.BoxGeometry(0.09, 0.26, 0.4), mat(C.helm, { r: 0.35 }), 0, 1.78, 0.02);
  g.userData = { bodyMats, glow: C.glow, helm, crest };
  return g;
}

function buildBoard() {
  boardGroup = new THREE.Group(); scene.add(boardGroup);
  const span = N * TILE, pad = 0.7;
  // base
  const base = new THREE.Mesh(new THREE.BoxGeometry(span + pad, 0.6, span + pad), mat(0xffe6b8, { r: 0.8 }));
  base.position.y = -0.3; base.receiveShadow = true; boardGroup.add(base);
  // rim
  const rim = new THREE.Mesh(new THREE.BoxGeometry(span + pad + 0.18, 0.66, span + pad + 0.18), mat(0xffffff, { r: 0.7 }));
  rim.position.y = -0.32; boardGroup.add(rim); rim.renderOrder = -1;
  // tiles
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const isMid = (c === (N - 1) / 2 && r === (N - 1) / 2);
    const col = isMid ? 0xffb71e : ((c + r) % 2 ? 0xfff0cf : 0xffe0a0);
    const m = mat(col, { r: 0.75, e: isMid ? 0xffa000 : 0x000000, ei: isMid ? 0.45 : 0 });
    const t = new THREE.Mesh(new THREE.BoxGeometry(TILE * 0.92, 0.12, TILE * 0.92), m);
    const w = tileToWorld(c, r); t.position.set(w.x, 0.06, w.z); t.receiveShadow = true; boardGroup.add(t);
  }
}

function addPiece(team, c, r) {
  const g = makeDog(team); g.scale.setScalar(0.62);
  const w = tileToWorld(c, r); g.position.set(w.x, 0, w.z);
  boardGroup.add(g);
  const p = { g, team, c, r, phase: Math.random() * 6.28, anim: null, squash: 0, promoted: false, crown: null, grow: 0 };
  pieces.push(p); return p;
}

function hop(p, c, r, dur = 0.55, arc = 0.95) {
  return new Promise(res => {
    const from = { x: p.g.position.x, z: p.g.position.z }, to = tileToWorld(c, r);
    p.c = c; p.r = r; p.anim = { from, to, t: 0, dur, arc, done: res };
  });
}
const easeIO = (p) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

function spawnParticles(pos, color) {
  const m = mat(color, { r: 0.3, e: color, ei: 0.4 });
  for (let i = 0; i < 16; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), m);
    s.position.copy(pos); s.position.y += 0.7; boardGroup.add(s);
    const a = Math.random() * 6.28, sp = 0.04 + Math.random() * 0.07;
    particles.push({ s, vx: Math.cos(a) * sp, vy: 0.07 + Math.random() * 0.09, vz: Math.sin(a) * sp, life: 1 });
  }
}
function capture(p) {
  spawnParticles(p.g.position, TEAMS[p.team].glow);
  dying.push({ g: p.g, t: 0 });
  pieces = pieces.filter(x => x !== p);
}
function squash(p) { p.squash = 1; }
function shakeNow() { shake = 0.4; }
function promote(p) {
  p.promoted = true; p.grow = 1;
  p.g.userData.bodyMats.forEach(bm => { bm.emissive = new THREE.Color(p.g.userData.glow); bm.emissiveIntensity = 0.6; });
  const crown = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.08, 10, 22), mat(0xffd24a, { m: 0.6, r: 0.25, e: 0xffb71e, ei: 0.5 }));
  crown.rotation.x = Math.PI / 2; crown.position.y = 2.05; crown.castShadow = true; p.g.add(crown); p.crown = crown;
}

function clearBoard() {
  pieces.forEach(p => boardGroup.remove(p.g));
  dying.forEach(d => boardGroup.remove(d.g));
  particles.forEach(pt => boardGroup.remove(pt.s));
  pieces = []; dying = []; particles = [];
}

async function play() {
  clearBoard();
  addPiece('gold', 0, 2); addPiece('gold', 2, 0); addPiece('gold', 2, 4); addPiece('gold', 4, 2);
  const t1 = addPiece('teal', 1, 2), t2 = addPiece('teal', 2, 1), t3 = addPiece('teal', 2, 3), t4 = addPiece('teal', 3, 2);
  addPiece('teal', 0, 0); addPiece('gold', 4, 4);
  const m = addPiece('gold', 1, 0);
  comboEl && (comboEl.textContent = '0');

  cap('Two packs face off. Gold to move…'); await sleep(1300);
  cap('Hop into the Citadel — and surround them!');
  await hop(m, 2, 2, 0.62, 1.15); await sleep(250);

  const words = ['', '', 'DOUBLE!', 'TRIPLE!', 'ONSLAUGHT!', 'ANNIHILATION!'];
  const targets = [t1, t2, t3, t4]; let hits = 0;
  for (const tg of targets) {
    squash(m); capture(tg); hits++; comboEl && (comboEl.textContent = hits); shakeNow();
    if (hits >= 2) pop(words[Math.min(hits, 5)]);
    cap(hits === 1 ? 'CAPTURE! 🎯' : 'Combo x' + hits + '!');
    await sleep(640);
  }
  await sleep(520);
  cap('7 captures — crown your Centurion!');
  promote(m); pop('CENTURION! 👑'); shakeNow(); await sleep(1500);
  cap('The Centurion now slides across the board!');
  await hop(m, 3, 2, 0.5, 0.5); await hop(m, 1, 2, 0.62, 0.5); await hop(m, 2, 2, 0.62, 0.5);
  cap('Your turn — fancy one more game? 🐾'); await sleep(1600);
  play();
}

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}

function loop() {
  const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime;
  boardGroup.rotation.y += 0.0025;

  pieces.forEach(p => {
    if (p.anim) {
      const a = p.anim; a.t += dt; const pr = Math.min(a.t / a.dur, 1), e = easeIO(pr);
      p.g.position.x = a.from.x + (a.to.x - a.from.x) * e;
      p.g.position.z = a.from.z + (a.to.z - a.from.z) * e;
      p.g.position.y = a.arc * Math.sin(Math.PI * pr);
      if (pr >= 1) { p.g.position.y = 0; p.anim = null; p.squash = 1; a.done && a.done(); }
    } else {
      p.g.position.y = Math.sin(time * 2 + p.phase) * 0.04;
    }
    // squash & stretch
    if (p.squash > 0) { p.squash = Math.max(0, p.squash - dt * 4); const s = Math.sin(p.squash * Math.PI) * 0.18; p.g.scale.set(0.62 * (1 + s), 0.62 * (1 - s), 0.62 * (1 + s)); }
    else if (p.grow > 0) { p.grow = Math.max(0, p.grow - dt * 2); const s = 0.62 * (1 + Math.sin(p.grow * Math.PI) * 0.3); p.g.scale.setScalar(s); }
    else p.g.scale.setScalar(p.promoted ? 0.7 : 0.62);
    if (p.crown) p.crown.rotation.z += dt * 2;
  });

  // particles
  particles = particles.filter(pt => {
    pt.vy -= dt * 0.4; pt.s.position.x += pt.vx; pt.s.position.y += pt.vy; pt.s.position.z += pt.vz;
    pt.life -= dt * 1.7; pt.s.scale.setScalar(Math.max(0.01, pt.life));
    if (pt.life <= 0) { boardGroup.remove(pt.s); return false; } return true;
  });
  // dying pieces
  dying = dying.filter(d => {
    d.t += dt * 2.6; const k = Math.max(0, 1 - d.t); d.g.scale.setScalar(0.62 * k); d.g.rotation.y += dt * 12; d.g.position.y = d.t * 0.6;
    if (d.t >= 1) { boardGroup.remove(d.g); return false; } return true;
  });

  // camera with shake
  shake = Math.max(0, shake - dt);
  camera.position.set(camBase.x + (Math.random() * 2 - 1) * shake, camBase.y + (Math.random() * 2 - 1) * shake * 0.5, camBase.z);
  camera.lookAt(0, 0.7, 0);

  renderer.render(scene, camera);
}

try {
  if (!canvas) throw new Error('no canvas');
  if (typeof THREE === 'undefined') throw new Error('THREE not loaded');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100); camera.position.copy(camBase); camera.lookAt(0, 0.7, 0);

  scene.add(new THREE.HemisphereLight(0xfff4e2, 0x9a7b52, 0.65));
  scene.add(new THREE.AmbientLight(0xfff1de, 0.35));
  const key = new THREE.DirectionalLight(0xfff0d0, 1.25); key.position.set(5, 11, 6); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.near = 1; key.shadow.camera.far = 40;
  key.shadow.camera.left = -8; key.shadow.camera.right = 8; key.shadow.camera.top = 8; key.shadow.camera.bottom = -8; key.shadow.bias = -0.0006;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff7a4a, 0.4); rim.position.set(-6, 4, -5); scene.add(rim);

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
