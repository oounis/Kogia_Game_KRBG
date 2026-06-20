// Kharbga: Origins — dramatic 3D combo demo, warm Roman style (Three.js, local UMD)
/* global THREE */

const canvas   = document.getElementById('scene3d');
const capEl    = document.getElementById('matchCap');
const popEl    = document.getElementById('comboPop');
const comboEl  = document.getElementById('comboN');
const flashEl  = document.getElementById('stageFlash');
const fallback = document.getElementById('scene3dFallback');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function cap(t){ if(!capEl) return; capEl.style.opacity = 0; setTimeout(() => { capEl.textContent = t; capEl.style.opacity = 1; }, 150); }
function pop(t){ if(!popEl) return; popEl.textContent = t; popEl.classList.remove('show'); void popEl.offsetWidth; popEl.classList.add('show'); }
function flash(strong){ if(!flashEl) return; flashEl.classList.remove('on','big'); void flashEl.offsetWidth; flashEl.classList.add(strong ? 'big' : 'on'); }

const N = 5, TILE = 1.28, REST_Y = 0.14;
const TEAMS = {
  terra: { body: 0xc1623a, head: 0xd58a5b, crest: 0xa8331f, glow: 0xeaa05a },
  slate: { body: 0x70808c, head: 0x97a6b0, crest: 0x3f6b78, glow: 0xaecbd6 }
};
const tileToWorld = (c, r) => ({ x: (c - (N - 1) / 2) * TILE, z: (r - (N - 1) / 2) * TILE });

let renderer, scene, camera, boardGroup, clock, midMat;
let pieces = [], particles = [], dying = [], rings = [], shake = 0, push = 0, running = false;
const camBase = new THREE.Vector3(0, 5.4, 7.8), camLook = new THREE.Vector3(0, 0.35, 0);

function clay(c, o = {}) { return new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.86, metalness: 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 0 }); }
function pawnProfile(){ return [[0,0],[0.4,0],[0.42,0.06],[0.27,0.15],[0.18,0.34],[0.155,0.5],[0.23,0.58],[0.165,0.64],[0,0.66]].map(a=>new THREE.Vector2(a[0],a[1])); }
function makePiece(team){
  const C = TEAMS[team], g = new THREE.Group(), bodyMats = [];
  const bm = clay(C.body); bodyMats.push(bm);
  const body = new THREE.Mesh(new THREE.LatheGeometry(pawnProfile(), 26), bm); body.castShadow = true; g.add(body);
  const hm = clay(C.head); bodyMats.push(hm);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 18), hm); head.position.y = 0.72; head.castShadow = true; g.add(head);
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.24, 14), clay(C.crest, { r: 0.6 })); crest.position.y = 0.94; crest.castShadow = true; g.add(crest);
  g.userData = { bodyMats, glow: C.glow };
  return g;
}

function buildBoard(){
  boardGroup = new THREE.Group(); scene.add(boardGroup);
  const span = N * TILE;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(span+0.9,0.42,span+0.9), clay(0xcaa468,{r:0.9})); frame.position.y=-0.42; frame.receiveShadow=true; boardGroup.add(frame);
  const base = new THREE.Mesh(new THREE.BoxGeometry(span+0.42,0.42,span+0.42), clay(0xb9914f,{r:0.95})); base.position.y=-0.18; base.receiveShadow=true; boardGroup.add(base);
  for (let r=0;r<N;r++) for (let c=0;c<N;c++){
    const isMid = (c===(N-1)/2 && r===(N-1)/2);
    const col = isMid ? 0xf0d49a : ((c+r)%2 ? 0xecd1a0 : 0xddba7c);
    const m = clay(col,{r:0.85, e:isMid?0xdd9f2c:0x000000, ei:isMid?0.5:0}); if(isMid) midMat=m;
    const t = new THREE.Mesh(new THREE.BoxGeometry(TILE*0.9,0.14,TILE*0.9), m);
    const w = tileToWorld(c,r); t.position.set(w.x,0.06,w.z); t.receiveShadow=true; boardGroup.add(t);
  }
}

function addPiece(team,c,r){ const g=makePiece(team); g.scale.setScalar(0.94); const w=tileToWorld(c,r); g.position.set(w.x,REST_Y,w.z); boardGroup.add(g);
  const p={g,team,c,r,phase:Math.random()*6.28,anim:null,squash:0,promoted:false,crown:null,grow:0}; pieces.push(p); return p; }

