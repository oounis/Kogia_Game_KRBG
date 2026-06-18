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

  // helper: build a dog-soldier svg
  function dog(cls){
    var s=document.createElementNS('http://www.w3.org/2000/svg','svg');
    s.setAttribute('class','ds '+cls);
    var u=document.createElementNS('http://www.w3.org/2000/svg','use');
    u.setAttribute('href','#dog'); u.setAttributeNS('http://www.w3.org/1999/xlink','href','#dog');
    s.appendChild(u); return s;
  }
  function pulse(el,cls){ el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  // ---- COMBO tutorial (your dog chains through the rival's line) ----
  var comboLane=document.getElementById('comboLane'), comboPop=document.getElementById('comboPop'),
      comboStage=document.getElementById('comboStage'), comboCap=document.getElementById('comboCap');
  var comboWords=['','','DOUBLE!','TRIPLE!','ONSLAUGHT!','ANNIHILATION!'];
  var yips=['YIP!','AWOO!','ARF!','OUCH!','WOOF!'];
  function runCombo(){
    if(!comboLane) return;
    comboLane.innerHTML='';
    comboCap.textContent='Your dog-soldier charges the rival’s line…';
    var mover=dog('light mover'); comboLane.appendChild(mover);
    var enemies=[];
    for(var i=0;i<4;i++){ var e=dog('dark idle'); comboLane.appendChild(e); enemies.push(e); }
    var hit=0;
    function strike(){
      if(hit>=enemies.length){ comboCap.textContent='ANNIHILATION! The whole line is gone 🎉'; setTimeout(runCombo,1700); return; }
      pulse(mover,'chomp');
      var victim=enemies[hit];
      // yelp text
      var y=document.createElement('span'); y.className='yip'; y.textContent=yips[hit%yips.length];
      y.style.left=(victim.offsetLeft+6)+'px'; y.style.bottom='52px'; comboLane.appendChild(y);
      setTimeout(function(){ if(y.parentNode) y.parentNode.removeChild(y); },650);
      pulse(victim,'yelp');
      setTimeout(function(){ victim.classList.add('gone'); }, 180);
      hit++;
      pulse(comboStage,'shake');
      if(hit>=2){ comboPop.textContent=comboWords[Math.min(hit,5)]; pulse(comboPop,'show'); comboCap.textContent='Combo x'+hit+'!'; }
      setTimeout(strike, 620);
    }
    setTimeout(strike, 900);
  }
  if(comboLane){
    var cio=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ runCombo(); cio.disconnect(); } }); },{threshold:.35});
    cio.observe(comboLane);
  }

  // ---- CENTURION promotion (your dog earns its crown) ----
  var centNum=document.getElementById('centNum'), centDog=document.getElementById('centDog'),
      centBanner=document.getElementById('centBanner'), centCap=document.getElementById('centCap'),
      centStage=document.getElementById('centStage');
  function runCent(){
    if(!centNum||!centDog) return;
    centDog.classList.remove('promoted'); centNum.textContent='0';
    centCap.textContent='Capture 7 to promote your dog-soldier…';
    var c=0;
    var t=setInterval(function(){
      c++; centNum.textContent=c; pulse(centDog,'chomp');
      centCap.textContent='Chomp! '+c+' / 7';
      if(c>=7){
        clearInterval(t);
        setTimeout(function(){
          centDog.classList.add('promoted');
          pulse(centStage,'shake');
          centBanner.textContent='CENTURION! 👑'; pulse(centBanner,'show');
          centCap.textContent='Promoted! Now it slides across the whole board 🐶👑';
          setTimeout(runCent, 3000);
        }, 400);
      }
    }, 380);
  }
  if(centNum){
    var cio2=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ runCent(); cio2.disconnect(); } }); },{threshold:.35});
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
