// Kharbga: Origins — clean editorial site (no images, no 3D)
(function(){
  'use strict';
  function $(id){return document.getElementById(id);}

  // nav solid on scroll
  var nav=$('nav'); function onScroll(){ nav.classList.toggle('solid',window.scrollY>40); }
  window.addEventListener('scroll',onScroll); onScroll();

  // reveals
  var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} }); },{threshold:.14});
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

  // count-up
  document.querySelectorAll('[data-count]').forEach(function(el){ var done=false;
    var c=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting&&!done){ done=true;
      var t=parseInt(el.getAttribute('data-count'),10),v=0,st=Math.ceil(t/50);
      var iv=setInterval(function(){ v+=st; if(v>=t){v=t;clearInterval(iv);} el.textContent=v.toLocaleString(); },26); } }); },{threshold:.5});
    c.observe(el); });

  // hero geometric grid (two armies facing the golden Citadel)
  var grid=$('grid7');
  if(grid){
    var terra=[8,10,12,16,22], teal=[36,38,40,32,26], gold=24, mid=24;
    for(var i=0;i<49;i++){ var d=document.createElement('i');
      if(i===mid) d.className='mid';
      if(terra.indexOf(i)>=0) d.className='p t';
      else if(teal.indexOf(i)>=0) d.className='p e';
      else if(i===gold) d.className='p g mid';
      grid.appendChild(d); }
  }

  // rule diagrams (pure DOM)
  function cell(opts){ opts=opts||{}; var c=document.createElement('div'); c.className='cell'+(opts.hl?' hl':'');
    if(opts.dot){ var d=document.createElement('div'); d.className='dot '+opts.dot; c.appendChild(d); }
    if(opts.x){ var x=document.createElement('span'); x.className='x'; x.textContent='✕'; c.appendChild(x); }
    if(opts.crown){ var k=document.createElement('span'); k.className='crown'; k.textContent='♛'; c.appendChild(k); }
    return c; }
  function arrow(){ var a=document.createElement('span'); a.className='arrow'; a.textContent='→'; return a; }
  function fill(sel, nodes){ var box=document.querySelector(sel); if(!box)return; nodes.forEach(function(n){box.appendChild(n);}); }

  fill('.d-move',  [cell({dot:'t'}), arrow(), cell({hl:true})]);
  fill('.d-cap',   [cell({dot:'t'}), cell({dot:'e',x:true}), cell({dot:'t'})]);
  fill('.d-combo', [cell({dot:'t'}), cell({dot:'e',x:true}), cell({dot:'e',x:true}), cell({dot:'e'})]);
  fill('.d-crown', [cell({dot:'g',crown:true})]);

  // email signup (stub; wire to a real service later)
  var form=$('signupForm'), msg=$('signupMsg');
  if(form){ form.addEventListener('submit',function(ev){ ev.preventDefault();
    var email=$('email').value.trim();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ msg.style.color='#e08a5a'; msg.textContent='Please enter a valid email.'; return; }
    try{ var l=JSON.parse(localStorage.getItem('kharbga_emails')||'[]'); l.push({e:email,t:Date.now()}); localStorage.setItem('kharbga_emails',JSON.stringify(l)); }catch(e){}
    msg.style.color='var(--gold)'; msg.textContent='You\'re on the list — we\'ll send the download the day it launches.'; form.reset();
  }); }
})();