function hop(p,c,r,dur=0.55,arc=0.85){ return new Promise(res=>{ const from={x:p.g.position.x,z:p.g.position.z},to=tileToWorld(c,r); p.c=c;p.r=r; p.anim={from,to,t:0,dur,arc,done:res}; }); }
const easeIO = (p)=> p<0.5 ? 2*p*p : 1-Math.pow(-2*p+2,2)/2;

function burst(pos, color, n, sparky){
  const m = clay(color,{r:0.5,e:color,ei:0.5});
  for(let i=0;i<n;i++){ const geo = sparky ? new THREE.TetrahedronGeometry(0.1) : new THREE.SphereGeometry(0.08,8,6);
    const s=new THREE.Mesh(geo,m); s.position.copy(pos); s.position.y+=0.4; boardGroup.add(s);
    const a=Math.random()*6.28, sp=(sparky?0.06:0.035)+Math.random()*0.06;
    particles.push({s,vx:Math.cos(a)*sp,vy:0.06+Math.random()*0.1,vz:Math.sin(a)*sp,rx:Math.random()*0.5,ry:Math.random()*0.5,life:1}); }
}
function ringBurst(pos,color){ const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.9,side:THREE.DoubleSide});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(0.4,0.06,10,40),m); ring.rotation.x=Math.PI/2; ring.position.copy(pos); ring.position.y+=0.4; boardGroup.add(ring); rings.push({m:ring,mat:m,t:0}); }
function capture(p){ burst(p.g.position,TEAMS[p.team].glow,16,true); dying.push({g:p.g,t:0}); pieces=pieces.filter(x=>x!==p); flash(false); }
function squash(p){ p.squash=1; }
function shakeNow(s){ shake=s||0.3; }
function promote(p){
  p.promoted=true; p.grow=1;
  p.g.userData.bodyMats.forEach(bm=>{ bm.emissive=new THREE.Color(p.g.userData.glow); bm.emissiveIntensity=0.55; });
  const crown=new THREE.Mesh(new THREE.TorusGeometry(0.24,0.06,12,24), new THREE.MeshStandardMaterial({color:0xf2c66a,emissive:0xe0a23a,emissiveIntensity:0.7,metalness:0.5,roughness:0.3}));
  crown.rotation.x=Math.PI/2; crown.position.y=1.05; crown.castShadow=true; p.g.add(crown); p.crown=crown;
  ringBurst(p.g.position,0xffd27a); burst(p.g.position,0xffe2a0,26,true); flash(true); shakeNow(0.5); push=1;
}

function clearBoard(){ [...pieces,...dying].forEach(o=>boardGroup.remove(o.g)); particles.forEach(pt=>boardGroup.remove(pt.s)); rings.forEach(r=>boardGroup.remove(r.m)); pieces=[];dying=[];particles=[];rings=[]; }

async function play(){
  clearBoard();
  addPiece('terra',0,2);addPiece('terra',2,0);addPiece('terra',2,4);addPiece('terra',4,2);
  const t1=addPiece('slate',1,2),t2=addPiece('slate',2,1),t3=addPiece('slate',2,3),t4=addPiece('slate',3,2);
  addPiece('slate',0,4);addPiece('terra',4,4);
  const m=addPiece('terra',1,0); comboEl&&(comboEl.textContent='0');
  cap('Two legions face off — your move…'); await sleep(1300);
  cap('March into the Citadel and surround them!'); await hop(m,2,2,0.6,1.0); await sleep(250);
  const words=['','','II · DUO!','III · TRES!','IV · QUATTUOR!','V · LEGIO!'], targets=[t1,t2,t3,t4]; let hits=0;
  for(const tg of targets){ squash(m); capture(tg); hits++; comboEl&&(comboEl.textContent=hits); shakeNow(0.3);
    if(hits>=2) pop(words[Math.min(hits,5)]); cap(hits===1?'STRIKE! ⚔️':'Combo '+hits+'!'); await sleep(640); }
  await sleep(500); cap('Seven kills — rise, Centurion!'); promote(m); pop('VICTORIA! 👑'); await sleep(1600);
  cap('The Centurion marches across the board!'); await hop(m,3,2,0.5,0.45); await hop(m,1,2,0.6,0.45); await hop(m,2,2,0.6,0.45);
  cap('Your turn — fancy one more? ⚔️'); await sleep(1600); play();
}

function resize(){ const w=canvas.clientWidth,h=canvas.clientHeight; if(!w||!h)return; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }

