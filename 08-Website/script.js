// Kharbga — full game: classic rules + Centurion promotion + combos + minimax AI + Warlord Mode
(function(){
  'use strict';
  function $(id){return document.getElementById(id);}
  var N=7, DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
  function idx(c,r){return r*N+c;} function cc(i){return [i%N,(i/N|0)];}
  function inB(c,r){return c>=0&&c<N&&r>=0&&r<N;}
  function clone(b){return b.slice();}
  function side(v){ return v? (v.charAt(0)==='y'?'you':'cpu') : null; }
  function isCent(v){ return v && (v === 'youC' || v === 'cpuC'); }
  function opp(s){ return s==='you'?'cpu':'you'; }
  function pieces(b,s){var n=0;for(var i=0;i<b.length;i++)if(side(b[i])===s)n++;return n;}

  // ---------- ALGEBRAIC COORDINATES ----------
  function coord(i) {
    if(i===24) return 'Citadel';
    var c = i % 7;
    var r = Math.floor(i / 7);
    return ['A','B','C','D','E','F','G'][c] + (7 - r);
  }

  // ---------- WARLORD HELPERS ----------
  function getPlacementType(count) {
    if(count === 0) return 'Warlord 👑';
    return 'Soldier';
  }

  function getPieceValue(s, count) {
    if(count === 0) return s === 'you' ? 'youW' : 'cpuW';
    return s;
  }

  // ---------- RULES ENGINE (pure) ----------
  function moveTargets(b,i){ var v=b[i]; if(!v)return []; var p=cc(i),o=[];
    if(firstMove){ if((i===17||i===23||i===25||i===31)&&!b[24])return [24]; return []; }
    if(v==='youW'||v==='cpuW'){
      var s = side(v);
      for(var k=0;k<4;k++){
        var c=p[0]+DIRS[k][0],r=p[1]+DIRS[k][1];
        while(inB(c,r)){
          var target = b[idx(c,r)];
          if(!target){ o.push(idx(c,r)); }
          else {
            if(side(target)!==s){ o.push(idx(c,r)); }
            break;
          }
          c+=DIRS[k][0]; r+=DIRS[k][1];
        }
      }
      return o;
    }
    if(isCent(v)){ for(var k=0;k<4;k++){ var c=p[0]+DIRS[k][0],r=p[1]+DIRS[k][1]; while(inB(c,r)&&!b[idx(c,r)]){ o.push(idx(c,r)); c+=DIRS[k][0]; r+=DIRS[k][1]; } } }
    else { for(var k2=0;k2<4;k2++){ var c2=p[0]+DIRS[k2][0],r2=p[1]+DIRS[k2][1]; if(inB(c2,r2)&&!b[idx(c2,r2)])o.push(idx(c2,r2)); } }
    return o; }

  function applyStep(b,from,to){ var v=b[from],s=side(v);
    var target = b[to];
    var got = [];
    if(target && side(target) !== s) {
      got.push(to);
    }
    b[to]=v; b[from]=null;
    var p=cc(to);
    for(var k=0;k<4;k++){ var ec=p[0]+DIRS[k][0],er=p[1]+DIRS[k][1];
      if(inB(ec,er)){ var e=b[idx(ec,er)];
        if(e&&side(e)!==s){ var bc=ec+DIRS[k][0],br=er+DIRS[k][1];
          if(inB(bc,br)&&b[idx(bc,br)]&&side(b[idx(bc,br)])===s) got.push(idx(ec,er)); } } }
    for(var g=0;g<got.length;g++){
      if(got[g] !== to) b[got[g]]=null;
    }
    return got; }

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
  function minimax(b,s,depth,a,bb,me){
    var o=opp(me);
    var myWarlord=false, opWarlord=false;
    for(var i=0;i<b.length;i++){
      if(b[i]===me+'W')myWarlord=true;
      if(b[i]===o+'W')opWarlord=true;
    }
    if(!myWarlord)return -99999;
    if(!opWarlord)return 99999;

    if(pieces(b,'you')<=1||pieces(b,'cpu')<=1||depth===0)return evalB(b,me);
    var turns=genTurns(b,s); if(!turns.length)return s===me?-99999:99999; var ot=opp(s);
    if(s===me){ var best=-1e9; for(var k=0;k<turns.length;k++){ var v=minimax(turns[k].result,ot,depth-1,a,bb,me); if(v>best)best=v; if(best>a)a=best; if(a>=bb)break; } return best; }
    var bst=1e9; for(var j=0;j<turns.length;j++){ var v2=minimax(turns[j].result,ot,depth-1,a,bb,me); if(v2<bst)bst=v2; if(bst<bb)bb=bst; if(a>=bb)break; } return bst; }
  function aiPick(b,s,depth){ var turns=genTurns(b,s); if(!turns.length)return null;
    for(var k=turns.length-1;k>0;k--){var j=(Math.random()*(k+1))|0;var t=turns[k];turns[k]=turns[j];turns[j]=t;}
    var o=opp(s),best=turns[0],bs=-1e9;
    for(var i=0;i<turns.length;i++){ var v=minimax(turns[i].result,o,depth-1,-1e9,1e9,s)+turns[i].gained*0.1; if(v>bs){bs=v;best=turns[i];} }
    return best; }

  // ---------- UI STATE ----------
  var cells, turn, mode='cpu', diff=2, selected=null, chaining=null, over=false, busy=false;
  var youCap=0, cpuCap=0, centYou=false, centCpu=false, turnCaps=0, lastFrom=-1, lastTo=-1, history=[];
  var phase='placement', youPlaced=0, cpuPlaced=0, turnPlaced=0, firstMove=true, movesLog=[];
  var cpuWarlordCaptured=false, youWarlordCaptured=false;
  var boardEl=$('board'), cellEls=[];
  
  function setup(){ cells=new Array(49).fill(null);
    phase='placement'; turn='you'; youPlaced=0; cpuPlaced=0; turnPlaced=0; firstMove=true; movesLog=[];
    selected=null; chaining=null; over=false; busy=false; youCap=0; cpuCap=0; centYou=false; centCpu=false; turnCaps=0; lastFrom=-1; lastTo=-1; history=[];
    cpuWarlordCaptured=false; youWarlordCaptured=false;
    var oppTitle = $('opponentTitle'); if(oppTitle){ oppTitle.textContent = diff === 1 ? 'EASY BOT' : (diff === 2 ? 'MEDIUM BOT' : 'EXPERT BOT'); }
    var oppName = $('opponentName'); if(oppName){ oppName.textContent = mode === 'pvp' ? 'Player 2' : 'Centurion AI'; }
    updateLog(); }
  function snap(){ history.push({b:clone(cells),t:turn,yc:youCap,cc:cpuCap,cy:centYou,cp:centCpu,ph:phase,yp:youPlaced,cpP:cpuPlaced,tp:turnPlaced,fm:firstMove,ml:movesLog.slice(),cW:cpuWarlordCaptured,yW:youWarlordCaptured}); }
  function restore(s){ cells=clone(s.b); turn=s.t; youCap=s.yc; cpuCap=s.cc; centYou=s.cy; centCpu=s.cp; phase=s.ph; youPlaced=s.yp; cpuPlaced=s.cpP; turnPlaced=s.tp; firstMove=s.fm; movesLog=s.ml.slice(); cpuWarlordCaptured=s.cW; youWarlordCaptured=s.yW; selected=null; chaining=null; over=false; busy=false; lastFrom=-1; lastTo=-1; updateLog(); }

  function build(){ boardEl.innerHTML=''; cellEls=[];
    for(var i=0;i<49;i++){ var p=cc(i); var d=document.createElement('div');
      d.className='cell '+(((p[0]+p[1])%2)?'dk':'lt')+((p[0]===3&&p[1]===3)?' mid':'');
      d.setAttribute('data-i',i); d.addEventListener('click',onClick); boardEl.appendChild(d); cellEls.push(d); } }
  function pcClass(v){
    var s = side(v);
    var type = v.substring(3);
    var typeClass = type === 'W' ? ' warlord' : (isCent(v) ? ' cent' : '');
    return 'pc ' + s + typeClass;
  }
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
    
    // Captured pieces rendering in Chess.com sidebar profiles
    var uBox = $('userCapturedBox'), cBox = $('cpuCapturedBox');
    if(uBox){ uBox.innerHTML = ''; for(var j=0; j<youCap; j++){ var s=document.createElement('span'); s.className='cap-stone dark'; uBox.appendChild(s); } }
    if(cBox){ cBox.innerHTML = ''; for(var j=0; j<cpuCap; j++){ var s=document.createElement('span'); s.className='cap-stone light'; cBox.appendChild(s); } }

    // movable hint
    var myTurn = (phase==='play')&&!over&&!busy&&selected==null&&chaining==null&&(mode==='pvp'||turn==='you');
    for(var m=0;m<cells.length;m++){ var p2=cellEls[m].querySelector('.pc'); if(p2){ p2.classList.toggle('can', myTurn&&side(cells[m])===turn&&moveTargets(cells,m).length>0); } }
    hud(); }
  function hud(){ $('youCap').textContent=youCap; $('cpuCap').textContent=cpuCap; if(over)return;
    var hintEl = document.querySelector('.hint');
    if(phase==='placement'){
      var leftYou=24-youPlaced, leftCpu=24-cpuPlaced;
      if(mode==='pvp'){
        var pName=turn==='you'?'Light':'Dark';
        var nextType = turn==='you' ? getPlacementType(youPlaced) : getPlacementType(cpuPlaced);
        $('status').textContent=pName+': Place ' + nextType + ' ('+(turn==='you'?leftYou:leftCpu)+' left)';
      }else{
        if(turn==='you'){
          var nextType = getPlacementType(youPlaced);
          $('status').textContent='Place ' + nextType + ' ('+leftYou+' left)';
        }
        else $('status').textContent='Enemy is placing soldiers…';
      }
      if(hintEl) hintEl.innerHTML="<b>Placement Phase:</b> Alternate placing 2 soldiers. The first piece you place will be your <b>Warlord 👑</b> (capture = instant defeat!). The rest are standard soldiers. Center Citadel remains empty.";
    }else{
      $('status').textContent = mode==='pvp' ? (turn==='you'?'Light to move':'Dark to move') : (busy?'Enemy is thinking…':'Your move');
      if(hintEl){
        if(firstMove) hintEl.innerHTML="<b>First Move:</b> Light (You) must move a soldier adjacent to the Citadel into the Citadel to open the board.";
        else hintEl.innerHTML="Glowing soldiers can move. Tap one, then tap a highlighted square. Trap an enemy between two of yours to capture — <b>keep capturing</b> for a combo. Reach <b>7 captures</b> and that soldier becomes a <b>Centurion 👑</b>. Capturing the Enemy Warlord 👑 (by landing on it or sandwiching it) results in an instant victory!";
      }
    }
  }
  function pop(txt,big){ var el=$('boardPop'); if(!el)return; el.textContent=txt; el.className='board-pop'+(big?' big':''); void el.offsetWidth; el.classList.add('show'); }

  // ---------- moves ----------
  var COMBO=['','','DOUBLE!','TRIPLE!','ONSLAUGHT!','ANNIHILATION!'];
  function step(from,to){
    var originalCells = clone(cells);
    var caps=applyStep(cells,from,to);
    if(turn==='you')youCap+=caps.length; else cpuCap+=caps.length;
    if(firstMove)firstMove=false;
    
    // Check if Warlord was captured
    for(var g=0; g<caps.length; g++){
      var capturedPiece = originalCells[caps[g]];
      if(capturedPiece === 'cpuW') cpuWarlordCaptured = true;
      if(capturedPiece === 'youW') youWarlordCaptured = true;
    }

    var sideName = turn==='you' ? 'You' : (mode==='pvp'?'Player 2':'CPU');
    var capStr = caps.length ? ' (captured '+caps.length+')' : '';
    addLog(sideName + ': ' + coord(from) + ' ➔ ' + coord(to) + capStr);
    
    if(caps.length){ turnCaps+=caps.length; if(turnCaps>=2) pop(COMBO[Math.min(turnCaps,5)]); }
    lastFrom=from; lastTo=to; beep(caps.length?'cap':'move'); render(caps,to);
    
    if(cpuWarlordCaptured) { win('You captured the Enemy Warlord! 🏆'); return caps; }
    if(youWarlordCaptured) { win(mode==='pvp'?'Player 2 captured your Warlord! 🏆':'Enemy captured your Warlord.'); return caps; }
    
    return caps; }
  function maybePromote(){ // 7 captures -> Centurion (the piece that just moved)
    if(turn==='you'&&!centYou&&youCap>=7&&cells[lastTo]&&side(cells[lastTo])==='you'){ cells[lastTo]='youC'; centYou=true; pop('CENTURION! 👑',true); beep('win'); addLog('👑 You promoted a Centurion at '+coord(lastTo)+'!'); }
    if(turn==='cpu'&&!centCpu&&cpuCap>=7&&cells[lastTo]&&side(cells[lastTo])==='cpu'){ cells[lastTo]='cpuC'; centCpu=true; pop('ENEMY CENTURION! 👑',true); addLog('👑 CPU promoted a Centurion at '+coord(lastTo)+'!'); }
  }
  function humanStep(from,to){ var caps=step(from,to); var cont=caps.length&&!cpuWarlordCaptured&&!youWarlordCaptured?chainTargets(cells,to):[];
    if(cont.length){ chaining=to; selected=to; render(caps,to); $('status').textContent='Keep capturing! ⚔️'; }
    else { chaining=null; selected=null; if(!cpuWarlordCaptured&&!youWarlordCaptured) maybePromote(); render(); if(!cpuWarlordCaptured&&!youWarlordCaptured) endTurn(); } }
  function endTurn(){ var o=opp(turn);
    if(pieces(cells,'cpu')<=1)return win('You win! 🏆');
    if(pieces(cells,'you')<=1)return win(mode==='pvp'?'Dark wins! 🏆':'Enemy wins.');
    if(genTurns(cells,o).length===0)return win(o==='cpu'?'Enemy is blocked — You win! 🏆':(mode==='pvp'?'Light is blocked — Dark wins!':'You are blocked — Enemy wins.'));
    turn=o; turnCaps=0; snap(); render();
    if(mode==='cpu'&&turn==='cpu'){ busy=true; hud(); setTimeout(aiTurn,420); } }
  function aiTurn(){ var t=aiPick(cells,'cpu',diff===1?1:diff===2?2:3); if(!t){ win('Enemy is blocked — You win! 🏆'); return; }
    turnCaps=0; var s=0; (function next(){
      if(cpuWarlordCaptured||youWarlordCaptured) return;
      if(s>=t.steps.length){ maybePromote(); busy=false; turn='you'; turnCaps=0; selected=null; chaining=null;
        if(pieces(cells,'you')<=1)return win('Enemy wins.'); if(genTurns(cells,'you').length===0)return win('You are blocked — Enemy wins.'); snap(); render(); return; }
      var st=t.steps[s++]; turn='cpu'; step(st[0],st[1]); setTimeout(next,420); })(); }
  function win(msg){ over=true; selected=null; chaining=null; render(); $('status').textContent=msg; var m=$('modal'); if(m){ $('modalMsg').textContent=msg; m.classList.add('show'); } beep('win'); addLog('Game Over: ' + msg); }

  function aiPlace(){
    var empty=[]; for(var i=0;i<49;i++){ if(i!==24&&!cells[i])empty.push(i); }
    if(empty.length>=2){
      var idx1=Math.floor(Math.random()*empty.length); var cell1=empty[idx1]; empty.splice(idx1,1);
      var idx2=Math.floor(Math.random()*empty.length); var cell2=empty[idx2];
      
      var pType1 = getPieceValue('cpu', cpuPlaced);
      cells[cell1]=pType1; cpuPlaced++;
      
      var pType2 = getPieceValue('cpu', cpuPlaced);
      cells[cell2]=pType2; cpuPlaced++;
      
      beep('move'); 
      var name1 = pType1 === 'cpuW' ? 'Warlord' : 'Soldier';
      var name2 = pType2 === 'cpuW' ? 'Warlord' : 'Soldier';
      addLog('CPU placed '+name1+' at '+coord(cell1)+' & '+name2+' at '+coord(cell2));
      render();
    }
    turnPlaced=0;
    if(youPlaced+cpuPlaced===48){
      phase='play'; turn='you'; firstMove=true; pop('PLAY PHASE! ⚔️',true);
    } else {
      turn='you';
    }
    busy=false; snap(); render();
  }

  function onClick(e){ if(over||busy)return; var i=parseInt(e.currentTarget.getAttribute('data-i'),10);
    if(mode==='cpu'&&turn!=='you')return;
    if(phase==='placement'){
      if(i===24||cells[i])return;
      var pType = turn==='you' ? getPieceValue('you', youPlaced) : getPieceValue('cpu', cpuPlaced);
      cells[i]=pType; turnPlaced++;
      if(turn==='you')youPlaced++; else cpuPlaced++;
      var sideName = turn==='you' ? 'You' : (mode==='pvp'?'Player 2':'CPU');
      var nameString = pType === 'youW' || pType === 'cpuW' ? 'Warlord' : 'Soldier';
      addLog(sideName + ' placed ' + nameString + ' at ' + coord(i));
      beep('move'); render();
      if(turnPlaced===2){
        turnPlaced=0;
        if(youPlaced+cpuPlaced===48){
          phase='play'; turn='you'; firstMove=true; pop('PLAY PHASE! ⚔️',true); snap(); render();
        } else {
          turn=opp(turn); snap(); render();
          if(mode==='cpu'&&turn==='cpu'){ busy=true; hud(); setTimeout(aiPlace,420); }
        }
      } else {
        snap(); render();
      }
      return;
    }
    if(chaining!=null){ if(chainTargets(cells,chaining).indexOf(i)>=0) humanStep(chaining,i); return; }
    if(selected==null){ if(side(cells[i])===turn&&moveTargets(cells,i).length){ selected=i; render(); } return; }
    if(moveTargets(cells,selected).indexOf(i)>=0){ humanStep(selected,i); return; }
    if(side(cells[i])===turn&&moveTargets(cells,i).length){ selected=i; render(); return; }
    selected=null; render(); }

  function newGame(){ setup(); snap(); render(); var m=$('modal'); if(m)m.classList.remove('show'); }
  function undo(){ if(busy)return; var n=mode==='cpu'?2:1; if(history.length<=n){ newGame(); return; }
    history.splice(-n); restore(history[history.length-1]); render(); var m=$('modal'); if(m)m.classList.remove('show'); }

  function addLog(txt){ movesLog.push(txt); updateLog(); }
  function updateLog(){ var logEl = $('moveLog'); if(!logEl) return;
    if(movesLog.length === 0){ logEl.innerHTML = '<div class="empty-log">Drop 2 soldiers to begin the placement phase.</div>'; return; }
    logEl.innerHTML = ''; for(var i=0; i<movesLog.length; i++){ var d = document.createElement('div');
      d.className = 'log-item'; d.textContent = movesLog[i]; logEl.appendChild(d); }
    logEl.scrollTop = logEl.scrollHeight; }

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
