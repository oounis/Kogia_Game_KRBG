// Kharbga — full playable game (rules engine + minimax AI + UI)
(function(){
  'use strict';
  function $(id){return document.getElementById(id);}
  var N=7, DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
  function idx(c,r){return r*N+c;} function cc(i){return [i%N,(i/N|0)];}
  function inB(c,r){return c>=0&&c<N&&r>=0&&r<N;}
  function clone(b){return b.slice();}
  function pieces(b,s){var n=0;for(var i=0;i<b.length;i++)if(b[i]===s)n++;return n;}

  // ---------- RULES ENGINE (pure) ----------
  function emptyAdj(b,i){ var p=cc(i),o=[]; for(var k=0;k<4;k++){var c=p[0]+DIRS[k][0],r=p[1]+DIRS[k][1]; if(inB(c,r)&&!b[idx(c,r)])o.push(idx(c,r));} return o; }
  function applyStep(b,from,to,side){ b[to]=side; b[from]=null; var p=cc(to),got=[];
    for(var k=0;k<4;k++){ var ec=p[0]+DIRS[k][0],er=p[1]+DIRS[k][1];
      if(inB(ec,er)){ var e=b[idx(ec,er)]; if(e&&e!==side){ var bc=ec+DIRS[k][0],br=er+DIRS[k][1]; if(inB(bc,br)&&b[idx(bc,br)]===side) got.push(idx(ec,er)); } } }
    for(var g=0;g<got.length;g++) b[got[g]]=null; return got; }
  function chainTargets(b,i,side){ return emptyAdj(b,i).filter(function(t){ var c=clone(b); return applyStep(c,i,t,side).length>0; }); }
  function genTurns(b,side){ var turns=[];
    for(var i=0;i<b.length;i++){ if(b[i]!==side)continue;
      var adj=emptyAdj(b,i);
      for(var a=0;a<adj.length;a++){ var c=clone(b); var got=applyStep(c,i,adj[a],side); var steps=[[i,adj[a]]]; var gained=got.length, pos=adj[a];
        while(got.length){ var conts=chainTargets(c,pos,side); if(!conts.length)break;
          var bt=conts[0],bn=-1; for(var x=0;x<conts.length;x++){ var cc2=clone(c); var g2=applyStep(cc2,pos,conts[x],side); if(g2.length>bn){bn=g2.length;bt=conts[x];} }
          got=applyStep(c,pos,bt,side); steps.push([pos,bt]); gained+=got.length; pos=bt; }
        turns.push({steps:steps,result:c,gained:gained}); } }
    return turns; }

  // ---------- AI (minimax + alpha-beta) ----------
  function evalB(b,me){ var opp=me==='you'?'cpu':'you', mp=pieces(b,me),op=pieces(b,opp);
    if(op<=1)return 99999; if(mp<=1)return -99999;
    return (mp-op)*100 + (genTurns(b,me).length-genTurns(b,opp).length)*1.5; }
  function minimax(b,side,depth,a,bb,me){
    if(pieces(b,'you')<=1||pieces(b,'cpu')<=1||depth===0) return evalB(b,me);
    var turns=genTurns(b,side); if(!turns.length) return side===me?-99999:99999;
    var opp=side==='you'?'cpu':'you';
    if(side===me){ var best=-1e9; for(var k=0;k<turns.length;k++){ var s=minimax(turns[k].result,opp,depth-1,a,bb,me); if(s>best)best=s; if(best>a)a=best; if(a>=bb)break; } return best; }
    var bst=1e9; for(var j=0;j<turns.length;j++){ var s2=minimax(turns[j].result,opp,depth-1,a,bb,me); if(s2<bst)bst=s2; if(bst<bb)bb=bst; if(a>=bb)break; } return bst; }
  function aiPick(b,side,depth){ var turns=genTurns(b,side); if(!turns.length)return null;
    for(var k=turns.length-1;k>0;k--){var j=(Math.random()*(k+1))|0;var t=turns[k];turns[k]=turns[j];turns[j]=t;}
    var opp=side==='you'?'cpu':'you', best=turns[0],bs=-1e9;
    for(var i=0;i<turns.length;i++){ var s=minimax(turns[i].result,opp,depth-1,-1e9,1e9,side)+turns[i].gained*0.1; if(s>bs){bs=s;best=turns[i];} }
    return best; }

  // ---------- UI STATE ----------
  var cells, turn, mode='cpu', diff=2, selected=null, chaining=null, youCap=0, cpuCap=0, lastFrom=-1, lastTo=-1, over=false, busy=false, history=[];
  var boardEl=$('board'), cellEls=[];
  function setup(){ cells=new Array(49).fill(null);
    for(var r=0;r<N;r++)for(var c=0;c<N;c++){ if(c===3&&r===3)continue; cells[idx(c,r)]= r<3?'cpu':r>3?'you':(c<3?'cpu':'you'); }
    turn='you'; selected=null; chaining=null; youCap=0; cpuCap=0; lastFrom=-1; lastTo=-1; over=false; busy=false; history=[]; }
  function snapshot(){ history.push({b:clone(cells),turn:turn,yc:youCap,cc:cpuCap}); }
  function restore(s){ cells=clone(s.b); turn=s.turn; youCap=s.yc; cpuCap=s.cc; selected=null; chaining=null; over=false; busy=false; lastFrom=-1; lastTo=-1; }

  function build(){ boardEl.innerHTML=''; cellEls=[];
    for(var i=0;i<49;i++){ var p=cc(i); var d=document.createElement('div');
      d.className='cell '+(((p[0]+p[1])%2)?'dk':'lt')+((p[0]===3&&p[1]===3)?' mid':'');
      d.setAttribute('data-i',i); d.addEventListener('click',onClick); boardEl.appendChild(d); cellEls.push(d); } }
  function render(captured,moveTo){ captured=captured||[];
    for(var i=0;i<cellEls.length;i++){ var el=cellEls[i],want=cells[i],pc=el.querySelector('.pc');
      if(want){ if(!pc){ pc=document.createElement('div'); pc.className='pc '+want; pc.dataset.side=want; if(i===moveTo)pc.classList.add('pop'); el.appendChild(pc); }
        else if(pc.dataset.side!==want){ el.removeChild(pc); var np=document.createElement('div'); np.className='pc '+want; np.dataset.side=want; el.appendChild(np); } }
      else if(pc){ if(captured.indexOf(i)>=0){ pc.classList.add('gone'); (function(p,e){setTimeout(function(){if(p.parentNode===e)e.removeChild(p);},300);})(pc,el); } else el.removeChild(pc); }
      el.classList.remove('sel','legal','take','last'); if(i===lastFrom||i===lastTo)el.classList.add('last'); }
    var hi=chaining!=null?chaining:selected;
    if(hi!=null){ cellEls[hi].classList.add('sel');
      var tg = chaining!=null ? chainTargets(cells,chaining,turn) : emptyAdj(cells,selected);
      for(var t=0;t<tg.length;t++){ cellEls[tg[t]].classList.add('legal'); var c2=clone(cells); if(applyStep(c2,hi,tg[t],turn).length) cellEls[tg[t]].classList.add('take'); } }
    hud(); }
  function hud(){ $('youCap').textContent=youCap; $('cpuCap').textContent=cpuCap; if(over)return;
    $('status').textContent = mode==='pvp' ? (turn==='you'?'Light to move':'Dark to move') : (busy?'Enemy is thinking…':(turn==='you'?'Your move':'Enemy is thinking…')); }

  // ---------- moves ----------
  function step(from,to){ var caps=applyStep(cells,from,to,turn); if(turn==='you')youCap+=caps.length; else cpuCap+=caps.length; lastFrom=from; lastTo=to; beep(caps.length?'cap':'move'); render(caps,to); return caps; }
  function humanStep(from,to){ var caps=step(from,to);
    var cont = caps.length ? chainTargets(cells,to,turn) : [];
    if(cont.length){ chaining=to; selected=to; render(caps,to); $('status').textContent='Keep capturing! ⚔️'; }
    else { chaining=null; selected=null; endTurn(); } }
  function endTurn(){ var opp=turn==='you'?'cpu':'you';
    if(pieces(cells,'cpu')<=1){return win('You win! 🏆');}
    if(pieces(cells,'you')<=1){return win(mode==='pvp'?'Dark wins! 🏆':'Enemy wins.');}
    if(genTurns(cells,opp).length===0){ return win(opp==='cpu'?'Enemy is blocked — You win! 🏆':(mode==='pvp'?'Light is blocked — Dark wins!':'You are blocked — Enemy wins.')); }
    turn=opp; snapshot(); render();
    if(mode==='cpu'&&turn==='cpu'){ busy=true; hud(); setTimeout(aiTurn,420); } }
  function aiTurn(){ var t=aiPick(cells,'cpu',diff===1?1:diff===2?2:3); if(!t){ win('Enemy is blocked — You win! 🏆'); return; }
    var s=0; (function next(){ if(s>=t.steps.length){ busy=false; turn='you'; chaining=null; selected=null;
        if(pieces(cells,'you')<=1) return win('Enemy wins.'); if(genTurns(cells,'you').length===0) return win('You are blocked — Enemy wins.'); snapshot(); render(); return; }
      var st=t.steps[s++]; turn='cpu'; step(st[0],st[1]); setTimeout(next,420); })(); }
  function win(msg){ over=true; selected=null; chaining=null; render(); $('status').textContent=msg;
    var m=$('modal'); if(m){ $('modalMsg').textContent=msg; m.classList.add('show'); } beep('win'); }

  function onClick(e){ if(over||busy)return; var i=parseInt(e.currentTarget.getAttribute('data-i'),10);
    if(mode==='cpu'&&turn!=='you')return;
    if(chaining!=null){ if(chainTargets(cells,chaining,turn).indexOf(i)>=0) humanStep(chaining,i); return; }
    if(selected==null){ if(cells[i]===turn&&emptyAdj(cells,i).length){ selected=i; render(); } return; }
    if(emptyAdj(cells,selected).indexOf(i)>=0){ humanStep(selected,i); return; }
    if(cells[i]===turn&&emptyAdj(cells,i).length){ selected=i; render(); return; }
    selected=null; render(); }

  function newGame(){ setup(); snapshot(); render(); var m=$('modal'); if(m)m.classList.remove('show'); }
  function undo(){ if(busy)return; var n=mode==='cpu'?2:1; if(history.length<=n){ newGame(); return; }
    history.splice(-n); restore(history[history.length-1]); render(); var m=$('modal'); if(m)m.classList.remove('show'); }

  // ---------- sound ----------
  var ac; function beep(type){ try{ if(!ac)ac=new (window.AudioContext||window.webkitAudioContext)();
    var seq = type==='win'?[523,659,784]:type==='cap'?[220]:[440];
    seq.forEach(function(f,n){ var o=ac.createOscillator(),g=ac.createGain(); o.type=type==='cap'?'triangle':'sine'; o.frequency.value=f;
      var t0=ac.currentTime+n*0.09; g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(0.12,t0+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t0+0.16);
      o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0+0.18); }); }catch(e){} }

  // ---------- controls ----------
  build(); newGame();
  $('newGame').addEventListener('click',newGame);
  var undoBtn=$('undo'); if(undoBtn)undoBtn.addEventListener('click',undo);
  var rematch=$('rematch'); if(rematch)rematch.addEventListener('click',newGame);
  $('modeSeg').addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b)return; for(var x of e.currentTarget.children)x.classList.remove('active'); b.classList.add('active'); mode=b.getAttribute('data-m'); var ds=$('diffWrap'); if(ds)ds.style.display=mode==='cpu'?'':'none'; newGame(); });
  var dseg=$('diffSeg'); if(dseg)dseg.addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b)return; for(var x of e.currentTarget.children)x.classList.remove('active'); b.classList.add('active'); diff=parseInt(b.getAttribute('data-d'),10); newGame(); });

  // learn diagrams
  function dc(o){o=o||{};var c=document.createElement('div');c.className='dcell'+(o.hl?' hl':'');
    if(o.dot){var d=document.createElement('div');d.className='dot '+o.dot;c.appendChild(d);} if(o.x){var x=document.createElement('span');x.className='x';x.textContent='✕';c.appendChild(x);} if(o.crown){var k=document.createElement('span');k.className='crown';k.textContent='♛';c.appendChild(k);} return c;}
  function arr(){var a=document.createElement('span');a.className='arrow';a.textContent='→';return a;}
  function fill(s,n){var b=document.querySelector(s);if(b)n.forEach(function(x){b.appendChild(x);});}
  fill('.d-move',[dc({dot:'t'}),arr(),dc({hl:true})]); fill('.d-cap',[dc({dot:'t'}),dc({dot:'e',x:true}),dc({dot:'t'})]);
  fill('.d-combo',[dc({dot:'t'}),dc({dot:'e',x:true}),dc({dot:'e',x:true}),dc({dot:'t'})]); fill('.d-crown',[dc({dot:'g',crown:true})]);
})();
