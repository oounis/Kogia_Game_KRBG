// Kharbga — full game: classic rules + Centurion promotion + combos + minimax AI
(function(){
  'use strict';
  function $(id){return document.getElementById(id);}
  var N=7, DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
  function idx(c,r){return r*N+c;} function cc(i){return [i%N,(i/N|0)];}
  function inB(c,r){return c>=0&&c<N&&r>=0&&r<N;}
  function clone(b){return b.slice();}
  function side(v){ return v? (v.charAt(0)==='y'?'you':'cpu') : null; }
  function isCent(v){ return v && v.length===4; }       // 'youC' / 'cpuC'
  function opp(s){ return s==='you'?'cpu':'you'; }
  function pieces(b,s){var n=0;for(var i=0;i<b.length;i++)if(side(b[i])===s)n++;return n;}

  // ---------- RULES ENGINE (pure) ----------
  function moveTargets(b,i){ var v=b[i]; if(!v)return []; var p=cc(i),o=[];
    if(isCent(v)){ for(var k=0;k<4;k++){ var c=p[0]+DIRS[k][0],r=p[1]+DIRS[k][1]; while(inB(c,r)&&!b[idx(c,r)]){ o.push(idx(c,r)); c+=DIRS[k][0]; r+=DIRS[k][1]; } } }
    else { for(var k2=0;k2<4;k2++){ var c2=p[0]+DIRS[k2][0],r2=p[1]+DIRS[k2][1]; if(inB(c2,r2)&&!b[idx(c2,r2)])o.push(idx(c2,r2)); } }
    return o; }
  function applyStep(b,from,to){ var v=b[from],s=side(v); b[to]=v; b[from]=null; var p=cc(to),got=[];
    for(var k=0;k<4;k++){ var ec=p[0]+DIRS[k][0],er=p[1]+DIRS[k][1];
      if(inB(ec,er)){ var e=b[idx(ec,er)]; if(e&&side(e)!==s){ var bc=ec+DIRS[k][0],br=er+DIRS[k][1]; if(inB(bc,br)&&b[idx(bc,br)]&&side(b[idx(bc,br)])===s) got.push(idx(ec,er)); } } }
    for(var g=0;g<got.length;g++) b[got[g]]=null; return got; }
  function chainTargets(b,i){ return moveTargets(b,i).filter(function(t){ var c=clone(b); return applyStep(c,i,t).length>0; }); }
  function genTurns(b,s){ var turns=[];
    for(var i=0;i<b.length;i++){ if(side(b[i])!==s)continue; var mt=moveTargets(b,i);
      for(var a=0;a<mt.length;a++){ var c=clone(b); var got=applyStep(c,i,mt[a]); var steps=[[i,mt[a]]],gained=got.length,pos=mt[a];
        while(got.length){ var ct=chainTargets(c,pos); if(!ct.length)break; var bt=ct[0],bn=-1;
          for(var x=0;x<ct.length;x++){var d=clone(c);var g2=applyStep(d,pos,ct[x]);if(g2.length>bn){bn=g2.length;bt=ct[x];}}
          got=applyStep(c,pos,bt); steps.push([pos,bt]); gained+=got.length; pos=bt; }
        turns.push({steps:steps,result:c,gained:gained}); } }
    return turns; }

  // ---------- AI ----------
  function evalB(b,me){ var o=opp(me),mp=pieces(b,me),op=pieces(b,o); if(op<=1)return 99999; if(mp<=1)return -99999;
    return (mp-op)*100 + (genTurns(b,me).length-genTurns(b,o).length)*1.5; }
  function minimax(b,s,depth,a,bb,me){ if(pieces(b,'you')<=1||pieces(b,'cpu')<=1||depth===0)return evalB(b,me);
    var turns=genTurns(b,s); if(!turns.length)return s===me?-99999:99999; var o=opp(s);
    if(s===me){ var best=-1e9; for(var k=0;k<turns.length;k++){ var v=minimax(turns[k].result,o,depth-1,a,bb,me); if(v>best)best=v; if(best>a)a=best; if(a>=bb)break; } return best; }
    var bst=1e9; for(var j=0;j<turns.length;j++){ var v2=minimax(turns[j].result,o,depth-1,a,bb,me); if(v2<bst)bst=v2; if(bst<bb)bb=bst; if(a>=bb)break; } return bst; }
  function aiPick(b,s,depth){ var turns=genTurns(b,s); if(!turns.length)return null;
    for(var k=turns.length-1;k>0;k--){var j=(Math.random()*(k+1))|0;var t=turns[k];turns[k]=turns[j];turns[j]=t;}
    var o=opp(s),best=turns[0],bs=-1e9;
    for(var i=0;i<turns.length;i++){ var v=minimax(turns[i].result,o,depth-1,-1e9,1e9,s)+turns[i].gained*0.1; if(v>bs){bs=v;best=turns[i];} }
    return best; }

  // ---------- UI STATE ----------
  var cells, turn, mode='cpu', diff=2, selected=null, chaining=null, over=false, busy=false;
  var youCap=0, cpuCap=0, centYou=false, centCpu=false, turnCaps=0, lastFrom=-1, lastTo=-1, history=[];
  var boardEl=$('board'), cellEls=[];
  function setup(){ cells=new Array(49).fill(null);
    for(var r=0;r<N;r++)for(var c=0;c<N;c++){ if(c===3&&r===3)continue; cells[idx(c,r)]= r<3?'cpu':r>3?'you':(c<3?'cpu':'you'); }
    turn='you'; selected=null; chaining=null; over=false; busy=false; youCap=0; cpuCap=0; centYou=false; centCpu=false; turnCaps=0; lastFrom=-1; lastTo=-1; history=[]; }
  function snap(){ history.push({b:clone(cells),t:turn,yc:youCap,cc:cpuCap,cy:centYou,cp:centCpu}); }
  function restore(s){ cells=clone(s.b); turn=s.t; youCap=s.yc; cpuCap=s.cc; centYou=s.cy; centCpu=s.cp; selected=null; chaining=null; over=false; busy=false; lastFrom=-1; lastTo=-1; }

  function build(){ boardEl.innerHTML=''; cellEls=[];
    for(var i=0;i<49;i++){ var p=cc(i); var d=document.createElement('div');
      d.className='cell '+(((p[0]+p[1])%2)?'dk':'lt')+((p[0]===3&&p[1]===3)?' mid':'');
      d.setAttribute('data-i',i); d.addEventListener('click',onClick); boardEl.appendChild(d); cellEls.push(d); } }
  function pcClass(v){ return 'pc '+side(v)+(isCent(v)?' cent':''); }
  function render(captured,moveTo){ captured=captured||[];
    for(var i=0;i<cellEls.length;i++){ var el=cellEls[i],want=cells[i],pc=el.querySelector('.pc');
      if(want){ var cls=pcClass(want);
        if(!pc){ pc=document.createElement('div'); pc.className=cls; pc.dataset.v=want; if(i===moveTo)pc.classList.add('pop'); el.appendChild(pc); }
        else if(pc.dataset.v!==want){ el.removeChild(pc); var np=document.createElement('div'); np.className=cls; np.dataset.v=want; if(i===moveTo)np.classList.add('pop'); el.appendChild(np); } }
      else if(pc){ if(captured.indexOf(i)>=0){ pc.classList.add('gone'); (function(p,e){setTimeout(function(){if(p.parentNode===e)e.removeChild(p);},300);})(pc,el); } else el.removeChild(pc); }
      el.classList.remove('sel','legal','take','last'); if(i===lastFrom||i===lastTo)el.classList.add('last'); }
    var hi=chaining!=null?chaining:selected;
    if(hi!=null){ cellEls[hi].classList.add('sel'); var tg=chaining!=null?chainTargets(cells,chaining):moveTargets(cells,selected);
      for(var t=0;t<tg.length;t++){ cellEls[tg[t]].classList.add('legal'); var c2=clone(cells); if(applyStep(c2,hi,tg[t]).length)cellEls[tg[t]].classList.add('take'); } }
    // movable hint
    var myTurn = !over&&!busy&&selected==null&&chaining==null&&(mode==='pvp'||turn==='you');
    for(var m=0;m<cells.length;m++){ var p2=cellEls[m].querySelector('.pc'); if(p2){ p2.classList.toggle('can', myTurn&&side(cells[m])===turn&&moveTargets(cells,m).length>0); } }
    hud(); }
  function hud(){ $('youCap').textContent=youCap; $('cpuCap').textContent=cpuCap; if(over)return;
    $('status').textContent = mode==='pvp' ? (turn==='you'?'Light to move':'Dark to move') : (busy?'Enemy is thinking…':'Your move'); }
  function pop(txt,big){ var el=$('boardPop'); if(!el)return; el.textContent=txt; el.className='board-pop'+(big?' big':''); void el.offsetWidth; el.classList.add('show'); }

  // ---------- moves ----------
  var COMBO=['','','DOUBLE!','TRIPLE!','ONSLAUGHT!','ANNIHILATION!'];
  function step(from,to){ var caps=applyStep(cells,from,to); if(turn==='you')youCap+=caps.length; else cpuCap+=caps.length;
    if(caps.length){ turnCaps+=caps.length; if(turnCaps>=2) pop(COMBO[Math.min(turnCaps,5)]); }
    lastFrom=from; lastTo=to; beep(caps.length?'cap':'move'); render(caps,to); return caps; }
  function maybePromote(){ // 7 captures -> Centurion (the piece that just moved)
    if(turn==='you'&&!centYou&&youCap>=7&&cells[lastTo]&&side(cells[lastTo])==='you'){ cells[lastTo]='youC'; centYou=true; pop('CENTURION! 👑',true); beep('win'); }
    if(turn==='cpu'&&!centCpu&&cpuCap>=7&&cells[lastTo]&&side(cells[lastTo])==='cpu'){ cells[lastTo]='cpuC'; centCpu=true; pop('ENEMY CENTURION! 👑',true); }
  }
  function humanStep(from,to){ var caps=step(from,to); var cont=caps.length?chainTargets(cells,to):[];
    if(cont.length){ chaining=to; selected=to; render(caps,to); $('status').textContent='Keep capturing! ⚔️'; }
    else { chaining=null; selected=null; maybePromote(); render(); endTurn(); } }
  function endTurn(){ var o=opp(turn);
    if(pieces(cells,'cpu')<=1)return win('You win! 🏆');
    if(pieces(cells,'you')<=1)return win(mode==='pvp'?'Dark wins! 🏆':'Enemy wins.');
    if(genTurns(cells,o).length===0)return win(o==='cpu'?'Enemy is blocked — You win! 🏆':(mode==='pvp'?'Light is blocked — Dark wins!':'You are blocked — Enemy wins.'));
    turn=o; turnCaps=0; snap(); render();
    if(mode==='cpu'&&turn==='cpu'){ busy=true; hud(); setTimeout(aiTurn,420); } }
  function aiTurn(){ var t=aiPick(cells,'cpu',diff===1?1:diff===2?2:3); if(!t){ win('Enemy is blocked — You win! 🏆'); return; }
    turnCaps=0; var s=0; (function next(){ if(s>=t.steps.length){ maybePromote(); busy=false; turn='you'; turnCaps=0; selected=null; chaining=null;
        if(pieces(cells,'you')<=1)return win('Enemy wins.'); if(genTurns(cells,'you').length===0)return win('You are blocked — Enemy wins.'); snap(); render(); return; }
      var st=t.steps[s++]; turn='cpu'; step(st[0],st[1]); setTimeout(next,420); })(); }
  function win(msg){ over=true; selected=null; chaining=null; render(); $('status').textContent=msg; var m=$('modal'); if(m){ $('modalMsg').textContent=msg; m.classList.add('show'); } beep('win'); }

  function onClick(e){ if(over||busy)return; var i=parseInt(e.currentTarget.getAttribute('data-i'),10);
    if(mode==='cpu'&&turn!=='you')return;
    if(chaining!=null){ if(chainTargets(cells,chaining).indexOf(i)>=0) humanStep(chaining,i); return; }
    if(selected==null){ if(side(cells[i])===turn&&moveTargets(cells,i).length){ selected=i; render(); } return; }
    if(moveTargets(cells,selected).indexOf(i)>=0){ humanStep(selected,i); return; }
    if(side(cells[i])===turn&&moveTargets(cells,i).length){ selected=i; render(); return; }
    selected=null; render(); }

  function newGame(){ setup(); snap(); render(); var m=$('modal'); if(m)m.classList.remove('show'); }
  function undo(){ if(busy)return; var n=mode==='cpu'?2:1; if(history.length<=n){ newGame(); return; }
    history.splice(-n); restore(history[history.length-1]); render(); var m=$('modal'); if(m)m.classList.remove('show'); }

  var ac; function beep(type){ try{ if(!ac)ac=new (window.AudioContext||window.webkitAudioContext)();
    var seq=type==='win'?[523,659,784]:type==='cap'?[210]:[440];
    seq.forEach(function(f,n){ var o=ac.createOscillator(),g=ac.createGain(); o.type=type==='cap'?'triangle':'sine'; o.frequency.value=f;
      var t0=ac.currentTime+n*0.09; g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(0.12,t0+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t0+0.16);
      o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0+0.18); }); }catch(e){} }

  build(); newGame();
  $('newGame').addEventListener('click',newGame);
  var ub=$('undo'); if(ub)ub.addEventListener('click',undo);
  var rb=$('rematch'); if(rb)rb.addEventListener('click',newGame);
  $('modeSeg').addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b)return; var ch=e.currentTarget.children; for(var i=0;i<ch.length;i++)ch[i].classList.remove('active'); b.classList.add('active'); mode=b.getAttribute('data-m'); var dw=$('diffWrap'); if(dw)dw.style.display=mode==='cpu'?'':'none'; newGame(); });
  var ds=$('diffSeg'); if(ds)ds.addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b)return; var ch=e.currentTarget.children; for(var i=0;i<ch.length;i++)ch[i].classList.remove('active'); b.classList.add('active'); diff=parseInt(b.getAttribute('data-d'),10); newGame(); });

  // learn diagrams
  function dc(o){o=o||{};var c=document.createElement('div');c.className='dcell'+(o.hl?' hl':'');
    if(o.dot){var d=document.createElement('div');d.className='dot '+o.dot;c.appendChild(d);} if(o.x){var x=document.createElement('span');x.className='x';x.textContent='✕';c.appendChild(x);} if(o.crown){var k=document.createElement('span');k.className='crown';k.textContent='♛';c.appendChild(k);} return c;}
  function arr(){var a=document.createElement('span');a.className='arrow';a.textContent='→';return a;}
  function fill(s,n){var b=document.querySelector(s);if(b)n.forEach(function(x){b.appendChild(x);});}
  fill('.d-move',[dc({dot:'t'}),arr(),dc({hl:true})]); fill('.d-cap',[dc({dot:'t'}),dc({dot:'e',x:true}),dc({dot:'t'})]);
  fill('.d-combo',[dc({dot:'t'}),dc({dot:'e',x:true}),dc({dot:'e',x:true}),dc({dot:'t'})]); fill('.d-crown',[dc({dot:'g',crown:true})]);
})();
