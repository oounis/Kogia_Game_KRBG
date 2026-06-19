// Kharbga: Origins — landing animations + live tutorial match
(function(){
  'use strict';
  function $(id){return document.getElementById(id);}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
  function pulse(el,cls){ if(!el)return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  // ---- hero dust ----
  var dust=$('dust');
  if(dust){ var dn=window.innerWidth<700?16:34;
    for(var i=0;i<dn;i++){ var d=document.createElement('i');
      var s=(2+Math.random()*4); d.style.width=d.style.height=s+'px';
      d.style.left=(Math.random()*100)+'%'; d.style.bottom=(Math.random()*40)+'%';
      d.style.animationDuration=(6+Math.random()*7)+'s'; d.style.animationDelay=(-Math.random()*10)+'s';
      dust.appendChild(d); } }

  // ---- parallax on cinema backgrounds ----
  var par=document.querySelectorAll('[data-parallax]');
  if(par.length){ var tick=false;
    function applyPar(){ var vh=window.innerHeight;
      par.forEach(function(el){ var r=el.parentElement.getBoundingClientRect(); var off=(r.top+r.height/2)-vh/2;
        var sp=parseFloat(el.getAttribute('data-parallax'))||0.1; el.style.transform='translateY('+(-off*sp)+'px)'; });
      tick=false; }
    window.addEventListener('scroll',function(){ if(!tick){ requestAnimationFrame(applyPar); tick=true; } },{passive:true});
    window.addEventListener('resize',applyPar); applyPar();
  }

  // ---- nav solid on scroll ----
  var nav=$('nav'); function onScroll(){ nav.classList.toggle('solid', window.scrollY>40); }
  window.addEventListener('scroll', onScroll); onScroll();

  // ---- reveals ----
  var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); },{threshold:.12});
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

  // ---- count-up ----
  document.querySelectorAll('[data-count]').forEach(function(el){ var done=false;
    var c=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting&&!done){ done=true;
      var t=parseInt(el.getAttribute('data-count'),10), v=0, st=Math.ceil(t/55);
      var iv=setInterval(function(){ v+=st; if(v>=t){v=t;clearInterval(iv);} el.textContent=v.toLocaleString(); },24);
    }});},{threshold:.5}); c.observe(el); });

  // ---- hero board (emoji pieces, gentle bob) ----
  var hb=$('heroBoard');
  if(hb){ for(var k=0;k<49;k++){ var cell=document.createElement('div'); cell.className='cell';
      if(k===24){ cell.classList.add('mid'); }
      else if(Math.random()>0.52){ var p=document.createElement('span'); p.className='pce';
        p.textContent=Math.random()>0.5?'🐶':'🐺'; p.style.animationDelay=(Math.random()*2).toFixed(2)+'s'; cell.appendChild(p); }
      hb.appendChild(cell); } }

  // ===================== LIVE TUTORIAL MATCH =====================
  var board=$('demoBoard'), matchCap=$('matchCap'), comboPop=$('comboPop'),
      comboN=$('comboN'), turnTag=$('turnTag'), N=5, layer=null;

  function cap(t){ if(!matchCap)return; matchCap.style.opacity=0;
    setTimeout(function(){ matchCap.textContent=t; matchCap.style.opacity=1; },150); }
  function pop(t){ comboPop.textContent=t; pulse(comboPop,'show'); }
  function shake(){ pulse(board,'shake'); }
  function turn(side){ if(!turnTag)return; turnTag.textContent=(side==='you'?'● Your move':'● Rival’s move'); turnTag.className='turn '+side; }

  function piece(side,c,r){ var el=document.createElement('div'); el.className='dp '+side;
    el.textContent=(side==='you'?'🐶':'🐺'); var o={el:el,c:c,r:r}; place(o); layer.appendChild(el); return o; }
  function place(o){ o.el.style.left=(o.c*(100/N))+'%'; o.el.style.top=(o.r*(100/N))+'%'; }
  function move(o,c,r){ o.c=c; o.r=r; place(o); }
  function poof(o){ var b=document.createElement('div'); b.className='boom'; b.textContent='💥';
    b.style.left=(o.c*(100/N))+'%'; b.style.top=(o.r*(100/N))+'%'; layer.appendChild(b);
    setTimeout(function(){ if(b.parentNode) b.parentNode.removeChild(b); },650);
    o.el.classList.add('dead'); setTimeout(function(){ if(o.el.parentNode) o.el.parentNode.removeChild(o.el); },430); }

  function build(){ board.innerHTML='';
    for(var i=0;i<N*N;i++){ var cl=document.createElement('div'); cl.className='dcell'; if(i===12) cl.classList.add('mid'); board.appendChild(cl); }
    layer=document.createElement('div'); layer.className='dlayer'; board.appendChild(layer); }

  var started=false;
  async function play(){
    build();
    // your anchors forming a cross around the Citadel
    piece('you',0,2); piece('you',2,0); piece('you',2,4); piece('you',4,2);
    // rival pieces hugging the centre (the targets)
    var t1=piece('rival',1,2), t2=piece('rival',2,1), t3=piece('rival',2,3), t4=piece('rival',3,2);
    // a few extra pieces so the board feels alive
    piece('rival',0,0); piece('you',4,4); piece('rival',4,0); piece('you',0,4);
    // your mover
    var m=piece('you',1,0);
    comboN.textContent='0';

    cap('Two players, one board. Watch…'); turn('you'); await sleep(1300);
    cap('Slide into the Citadel — and surround them!');
    move(m,2,2); await sleep(680);

    var words=['','','DOUBLE!','TRIPLE!','ONSLAUGHT!','ANNIHILATION!'], targets=[t1,t2,t3,t4], hits=0;
    for(var i=0;i<targets.length;i++){
      pulse(m.el,'chomp'); poof(targets[i]); hits++; comboN.textContent=hits; shake();
      if(hits>=2) pop(words[Math.min(hits,5)]);
      cap(hits===1 ? 'CAPTURE! 🎯' : 'Combo x'+hits+'!');
      await sleep(650);
    }
    await sleep(550);

    cap('Reach 7 captures and your dog earns a crown…');
    m.el.classList.add('king');
    var crown=document.createElement('span'); crown.className='crown'; crown.textContent='👑'; m.el.appendChild(crown);
    pop('CENTURION! 👑'); shake(); await sleep(1500);

    cap('The Centurion now slides across the whole board!');
    move(m,3,2); await sleep(620);
    move(m,1,2); await sleep(740);
    move(m,2,2); await sleep(740);

    cap('Your turn — fancy one more game? 🐾'); await sleep(1600);
    play(); // loop
  }
  if(board){
    var bio=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting && !started){ started=true; play(); bio.disconnect(); } }); },{threshold:.3});
    bio.observe(board);
  }

  // ---- cinematic art showcase ----
  var slides=document.querySelectorAll('.slide'), capBox=$('showCap'),
      sk=$('showKicker'), st=$('showTitle'), sx=$('showText'), dotsBox=$('showDots');
  if(slides.length && capBox){
    var SC=[
      {k:'◆ The Board',  t:'Pure Skill, Zero Luck',  x:'Place, move and surround — no dice, no cards. Just the sharper mind wins.'},
      {k:'◆ Combos',     t:'Chain Dazzling Combos',  x:'One warrior can capture three, four, five in a row — DOUBLE, TRIPLE, ANNIHILATION!'},
      {k:'◆ The Centurion', t:'Crown Your Champion', x:'Seven captures and your warrior becomes a Centurion that rules the whole board.'}
    ];
    var idx=0, dots=[];
    for(var i=0;i<slides.length;i++){ (function(j){ var d=document.createElement('i'); if(j===0)d.className='on';
      d.addEventListener('click',function(){ go(j); }); dotsBox.appendChild(d); dots.push(d); })(i); }
    function go(n){ idx=n;
      slides.forEach(function(s,k){ s.classList.toggle('active',k===idx); });
      dots.forEach(function(d,k){ d.classList.toggle('on',k===idx); });
      var c=SC[idx]||SC[0]; if(sk)sk.textContent=c.k; if(st)st.textContent=c.t; if(sx)sx.textContent=c.x;
      capBox.classList.remove('swap'); void capBox.offsetWidth; capBox.classList.add('swap');
    }
    go(0); setInterval(function(){ go((idx+1)%slides.length); }, 4200);
  }

  // ---- email signup (stub; wire to a real service later) ----
  var form=$('signupForm'), msg=$('signupMsg');
  if(form){ form.addEventListener('submit', function(ev){ ev.preventDefault();
    var email=$('email').value.trim();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ msg.style.color='var(--clay)'; msg.textContent='Please enter a valid email.'; return; }
    try{ var l=JSON.parse(localStorage.getItem('kharbga_emails')||'[]'); l.push({e:email,t:Date.now()}); localStorage.setItem('kharbga_emails',JSON.stringify(l)); }catch(e){}
    msg.style.color='var(--teal)'; msg.textContent='You\'re on the list! We\'ll send the download the moment it\'s live. 🏛️'; form.reset();
  }); }
})();
