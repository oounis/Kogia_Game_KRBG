// Kharbga — playable board (vs Computer / Pass & Play)
(function(){
  'use strict';
  function $(id){return document.getElementById(id);}
  var N=7, DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
  var cells=[], boardEl=$('board'), cellEls=[];
  var turn='you', mode='cpu', selected=null, busy=false, over=false;
  var youCap=0, cpuCap=0, lastFrom=-1, lastTo=-1;
  function idx(c,r){return r*N+c;} function cc(i){return [i%N,(i/N|0)];} function inB(c,r){return c>=0&&c<N&&r>=0&&r<N;}

  function setup(){
    cells=new Array(N*N).fill(null);
    for(var r=0;r<N;r++)for(var c=0;c<N;c++){
      if(c===3&&r===3) continue;
      if(r<3) cells[idx(c,r)]='cpu';
      else if(r>3) cells[idx(c,r)]='you';
      else cells[idx(c,r)]= c<3?'cpu':'you';
    }
    turn='you'; selected=null; busy=false; over=false; youCap=0; cpuCap=0; lastFrom=-1; lastTo=-1;
  }
  function count(side){var n=0;for(var i=0;i<cells.length;i++)if(cells[i]===side)n++;return n;}
  function emptyTargets(i){ var p=cc(i),out=[]; DIRS.forEach(function(d){var c=p[0]+d[0],r=p[1]+d[1]; if(inB(c,r)&&!cells[idx(c,r)]) out.push(idx(c,r));}); return out; }
  function allMoves(side){ var mv=[]; for(var i=0;i<cells.length;i++) if(cells[i]===side) emptyTargets(i).forEach(function(t){mv.push([i,t]);}); return mv; }
  function capsAt(i,side){ var p=cc(i),caps=[]; DIRS.forEach(function(d){ var ec=p[0]+d[0],er=p[1]+d[1];
    if(inB(ec,er)){ var e=cells[idx(ec,er)]; if(e&&e!==side){ var bc=ec+d[0],br=er+d[1]; if(inB(bc,br)&&cells[idx(bc,br)]===side) caps.push(idx(ec,er)); } } }); return caps; }
  function simCaps(from,to,side){ var sv=cells[to],mf=cells[from]; cells[to]=cells[from]; cells[from]=null; var n=capsAt(to,side).length; cells[from]=mf; cells[to]=sv; return n; }

  // ---- rendering ----
  function build(){ boardEl.innerHTML=''; cellEls=[];
    for(var i=0;i<N*N;i++){ var p=cc(i); var d=document.createElement('div');
      d.className='cell '+(((p[0]+p[1])%2)?'dk':'lt')+((p[0]===3&&p[1]===3)?' mid':'');
      d.setAttribute('data-i',i); d.addEventListener('click',onClick); boardEl.appendChild(d); cellEls.push(d); } }
  function render(captured,moveTo){ captured=captured||[];
    for(var i=0;i<cellEls.length;i++){ var el=cellEls[i], want=cells[i], pc=el.querySelector('.pc');
      if(want){ if(!pc){ pc=document.createElement('div'); pc.className='pc '+want; pc.dataset.side=want; if(i===moveTo)pc.classList.add('pop'); el.appendChild(pc); }
        else if(pc.dataset.side!==want){ el.removeChild(pc); pc=document.createElement('div'); pc.className='pc '+want; pc.dataset.side=want; el.appendChild(pc); } }
      else if(pc){ if(captured.indexOf(i)>=0){ pc.classList.add('gone'); (function(p,e){ setTimeout(function(){ if(p.parentNode===e)e.removeChild(p); },300); })(pc,el); } else el.removeChild(pc); }
      el.classList.remove('sel','legal','take','last');
      if(i===lastFrom||i===lastTo) el.classList.add('last');
    }
    if(selected!=null){ cellEls[selected].classList.add('sel');
      emptyTargets(selected).forEach(function(t){ cellEls[t].classList.add('legal'); if(simCaps(selected,t,turn)>0)cellEls[t].classList.add('take'); }); }
    updateHUD();
  }
  function updateHUD(){ $('youCap').textContent=youCap; $('cpuCap').textContent=cpuCap;
    var st=$('status');
    if(over) return;
    st.textContent = (mode==='pvp') ? (turn==='you'?'Light to move':'Dark to move') : (turn==='you'?'Your move':'Enemy is thinking…'); }

  // ---- move logic ----
  function applyMove(from,to,side){ cells[to]=side; cells[from]=null; lastFrom=from; lastTo=to;
    var caps=capsAt(to,side); caps.forEach(function(ci){ cells[ci]=null; }); if(caps.length){ if(side==='you')youCap+=caps.length; else cpuCap+=caps.length; }
    return caps; }
  function endCheck(nextSide){
    if(count('cpu')<=1){ finish('You win! 🏆'); return true; }
    if(count('you')<=1){ finish(mode==='pvp'?'Dark wins! 🏆':'Enemy wins.'); return true; }
    if(allMoves(nextSide).length===0){ finish(nextSide==='you'?(mode==='pvp'?'Light is blocked — Dark wins!':'You are blocked — Enemy wins.'):(mode==='pvp'?'Dark is blocked — Light wins!':'Enemy is blocked — You win! 🏆')); return true; }
    return false; }
  function finish(msg){ over=true; selected=null; $('status').textContent=msg; }

  function humanMove(from,to){ var caps=applyMove(from,to,turn); selected=null; render(caps,to);
    if(endCheck(turn==='you'?'cpu':'you')) return;
    turn = turn==='you'?'cpu':'you';
    if(mode==='cpu' && turn==='cpu'){ busy=true; updateHUD(); setTimeout(cpuMove,520); } else updateHUD(); }
  function cpuMove(){ var mv=allMoves('cpu'); if(!mv.length){ finish('Enemy is blocked — You win! 🏆'); busy=false; return; }
    var best=[],bestN=-1; mv.forEach(function(m){ var n=simCaps(m[0],m[1],'cpu'); if(n>bestN){bestN=n;best=[m];} else if(n===bestN)best.push(m); });
    var m=best[Math.floor(Math.random()*best.length)];
    var caps=applyMove(m[0],m[1],'cpu'); render(caps,m[1]);
    busy=false; if(endCheck('you'))return; turn='you'; updateHUD(); }

  function onClick(e){ if(over||busy) return; var i=parseInt(e.currentTarget.getAttribute('data-i'),10);
    var humanTurn = (mode==='pvp') || (turn==='you');
    if(!humanTurn) return;
    if(selected==null){ if(cells[i]===turn && emptyTargets(i).length){ selected=i; render(); } return; }
    if(emptyTargets(selected).indexOf(i)>=0){ humanMove(selected,i); return; }
    if(cells[i]===turn && emptyTargets(i).length){ selected=i; render(); return; }
    selected=null; render(); }

  function newGame(){ setup(); render(); }

  // ---- controls ----
  build(); newGame();
  $('newGame').addEventListener('click',newGame);
  var seg=$('modeSeg');
  seg.addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b)return;
    Array.prototype.forEach.call(seg.children,function(x){x.classList.remove('active');}); b.classList.add('active');
    mode=b.getAttribute('data-m'); newGame(); });

  // ---- learn diagrams ----
  function dc(o){o=o||{};var c=document.createElement('div');c.className='dcell'+(o.hl?' hl':'');
    if(o.dot){var d=document.createElement('div');d.className='dot '+o.dot;c.appendChild(d);}
    if(o.x){var x=document.createElement('span');x.className='x';x.textContent='✕';c.appendChild(x);}
    if(o.crown){var k=document.createElement('span');k.className='crown';k.textContent='♛';c.appendChild(k);} return c;}
  function arr(){var a=document.createElement('span');a.className='arrow';a.textContent='→';return a;}
  function fill(s,n){var b=document.querySelector(s);if(b)n.forEach(function(x){b.appendChild(x);});}
  fill('.d-move',[dc({dot:'t'}),arr(),dc({hl:true})]);
  fill('.d-cap',[dc({dot:'t'}),dc({dot:'e',x:true}),dc({dot:'t'})]);
  fill('.d-combo',[dc({dot:'t'}),dc({dot:'e',x:true}),dc({dot:'e',x:true}),dc({dot:'t'})]);
  fill('.d-crown',[dc({dot:'g',crown:true})]);
})();
