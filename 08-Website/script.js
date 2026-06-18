// Kharbga: Origins — landing animations
(function(){
  'use strict';

  // ---- starfield ----
  var stars = document.getElementById('stars');
  if (stars){
    var n = window.innerWidth < 700 ? 30 : 60;
    for (var i=0;i<n;i++){
      var s = document.createElement('i');
      s.style.left = (Math.random()*100)+'%';
      s.style.top = (Math.random()*100)+'%';
      s.style.animationDelay = (Math.random()*3)+'s';
      stars.appendChild(s);
    }
  }

  // ---- nav solid on scroll ----
  var nav = document.getElementById('nav');
  function onScroll(){ nav.classList.toggle('solid', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll); onScroll();

  // ---- scroll reveals ----
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:0.12});
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

  // ---- count-up ----
  document.querySelectorAll('[data-count]').forEach(function(el){
    var done=false;
    var c = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting && !done){
          done=true;
          var target=parseInt(el.getAttribute('data-count'),10), v=0, step=Math.ceil(target/55);
          var t=setInterval(function(){ v+=step; if(v>=target){v=target; clearInterval(t);} el.textContent=v.toLocaleString(); },24);
        }
      });
    }, {threshold:0.5});
    c.observe(el);
  });

  // ---- hero board (random armies + glowing Citadel) ----
  var board = document.getElementById('heroBoard');
  if (board){
    for (var k=0;k<49;k++){
      var cell=document.createElement('div'); cell.className='cell';
      if(k===24){ cell.classList.add('mid'); }
      else if(Math.random()>0.45){
        var pc=document.createElement('div');
        pc.className='pc '+(Math.random()>0.5?'d':'l');
        pc.style.animationDelay=(k*0.012)+'s';
        cell.appendChild(pc);
      }
      board.appendChild(cell);
    }
  }

  // ---- COMBO demo loop ----
  var csRow=document.getElementById('csRow'), comboPop=document.getElementById('comboPop'),
      comboStage=document.getElementById('comboStage');
  var comboWords=['','','DOUBLE','TRIPLE','ONSLAUGHT','ANNIHILATION'];
  function buildCombo(){
    csRow.innerHTML='';
    var mover=document.createElement('div'); mover.className='pc l mover'; csRow.appendChild(mover);
    for(var i=0;i<4;i++){ var e=document.createElement('div'); e.className='pc d'; csRow.appendChild(e); }
  }
  function runCombo(){
    if(!csRow) return;
    buildCombo();
    var enemies=csRow.querySelectorAll('.pc.d'), hit=0;
    function strike(){
      if(hit>=enemies.length){ setTimeout(runCombo,1400); return; }
      enemies[hit].classList.add('gone');
      hit++;
      comboStage.classList.remove('shake'); void comboStage.offsetWidth; comboStage.classList.add('shake');
      if(hit>=2){
        comboPop.textContent=comboWords[Math.min(hit,5)];
        comboPop.classList.remove('show'); void comboPop.offsetWidth; comboPop.classList.add('show');
      }
      setTimeout(strike, 520);
    }
    setTimeout(strike, 700);
  }
  if(csRow){
    var cio=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ runCombo(); cio.disconnect(); } }); },{threshold:.4});
    cio.observe(csRow);
  }

  // ---- CENTURION promotion loop ----
  var centNum=document.getElementById('centNum'), centPiece=document.getElementById('centPiece'),
      centBanner=document.getElementById('centBanner');
  function runCent(){
    if(!centNum) return;
    centPiece.classList.remove('promoted'); centNum.textContent='0';
    var c=0;
    var t=setInterval(function(){
      c++; centNum.textContent=c;
      centPiece.style.transform='scale(1.12)'; setTimeout(function(){centPiece.style.transform='scale(1)';},120);
      if(c>=7){
        clearInterval(t);
        setTimeout(function(){
          centPiece.classList.add('promoted');
          centBanner.classList.remove('show'); void centBanner.offsetWidth; centBanner.classList.add('show');
          setTimeout(runCent, 2600);
        }, 350);
      }
    }, 360);
  }
  if(centNum){
    var cio2=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ runCent(); cio2.disconnect(); } }); },{threshold:.4});
    cio2.observe(centNum);
  }

  // ---- email signup (front-end stub; wire to a real service later) ----
  var form=document.getElementById('signupForm'), msg=document.getElementById('signupMsg');
  if(form){
    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      var email=document.getElementById('email').value.trim();
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ msg.style.color='var(--clay)'; msg.textContent='Please enter a valid email.'; return; }
      // TODO: connect to Formspree / Mailchimp / Supabase to actually store the email
      try{ var list=JSON.parse(localStorage.getItem('kharbga_emails')||'[]'); list.push({e:email,t:Date.now()}); localStorage.setItem('kharbga_emails',JSON.stringify(list)); }catch(e){}
      msg.style.color='var(--teal)';
      msg.textContent='You\'re on the list! We\'ll send the download the moment it\'s live. 🏛️';
      form.reset();
    });
  }
})();
