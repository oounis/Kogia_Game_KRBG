// Kharbga: Origins — interactive 3D board, Carthage luxe (gold vs Tyrian purple)
/* global THREE */
(function(){
  var canvas=document.getElementById('scene3d'); if(!canvas) return;
  var fallback=document.getElementById('scene3dFallback');
  var stepEl=document.getElementById('labStep'), instrEl=document.getElementById('labInstr'),
      fbEl=document.getElementById('labFeedback'), resetBtn=document.getElementById('labReset'),
      tabsEl=document.getElementById('labTabs');

  var renderer,scene,camera,clock,raycaster,ndc;
  var BOARD=7, TILE=1.0;
  var tiles=[], pieces=[], markers=[], selected=null, current=0, done=false;
  var cam={R:9.6, az:Math.PI*0.5, pol:0.8, target:new THREE.Vector3(0,0.1,0)};
  var t2w=function(c,r){ return {x:(c-(BOARD-1)/2)*TILE, z:(r-(BOARD-1)/2)*TILE}; };
  var GOLD={body:0xd4af37,top:0xeccb62,crest:0x9a7b1e,glow:0xffe08a};
  var PURP={body:0x6a3b8f,top:0x9159b8,crest:0x46256a,glow:0xc79bef};

  function mat(c,o){o=o||{};return new THREE.MeshStandardMaterial({color:c,roughness:o.r==null?0.55:o.r,metalness:o.m==null?0.1:o.m,emissive:o.e||0x000000,emissiveIntensity:o.ei||0});}
  function updateCam(){var s=Math.sin(cam.pol);camera.position.set(cam.target.x+cam.R*s*Math.cos(cam.az),cam.target.y+cam.R*Math.cos(cam.pol),cam.target.z+cam.R*s*Math.sin(cam.az));camera.lookAt(cam.target);}

  function buildBoard(){
    var g=new THREE.Group(); scene.add(g); var span=BOARD*TILE;
    var base=new THREE.Mesh(new THREE.BoxGeometry(span+0.7,0.5,span+0.7),mat(0x2a153f,{r:0.7,m:0.2})); base.position.y=-0.27; base.receiveShadow=true; g.add(base);
    var frame=new THREE.Mesh(new THREE.BoxGeometry(span+1.0,0.4,span+1.0),mat(0x3b1d5e,{r:0.6,m:0.25})); frame.position.y=-0.42; g.add(frame);
    for(var r=0;r<BOARD;r++)for(var c=0;c<BOARD;c++){
      var mid=(c===(BOARD-1)/2&&r===(BOARD-1)/2);
      var col=mid?0xf0d79a:((c+r)%2?0xf4ecd8:0xe5d4b0);
      var m=mat(col,{r:0.6,m:0.05,e:mid?0xd4af37:0x000000,ei:mid?0.4:0});
      var t=new THREE.Mesh(new THREE.BoxGeometry(TILE*0.94,0.12,TILE*0.94),m);
      var w=t2w(c,r); t.position.set(w.x,0,w.z); t.receiveShadow=true; t.userData={c:c,r:r}; g.add(t); tiles.push(t);
    }
  }

  function makeMesh(side){
    var C=side==='you'?GOLD:PURP, g=new THREE.Group();
    var body=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.36,0.34,28),mat(C.body,{r:0.4,m:side==='you'?0.55:0.2})); body.position.y=0.27; body.castShadow=true; g.add(body);
    var head=new THREE.Mesh(new THREE.SphereGeometry(0.22,22,18),mat(C.top,{r:0.4,m:side==='you'?0.5:0.2})); head.position.y=0.5; head.castShadow=true; g.add(head);
    var crest=new THREE.Mesh(new THREE.ConeGeometry(0.05,0.18,14),mat(C.crest,{r:0.5})); crest.position.y=0.68; g.add(crest);
    g.userData.bodyMat=body.material; g.userData.glow=C.glow;
    return g;
  }
  function addPiece(side,c,r,sel){ var mesh=makeMesh(side); var w=t2w(c,r); mesh.position.set(w.x,0,w.z); scene.add(mesh);
    var p={side:side,c:c,r:r,mesh:mesh,selectable:!!sel,anim:null}; mesh.userData.piece=p; pieces.push(p); return p; }
  function pieceAt(c,r){ for(var i=0;i<pieces.length;i++) if(pieces[i].c===c&&pieces[i].r===r) return pieces[i]; return null; }
  function clearAll(){ pieces.forEach(function(p){scene.remove(p.mesh);}); pieces=[]; clearMarkers(); selected=null; }

  var DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
  function inB(c,r){return c>=0&&c<BOARD&&r>=0&&r<BOARD;}
  function legalMoves(p){ var out=[]; DIRS.forEach(function(d){var c=p.c+d[0],r=p.r+d[1]; if(inB(c,r)&&!pieceAt(c,r)) out.push({c:c,r:r});}); return out; }
  function detectCaptures(mp){ var caps=[]; DIRS.forEach(function(d){ var ec=mp.c+d[0],er=mp.r+d[1]; var e=pieceAt(ec,er);
    if(e&&e.side!==mp.side){ var b=pieceAt(ec+d[0],er+d[1]); if(b&&b.side===mp.side) caps.push(e); } }); return caps; }

  function clearMarkers(){ markers.forEach(function(m){scene.remove(m);}); markers=[]; }
  function showMarkers(cells){ clearMarkers(); cells.forEach(function(cell){ var w=t2w(cell.c,cell.r);
    var ring=new THREE.Mesh(new THREE.TorusGeometry(0.32,0.045,10,28),new THREE.MeshBasicMaterial({color:0xd4af37,transparent:true,opacity:0.95}));
    ring.rotation.x=Math.PI/2; ring.position.set(w.x,0.12,w.z); scene.add(ring); markers.push(ring); }); }
  function selectPiece(p){ deselect(); selected=p; p.mesh.userData.bodyMat.emissive=new THREE.Color(0xffe08a); p.mesh.userData.bodyMat.emissiveIntensity=0.6; showMarkers(legalMoves(p)); feedback(''); }
  function deselect(){ if(selected) selected.mesh.userData.bodyMat.emissiveIntensity=0; selected=null; clearMarkers(); }

  function animateMove(p,c,r,after){ var w=t2w(c,r); p.anim={fx:p.mesh.position.x,fz:p.mesh.position.z,tx:w.x,tz:w.z,t:0,after:after}; p.c=c; p.r=r; }

  var SCEN=[
   { title:'I · Moves', instr:'Tap your glowing gold soldier, then tap a marked square. Soldiers move ONE step — up, down, left or right (never diagonally).',
     setup:function(){ addPiece('you',3,3,true); addPiece('foe',1,1); addPiece('foe',5,5); addPiece('foe',3,1); addPiece('foe',5,3); },
     onMove:function(){ return {ok:true,msg:'✓ Exactly. Soldiers march one square orthogonally. Now try II · Captures.',done:true}; } },
   { title:'II · Captures', instr:'Trap the purple enemy! Move so it sits BETWEEN two of your gold soldiers on a line.',
     setup:function(){ addPiece('you',1,3,true); addPiece('you',4,3); addPiece('foe',3,3); addPiece('foe',5,1); },
     onMove:function(p,c,r,caps){ return caps.length ? {ok:true,msg:'✓ CAPTURE! You sandwiched the enemy between two of yours — the soul of Kharbga.',done:true}
       : {ok:false,msg:'✗ Not yet — flank the enemy on TWO opposite sides. Reset and move to the square beside it.',done:false}; } },
   { title:'III · Winning', instr:'Coming next. You win by capturing every enemy, or blocking them so none can move. Experiment for now.',
     setup:function(){ addPiece('you',3,3,true); addPiece('foe',2,3); addPiece('foe',4,3); }, onMove:function(){return{ok:true,msg:'Goal: leave the enemy with no legal move. Full lesson soon.',done:false};} },
   { title:'IV · Strategy', instr:'Coming next — a free sandbox vs a thinking opponent. For now, move freely and explore.',
     setup:function(){ addPiece('you',2,3,true); addPiece('you',4,3,true); addPiece('foe',3,2); addPiece('foe',3,4); }, onMove:function(){return{ok:true,msg:'Sandbox — move freely. AI opponent coming soon.',done:false};} }
  ];
  function loadScenario(i){ current=i; done=false; clearAll(); var s=SCEN[i]; s.setup();
    if(stepEl)stepEl.textContent='Tutorial '+s.title; if(instrEl)instrEl.textContent=s.instr; feedback('');
    if(tabsEl) Array.prototype.forEach.call(tabsEl.querySelectorAll('.lab-tab'),function(b,k){ b.classList.toggle('active',k===i); b.classList.remove('pulse'); });
  }
  function feedback(t,bad){ if(!fbEl)return; fbEl.textContent=t||' '; fbEl.style.color=bad?'#e08a5a':'#d4af37'; }

  function tryMoveTo(c,r){ if(!selected)return;
    var legal=legalMoves(selected).some(function(m){return m.c===c&&m.r===r;});
    if(!legal){ feedback(pieceAt(c,r)?'✗ That square is taken — pick an empty marked square.':'✗ Too far or diagonal — soldiers move ONE orthogonal step.',true); return; }
    var p=selected; deselect();
    animateMove(p,c,r,function(){ var caps=detectCaptures(p); caps.forEach(function(e){e.dead=0.0001;});
      var res=SCEN[current].onMove(p,c,r,caps); feedback(res.msg,!res.ok);
      if(res.done&&!done){ done=true; if(tabsEl){var nb=tabsEl.querySelector('.lab-tab.active'); if(nb&&nb.nextElementSibling)nb.nextElementSibling.classList.add('pulse');} } });
  }
  function pick(x,y){ var rect=canvas.getBoundingClientRect(); ndc.x=((x-rect.left)/rect.width)*2-1; ndc.y=-((y-rect.top)/rect.height)*2+1; raycaster.setFromCamera(ndc,camera);
    var pm=raycaster.intersectObjects(pieces.map(function(p){return p.mesh;}),true)[0];
    if(pm){ var o=pm.object; while(o&&!o.userData.piece) o=o.parent; var p=o&&o.userData.piece;
      if(p){ if(p.selectable) selectPiece(p); else if(selected) tryMoveTo(p.c,p.r); else feedback('That is an enemy — tap YOUR glowing gold soldier first.',true); return; } }
    var tm=raycaster.intersectObjects(tiles,false)[0]; if(tm&&selected) tryMoveTo(tm.object.userData.c,tm.object.userData.r);
  }

  var pd=false,drag=false,lx=0,ly=0,pinch=0;
  function down(e){ pd=true;drag=false; var t=e.touches?e.touches[0]:e; lx=t.clientX;ly=t.clientY; if(e.touches&&e.touches.length===2) pinch=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY); }
  function move(e){ if(!pd)return;
    if(e.touches&&e.touches.length===2){ var d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY); cam.R=Math.max(5.5,Math.min(15,cam.R*(pinch/d))); pinch=d; updateCam(); drag=true; e.preventDefault(); return; }
    var t=e.touches?e.touches[0]:e, dx=t.clientX-lx, dy=t.clientY-ly; if(Math.abs(dx)+Math.abs(dy)>5) drag=true;
    if(drag){ cam.az-=dx*0.006; cam.pol=Math.max(0.28,Math.min(1.35,cam.pol-dy*0.006)); updateCam(); lx=t.clientX; ly=t.clientY; if(e.touches)e.preventDefault(); } }
  function up(e){ if(pd&&!drag){ var t=e.changedTouches?e.changedTouches[0]:e; pick(t.clientX,t.clientY); } pd=false; }
  function wheel(e){ cam.R=Math.max(5.5,Math.min(15,cam.R+e.deltaY*0.008)); updateCam(); e.preventDefault(); }

  function resize(){ var w=canvas.clientWidth,h=canvas.clientHeight; if(!w||!h)return; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
  function loop(){ var dt=Math.min(clock.getDelta(),0.05),time=clock.elapsedTime;
    markers.forEach(function(m){ var s=1+Math.sin(time*5)*0.12; m.scale.set(s,s,s); });
    if(selected) selected.mesh.userData.bodyMat.emissiveIntensity=0.45+Math.sin(time*6)*0.25;
    else pieces.forEach(function(p){ if(p.selectable){ p.mesh.userData.bodyMat.emissive=new THREE.Color(0xffe08a); p.mesh.userData.bodyMat.emissiveIntensity=0.2+Math.sin(time*3)*0.14; } });
    pieces.forEach(function(p){ if(p.anim){ var a=p.anim; a.t=Math.min(1,a.t+dt*3.2); var e=a.t<0.5?2*a.t*a.t:1-Math.pow(-2*a.t+2,2)/2;
        p.mesh.position.x=a.fx+(a.tx-a.fx)*e; p.mesh.position.z=a.fz+(a.tz-a.fz)*e; p.mesh.position.y=Math.sin(Math.PI*a.t)*0.28;
        if(a.t>=1){ p.mesh.position.y=0; var cb=a.after; p.anim=null; if(cb)cb(); } }
      if(p.dead!=null){ p.dead+=dt*2.4; var k=Math.max(0,1-p.dead); p.mesh.scale.setScalar(k); p.mesh.rotation.y+=dt*10; if(p.dead>=1){ scene.remove(p.mesh); pieces=pieces.filter(function(x){return x!==p;}); } } });
    renderer.render(scene,camera);
  }

  try{
    if(typeof THREE==='undefined') throw new Error('no THREE');
    renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true}); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    scene=new THREE.Scene(); camera=new THREE.PerspectiveCamera(42,1,0.1,100);
    raycaster=new THREE.Raycaster(); ndc=new THREE.Vector2(); clock=new THREE.Clock();
    scene.add(new THREE.AmbientLight(0xfff0e0,0.7)); scene.add(new THREE.HemisphereLight(0xfff3e0,0x4a2568,0.5));
    var key=new THREE.DirectionalLight(0xfff4e2,1.0); key.position.set(5,10,6); key.castShadow=true;
    key.shadow.mapSize.set(1024,1024); key.shadow.radius=4; key.shadow.camera.left=-8;key.shadow.camera.right=8;key.shadow.camera.top=8;key.shadow.camera.bottom=-8; scene.add(key);
    var pl=new THREE.PointLight(0xc79bef,0.5,30); pl.position.set(-6,5,-4); scene.add(pl);
    buildBoard(); updateCam();
    if(fallback) fallback.style.display='none';
    resize(); window.addEventListener('resize',resize); if(window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
    canvas.addEventListener('mousedown',down); window.addEventListener('mousemove',move); window.addEventListener('mouseup',up);
    canvas.addEventListener('touchstart',down,{passive:false}); canvas.addEventListener('touchmove',move,{passive:false}); canvas.addEventListener('touchend',up);
    canvas.addEventListener('wheel',wheel,{passive:false});
    if(resetBtn) resetBtn.addEventListener('click',function(){ loadScenario(current); });
    if(tabsEl) tabsEl.addEventListener('click',function(e){ var b=e.target.closest('.lab-tab'); if(b) loadScenario(parseInt(b.getAttribute('data-t'),10)||0); });
    loadScenario(0); renderer.setAnimationLoop(loop);
  }catch(err){ console.warn('tutorial init failed:',err); if(canvas)canvas.style.display='none'; if(fallback){fallback.style.display='block';fallback.textContent='3D needs a WebGL browser 🎮';} }
})();
