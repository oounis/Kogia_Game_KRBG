// Kharbga: Origins — interactive city-map experience
(function(){
  'use strict';
  function $(id){return document.getElementById(id);}

  // nav
  var nav=$('nav'); function onScroll(){ nav.classList.toggle('solid',window.scrollY>40); }
  window.addEventListener('scroll',onScroll); onScroll();

  // reveals
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.14});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});

  // rule diagrams
  function cell(o){o=o||{};var c=document.createElement('div');c.className='cell'+(o.hl?' hl':'');
    if(o.dot){var d=document.createElement('div');d.className='dot '+o.dot;c.appendChild(d);}
    if(o.x){var x=document.createElement('span');x.className='x';x.textContent='✕';c.appendChild(x);}
    if(o.crown){var k=document.createElement('span');k.className='crown';k.textContent='♛';c.appendChild(k);} return c;}
  function arrow(){var a=document.createElement('span');a.className='arrow';a.textContent='→';return a;}
  function fill(sel,nodes){var b=document.querySelector(sel);if(b)nodes.forEach(function(n){b.appendChild(n);});}
  fill('.d-move',[cell({dot:'t'}),arrow(),cell({hl:true})]);
  fill('.d-cap',[cell({dot:'t'}),cell({dot:'e',x:true}),cell({dot:'t'})]);
  fill('.d-combo',[cell({dot:'t'}),cell({dot:'e',x:true}),cell({dot:'e',x:true}),cell({dot:'e'})]);
  fill('.d-crown',[cell({dot:'g',crown:true})]);

  // ===== interactive map =====
  var stage=$('mapStage'), img=$('mapImg'), resetBtn=$('mapReset'), hint=$('mapHint');
  if(stage&&img){
    var tx=0,ty=0,scale=1,MIN=1,MAX=2.6;
    function dim(){var r=stage.getBoundingClientRect();return {w:r.width,h:r.height,l:r.left,t:r.top};}
    function clamp(){var d=dim();tx=Math.min(0,Math.max(-(scale-1)*d.w,tx));ty=Math.min(0,Math.max(-(scale-1)*d.h,ty));}
    function apply(){clamp();img.style.transform='translate('+tx+'px,'+ty+'px) scale('+scale+')';}
    function snappy(on){ img.classList.toggle('dragging',on); }
    function zoomAround(ns,cx,cy){ ns=Math.max(MIN,Math.min(MAX,ns)); tx=cx-(cx-tx)*(ns/scale); ty=cy-(cy-ty)*(ns/scale); scale=ns; apply(); }
    function focus(hx,hy,ts){ var d=dim(); ts=Math.min(MAX,ts); tx=d.w/2 - ts*(hx/100*d.w); ty=d.h/2 - ts*(hy/100*d.h); scale=ts; snappy(false); apply(); }
    function reset(){ snappy(false); scale=1;tx=0;ty=0; apply(); if(resetBtn)resetBtn.hidden=true; }
    apply();

    // panels
    var DATA={
      harbour:{k:'Carthage · The Harbour',t:'Where it began',x:'Phoenician merchants and Roman sailors carried games of strategy across the sea — Kharbga sailed with them, from Carthage’s harbours to the Tunisian shore.',c:'Read the story',h:'#story'},
      arena:{k:'The Arena',t:'Two armies, one duel',x:'No dice, no luck — only the sharper mind. Outwit your rival, chain captures, and crown your Centurion in the heat of the arena.',c:'Play Free',h:'#download'},
      board:{k:'The Plaza',t:'The 7×7 board',x:'Surround an enemy between two of your soldiers and it falls. Simple to learn, a lifetime to master — older than chess itself.',c:'Learn the rules',h:'#rules'},
      fort:{k:'The Fort',t:'One game, many names',x:'Kharbga in Tunisia, Khribga in Algeria, Siza in Libya, Seega in Egypt — a single living thread of North-African heritage.',c:'Explore variants',h:'#variants'}
    };
    var panel=$('panel'),pk=$('panelKicker'),pt=$('panelTitle'),px=$('panelText'),pc=$('panelCta');
    function openHot(key,hx,hy){ var d=DATA[key]; if(!d)return; pk.textContent=d.k; pt.textContent=d.t; px.textContent=d.x; pc.textContent=d.c; pc.setAttribute('href',d.h);
      panel.classList.add('open'); panel.setAttribute('aria-hidden','false'); focus(hx,hy,2.1); if(resetBtn)resetBtn.hidden=false; if(hint)hint.style.opacity=0; }
    function closePanel(){ panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); reset(); if(hint)hint.style.opacity=''; }
    var px2=$('panelX'); if(px2)px2.addEventListener('click',closePanel);

    // hotspots
    var moved=false;
    Array.prototype.forEach.call(document.querySelectorAll('.hot'),function(b){
      b.addEventListener('click',function(e){ e.stopPropagation(); if(moved)return; openHot(b.getAttribute('data-key'),parseFloat(b.style.left),parseFloat(b.style.top)); });
    });

    // drag pan
    var pd=false,lx=0,ly=0,pinch=0;
    function down(e){ pd=true;moved=false; var p=e.touches?e.touches[0]:e; lx=p.clientX;ly=p.clientY; snappy(true); stage.classList.add('grabbing');
      if(e.touches&&e.touches.length===2) pinch=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY); }
    function mv(e){ if(!pd)return;
      if(e.touches&&e.touches.length===2){ var d2=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY); var dd=dim(); zoomAround(scale*(d2/pinch),(e.touches[0].clientX+e.touches[1].clientX)/2-dd.l,(e.touches[0].clientY+e.touches[1].clientY)/2-dd.t); pinch=d2; moved=true; e.preventDefault(); return; }
      var p=e.touches?e.touches[0]:e,dx=p.clientX-lx,dy=p.clientY-ly; if(Math.abs(dx)+Math.abs(dy)>5)moved=true;
      tx+=dx;ty+=dy;lx=p.clientX;ly=p.clientY;apply(); if(e.touches)e.preventDefault(); }
    function up(){ pd=false; snappy(false); stage.classList.remove('grabbing'); }
    stage.addEventListener('mousedown',down); window.addEventListener('mousemove',mv); window.addEventListener('mouseup',up);
    stage.addEventListener('touchstart',down,{passive:false}); stage.addEventListener('touchmove',mv,{passive:false}); stage.addEventListener('touchend',up);
    stage.addEventListener('wheel',function(e){ var d=dim(); snappy(true); zoomAround(scale-e.deltaY*0.0016*scale,e.clientX-d.l,e.clientY-d.t); if(scale<=1.02&&resetBtn)resetBtn.hidden=true; else if(resetBtn)resetBtn.hidden=false; e.preventDefault(); setTimeout(function(){snappy(false);},120); },{passive:false});

    if(resetBtn)resetBtn.addEventListener('click',closePanel);
    var zi=$('zoomIn'),zo=$('zoomOut');
    if(zi)zi.addEventListener('click',function(){var d=dim();snappy(true);zoomAround(scale+0.4,d.w/2,d.h/2);if(resetBtn)resetBtn.hidden=false;setTimeout(function(){snappy(false);},200);});
    if(zo)zo.addEventListener('click',function(){var d=dim();snappy(true);zoomAround(scale-0.4,d.w/2,d.h/2);setTimeout(function(){snappy(false);},200);});
    window.addEventListener('resize',apply);
  }

  // signup
  var form=$('signupForm'),msg=$('signupMsg');
  if(form){ form.addEventListener('submit',function(ev){ ev.preventDefault();
    var email=$('email').value.trim();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ msg.style.color='#e0a35a'; msg.textContent='Please enter a valid email.'; return; }
    try{var l=JSON.parse(localStorage.getItem('kharbga_emails')||'[]');l.push({e:email,t:Date.now()});localStorage.setItem('kharbga_emails',JSON.stringify(l));}catch(e){}
    msg.style.color='var(--gold2)'; msg.textContent='You’re on the list — we’ll send the download the day it launches.'; form.reset();
  }); }
})();