function loop(){
  const dt=Math.min(clock.getDelta(),0.05), time=clock.elapsedTime;
  boardGroup.rotation.y = Math.sin(time*0.26)*0.11;
  if(midMat) midMat.emissiveIntensity = 0.42 + Math.sin(time*2.4)*0.18;

  pieces.forEach(p=>{
    if(p.anim){ const a=p.anim; a.t+=dt; const pr=Math.min(a.t/a.dur,1),e=easeIO(pr);
      p.g.position.x=a.from.x+(a.to.x-a.from.x)*e; p.g.position.z=a.from.z+(a.to.z-a.from.z)*e; p.g.position.y=REST_Y+a.arc*Math.sin(Math.PI*pr);
      if(pr>=1){ p.g.position.y=REST_Y; p.anim=null; p.squash=1; a.done&&a.done(); } }
    else p.g.position.y=REST_Y+Math.sin(time*1.6+p.phase)*0.03;
    if(p.squash>0){ p.squash=Math.max(0,p.squash-dt*4); const s=Math.sin(p.squash*Math.PI)*0.16; p.g.scale.set(0.94*(1+s),0.94*(1-s),0.94*(1+s)); }
    else if(p.grow>0){ p.grow=Math.max(0,p.grow-dt*2); p.g.scale.setScalar(0.94*(1+Math.sin(p.grow*Math.PI)*0.28)); }
    else p.g.scale.setScalar(p.promoted?1.06:0.94);
    if(p.crown) p.crown.rotation.z+=dt*1.6;
  });
  particles=particles.filter(pt=>{ pt.vy-=dt*0.35; pt.s.position.x+=pt.vx; pt.s.position.y+=pt.vy; pt.s.position.z+=pt.vz;
    if(pt.rx){pt.s.rotation.x+=pt.rx;pt.s.rotation.y+=pt.ry;} pt.life-=dt*1.6; pt.s.scale.setScalar(Math.max(0.01,pt.life));
    if(pt.life<=0){boardGroup.remove(pt.s);return false;} return true; });
  rings=rings.filter(r=>{ r.t+=dt*1.7; r.m.scale.setScalar(1+r.t*4); r.mat.opacity=Math.max(0,0.9*(1-r.t)); if(r.t>=1){boardGroup.remove(r.m);return false;} return true; });
  dying=dying.filter(d=>{ d.t+=dt*2.6; const k=Math.max(0,1-d.t); d.g.scale.setScalar(0.94*k); d.g.rotation.y+=dt*11; d.g.position.y=REST_Y+d.t*0.5; if(d.t>=1){boardGroup.remove(d.g);return false;} return true; });

  shake=Math.max(0,shake-dt*1.4); push=Math.max(0,push-dt*1.1);
  const breath=Math.sin(time*0.4)*0.12;
  camera.position.set(camBase.x+(Math.random()*2-1)*shake, camBase.y+breath+(Math.random()*2-1)*shake*0.5, camBase.z-push*1.8);
  camera.lookAt(camLook);
  renderer.render(scene,camera);
}

try {
  if(!canvas) throw new Error('no canvas');
  if(typeof THREE==='undefined') throw new Error('THREE not loaded');
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true}); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene(); camera=new THREE.PerspectiveCamera(40,1,0.1,100); camera.position.copy(camBase); camera.lookAt(camLook);
  scene.add(new THREE.AmbientLight(0xfff1d8,0.6)); scene.add(new THREE.HemisphereLight(0xfff3e0,0xc9a86a,0.55));
  const key=new THREE.DirectionalLight(0xfff4e2,0.95); key.position.set(4,9,5); key.castShadow=true;
  key.shadow.mapSize.set(1024,1024); key.shadow.radius=4; key.shadow.bias=-0.0006; key.shadow.camera.near=1; key.shadow.camera.far=36;
  key.shadow.camera.left=-7; key.shadow.camera.right=7; key.shadow.camera.top=7; key.shadow.camera.bottom=-7; scene.add(key);
  const pl1 = new THREE.PointLight(0xffd089,0.5,24); pl1.position.set(-5,4,3); scene.add(pl1);
  const pl2 = new THREE.PointLight(0xffb060,0.4,24); pl2.position.set(5,4,-3); scene.add(pl2);
  clock=new THREE.Clock(); buildBoard();
  if(fallback) fallback.style.display='none';
  resize(); window.addEventListener('resize',resize); if(window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  renderer.setAnimationLoop(loop);
  const io=new IntersectionObserver((es)=>es.forEach(e=>{ if(e.isIntersecting&&!running){running=true;play();io.disconnect();} }),{threshold:0.2}); io.observe(canvas);
} catch(err){ console.warn('3D scene failed:',err); if(canvas)canvas.style.display='none'; if(fallback){fallback.style.display='block';fallback.textContent='3D needs a WebGL browser 🎮';} }
