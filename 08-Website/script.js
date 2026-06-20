// Kharbga — full game: classic rules + Mullah promotion + combos + minimax AI + Sultan Mode
(function(){
  'use strict';
  function $(id){return document.getElementById(id);}
  var N=7;
  var DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
  
  function idx(c,r){return r*N+c;} 
  function cc(i){return [i%N,(i/N|0)];}
  function inB(c,r){return c>=0&&c<N&&r>=0&&r<N;}
  function clone(b){return b.slice();}
  function side(v){ 
    if(!v) return null;
    return v.startsWith('you') ? 'you' : 'cpu'; 
  }
  function isCent(v){ return v === 'youC' || v === 'cpuC'; } // Mullah
  function isWarlord(v){ return v === 'youW' || v === 'cpuW'; } // Sultan
  function opp(s){ return s==='you'?'cpu':'you'; }
  function pieces(b,s){var n=0;for(var i=0;i<b.length;i++)if(side(b[i])===s)n++;return n;}

  // ---------- ALGEBRAIC COORDINATES ----------
  function coord(i) {
    if(i===24) return 'Citadel';
    var c = i % 7;
    var r = Math.floor(i / 7);
    return ['A','B','C','D','E','F','G'][c] + (7 - r);
  }

  // ---------- SULTAN HELPERS ----------
  function getPlacementType(count) {
    if(count === 0) return 'Sultan 👑';
    return 'Soldier';
  }

  // ---------- VECTOR PIECE GRAPHICS ----------
  var SVGS = {
    // Carthage Standard Soldier (Sign of Tanit)
    you: '<svg viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="pc-svg"><circle cx="12" cy="6" r="3"/><path d="M5 11h14"/><path d="M12 11L6 20h12Z"/></svg>',
    
    // Roman Standard Soldier (Laurel Wreath with Gladius)
    cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="#c5b6a7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pc-svg"><path d="M5 15c-1-3-1-7 2-10a7 7 0 0 1 5-2"/><path d="M19 15c1-3 1-7-2-10a7 7 0 0 0-5-2"/><path d="M12 7v11M10 16h4"/></svg>',
    
    // Carthage Mullah Promoted (Upgraded Tanit with sun rays / double crescent)
    youC: '<svg viewBox="0 0 24 24" fill="none" stroke="#ffe066" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="pc-svg"><circle cx="12" cy="5" r="2.5"/><path d="M5 9h14"/><path d="M12 9L6 17h12Z"/><path d="M3 20c5 2 13 2 18 0"/></svg>',
    
    // Roman Mullah Promoted (Crest Helmet)
    cpuC: '<svg viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="pc-svg"><path d="M8 5a4 4 0 0 1 8 0"/><path d="M5 11a7 7 0 0 0 14 0v3H5v-3z"/><path d="M12 11v6"/></svg>',
    
    // Carthage Sultan (Golden Crown)
    youW: '<svg viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pc-svg"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" /><path d="M3 20h18" /></svg>',
    
    // Roman Sultan (Imperial Silver & Crimson Crown)
    cpuW: '<svg viewBox="0 0 24 24" fill="none" stroke="#ee5253" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pc-svg"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" /><path d="M3 20h18" /></svg>'
  };

  function createPieceElement(v, isPop) {
    var s = side(v);
    var isW = isWarlord(v);
    var isC = isCent(v);
    var cls = 'pc ' + s + (isW ? ' warlord' : (isC ? ' cent' : ''));
    
    var pc = document.createElement('div');
    pc.className = cls;
    pc.dataset.v = v;
    if(isPop) pc.classList.add('pop');
    
    var svgContent = '';
    if (isW) {
      svgContent = s === 'you' ? SVGS.youW : SVGS.cpuW;
    } else if (isC) {
      svgContent = s === 'you' ? SVGS.youC : SVGS.cpuC;
    } else {
      svgContent = s === 'you' ? SVGS.you : SVGS.cpu;
    }
    
    pc.innerHTML = svgContent;
    return pc;
  }

  function getPieceValue(s, count) {
    if(count === 0) return s === 'you' ? 'youW' : 'cpuW';
    return s;
  }

  // ---------- SMART CPU PLACEMENT HEURISTICS ----------
  function getCpuPlacementSlots(isSultan) {
    var empty = [];
    for(var i=0; i<49; i++) {
      if(i === 24 || cells[i]) continue;
      var r = Math.floor(i / 7);
      var c = i % 7;
      if(r < 3 || (r === 3 && c < 3)) {
        empty.push(i);
      }
    }
    if(empty.length === 0) {
      for(var i=0; i<49; i++) { if(i !== 24 && !cells[i]) empty.push(i); }
    }
    if(isSultan) {
      var backRank = empty.filter(function(x) { return Math.floor(x / 7) === 0; });
      if(backRank.length > 0) return backRank;
      var secondRank = empty.filter(function(x) { return Math.floor(x / 7) === 1; });
      if(secondRank.length > 0) return secondRank;
    } else {
      var adjacent = [];
      for(var j=0; j<empty.length; j++) {
        var idxVal = empty[j];
        var p = cc(idxVal);
        var hasCpuAdj = false;
        for(var k=0; k<4; k++) {
          var nc = p[0]+DIRS[k][0], nr = p[1]+DIRS[k][1];
          if(inB(nc,nr) && cells[idx(nc,nr)] && side(cells[idx(nc,nr)]) === 'cpu') {
            hasCpuAdj = true;
            break;
          }
        }
        if(hasCpuAdj) adjacent.push(idxVal);
      }
      if(adjacent.length > 0) return adjacent;
    }
    return empty;
  }

  // ---------- RULES ENGINE (pure custodial, orthogonal only) ----------
  function moveTargets(b,i){ 
    var v=b[i]; 
    if(!v)return []; 
    var p=cc(i),o=[];
    var s=side(v);

    if(firstMove){ 
      if((i===17||i===23||i===25||i===31)&&!b[24])return [24]; 
      return []; 
    }

    if(isWarlord(v) || isCent(v)){ 
      // Sultan & Mullah slide any number of squares orthogonally
      for(var k=0;k<4;k++){ 
        var c=p[0]+DIRS[k][0],r=p[1]+DIRS[k][1]; 
        while(inB(c,r)&&!b[idx(c,r)]){ 
          o.push(idx(c,r)); 
          c+=DIRS[k][0]; 
          r+=DIRS[k][1]; 
        } 
      } 
    } else { 
      // Standard Soldier moves 1 square orthogonally
      for(var k2=0;k2<4;k2++){ 
        var c2=p[0]+DIRS[k2][0],r2=p[1]+DIRS[k2][1]; 
        if(inB(c2,r2)&&!b[idx(c2,r2)]) o.push(idx(c2,r2)); 
      } 
    }
    return o; 
  }

  function applyStep(b,from,to){ 
    var v=b[from], s=side(v);
    var got = [];

    b[to]=v; 
    b[from]=null;

    var p=cc(to);
    // Standard custodial sandwich capture (orthogonal sandwiching)
    for(var k=0;k<4;k++){ 
      var ec=p[0]+DIRS[k][0],er=p[1]+DIRS[k][1];
      if(inB(ec,er)){ 
        var e=b[idx(ec,er)];
        if(e&&side(e)!==s){ 
          var bc=ec+DIRS[k][0],br=er+DIRS[k][1];
          if(inB(bc,br)&&b[idx(bc,br)]&&side(b[idx(bc,br)])===s) {
            got.push(idx(ec,er)); 
          }
        } 
      } 
    }

    for(var g=0;g<got.length;g++){
      b[got[g]]=null;
    }
    return got; 
  }

  function chainTargets(b,i){ 
    return moveTargets(b,i).filter(function(t){ 
      var c=clone(b); 
      return applyStep(c,i,t).length>0; 
    }); 
  }

  function genTurns(b,s){ 
    var turns=[];
    for(var i=0;i<b.length;i++){ 
      if(side(b[i])!==s)continue; 
      var mt=moveTargets(b,i);
      for(var a=0;a<mt.length;a++){ 
        var c=clone(b); 
        var got=applyStep(c,i,mt[a]); 
        var steps=[[i,mt[a]]], gained=got.length, pos=mt[a];
        while(got.length){ 
          var ct=chainTargets(c,pos); 
          if(!ct.length)break; 
          var bt=ct[0],bn=-1;
          for(var x=0;x<ct.length;x++){
            var d=clone(c);
            var g2=applyStep(d,pos,ct[x]);
            if(g2.length>bn){
              bn=g2.length;
              bt=ct[x];
            }
          }
          got=applyStep(c,pos,bt); 
          steps.push([pos,bt]); 
          gained+=got.length; 
          pos=bt; 
        }
        turns.push({steps:steps,result:c,gained:gained}); 
      } 
    }
    return turns; 
  }

  // ---------- AI minimax ----------
  function evalB(b,me){ 
    var o=opp(me), mp=pieces(b,me), op=pieces(b,o); 
    if(op<=1)return 99999; 
    if(mp<=1)return -99999;
    return (mp-op)*100 + (genTurns(b,me).length-genTurns(b,o).length)*1.5; 
  }

  function minimax(b,s,depth,a,bb,me){
    var o=opp(me);
    var mySultan=false, opSultan=false;
    for(var i=0;i<b.length;i++){
      if(b[i]===me+'W')mySultan=true;
      if(b[i]===o+'W')opSultan=true;
    }
    if(!mySultan)return -99999;
    if(!opSultan)return 99999;

    if(pieces(b,'you')<=1||pieces(b,'cpu')<=1||depth===0)return evalB(b,me);
    var turns=genTurns(b,s); 
    if(!turns.length)return s===me?-99999:99999; 
    var ot=opp(s);
    if(s===me){ 
      var best=-1e9; 
      for(var k=0;k<turns.length;k++){ 
        var v=minimax(turns[k].result,ot,depth-1,a,bb,me); 
        if(v>best)best=v; 
        if(best>a)a=best; 
        if(a>=bb)break; 
      } 
      return best; 
    }
    var bst=1e9; 
    for(var j=0;j<turns.length;j++){ 
      var v2=minimax(turns[j].result,ot,depth-1,a,bb,me); 
      if(v2<bst)bst=v2; 
      if(bst<bb)bb=bst; 
      if(a>=bb)break; 
    } 
    return bst; 
  }

  function aiPick(b,s,depth){ 
    var turns=genTurns(b,s); 
    if(!turns.length)return null;
    for(var k=turns.length-1;k>0;k--){
      var j=(Math.random()*(k+1))|0;
      var t=turns[k];
      turns[k]=turns[j];
      turns[j]=t;
    }
    var o=opp(s), best=turns[0], bs=-1e9;
    for(var i=0;i<turns.length;i++){ 
      var v=minimax(turns[i].result,o,depth-1,-1e9,1e9,s)+turns[i].gained*0.1; 
      if(v>bs){
        bs=v;
        best=turns[i];
      } 
    }
    return best; 
  }

  // ---------- UI STATE ----------
  var cells, turn, mode='cpu', playMode='draft', diff=2, selected=null, chaining=null, over=false, busy=false;
  var youCap=0, cpuCap=0, centYou=false, centCpu=false, turnCaps=0, lastFrom=-1, lastTo=-1, history=[];
  var phase='play', youPlaced=24, cpuPlaced=24, turnPlaced=0, firstMove=true, movesLog=[];
  var cpuSultanCaptured=false, youSultanCaptured=false;
  var boardEl=$('board'), cellEls=[];
  
  function setup(){ 
    cells=new Array(49).fill(null);
    selected=null; 
    chaining=null; 
    over=false; 
    busy=false; 
    youCap=0; 
    cpuCap=0; 
    centYou=false; 
    centCpu=false; 
    turnCaps=0; 
    lastFrom=-1; 
    lastTo=-1; 
    history=[];
    cpuSultanCaptured=false; 
    youSultanCaptured=false;
    movesLog=[];
    
    var oppTitle = $('opponentTitle'); 
    if(oppTitle){ 
      oppTitle.textContent = diff === 1 ? 'EASY BOT' : (diff === 2 ? 'MEDIUM BOT' : 'EXPERT BOT'); 
    }
    var oppName = $('opponentName'); 
    if(oppName){ 
      oppName.textContent = mode === 'pvp' ? 'Player 2' : 'Sultan AI'; 
    }
    
    if (playMode === 'direct') {
      for(var i=0; i<49; i++){
        if(i === 24) continue;
        if(i < 24) {
          cells[i] = 'cpu';
        } else {
          cells[i] = 'you';
        }
      }
      cells[3] = 'cpuW';  // CPU Sultan D7
      cells[45] = 'youW'; // User Sultan D1
      
      phase = 'play';
      youPlaced = 24;
      cpuPlaced = 24;
      turnPlaced = 0;
      firstMove = true;
      turn = 'you';
      addLog('⚡ Direct Play initiated. Sultans stationed at back ranks.');
    } else {
      phase = 'placement';
      youPlaced = 0;
      cpuPlaced = 0;
      turnPlaced = 0;
      firstMove = true;
      turn = 'you';
      addLog('♟ Draft Mode initiated. Alternate placing pieces.');
    }
    
    updateLog(); 
  }

  function snap(){ 
    history.push({
      b:clone(cells),
      t:turn,
      yc:youCap,
      cc:cpuCap,
      cy:centYou,
      cp:centCpu,
      ph:phase,
      yp:youPlaced,
      cpP:cpuPlaced,
      tp:turnPlaced,
      fm:firstMove,
      ml:movesLog.slice(),
      cW:cpuSultanCaptured,
      yW:youSultanCaptured
    }); 
  }

  function restore(s){ 
    cells=clone(s.b); 
    turn=s.t; 
    youCap=s.yc; 
    cpuCap=s.cc; 
    centYou=s.cy; 
    centCpu=s.cp; 
    phase=s.ph; 
    youPlaced=s.yp; 
    cpuPlaced=s.cpP; 
    turnPlaced=s.tp; 
    firstMove=s.fm; 
    movesLog=s.ml.slice(); 
    cpuSultanCaptured=s.cW; 
    youSultanCaptured=s.yW; 
    selected=null; 
    chaining=null; 
    over=false; 
    busy=false; 
    lastFrom=-1; 
    lastTo=-1; 
    updateLog(); 
  }

  function build(){ 
    boardEl.innerHTML=''; 
    cellEls=[];
    for(var i=0;i<49;i++){ 
      var p=cc(i); 
      var d=document.createElement('div');
      d.className='cell '+(((p[0]+p[1])%2)?'dk':'lt')+((p[0]===3&&p[1]===3)?' mid':'');
      d.setAttribute('data-i',i); 
      d.addEventListener('click',onClick); 
      boardEl.appendChild(d); 
      cellEls.push(d); 
    } 
  }

  function render(captured,moveTo){ 
    captured=captured||[];
    for(var i=0;i<cellEls.length;i++){ 
      var el=cellEls[i], want=cells[i], pc=el.querySelector('.pc');
      if(want){
        if(!pc){
          pc = createPieceElement(want, i===moveTo);
          el.appendChild(pc);
        } else if(pc.dataset.v !== want){
          el.removeChild(pc);
          var np = createPieceElement(want, i===moveTo);
          el.appendChild(np);
        }
      }
      else if(pc){ 
        if(captured.indexOf(i)>=0){ 
          pc.classList.add('gone'); 
          (function(p,e){
            setTimeout(function(){
              if(p.parentNode===e) e.removeChild(p);
            },300);
          })(pc,el); 
        } else {
          el.removeChild(pc); 
        }
      }
      el.classList.remove('sel','legal','take','last'); 
      if(i===lastFrom||i===lastTo) el.classList.add('last'); 
    }
    
    var hi=chaining!=null?chaining:selected;
    if(hi!=null){ 
      cellEls[hi].classList.add('sel'); 
      var tg=chaining!=null?chainTargets(cells,chaining):moveTargets(cells,selected);
      for(var t=0;t<tg.length;t++){ 
        cellEls[tg[t]].classList.add('legal'); 
        var c2=clone(cells); 
        if(applyStep(c2,hi,tg[t]).length) cellEls[tg[t]].classList.add('take'); 
      } 
    }
    
    var uBox = $('userCapturedBox'), cBox = $('cpuCapturedBox');
    if(uBox){ 
      uBox.innerHTML = ''; 
      for(var j=0; j<youCap; j++){ 
        var s=document.createElement('span'); 
        s.className='cap-stone dark'; 
        uBox.appendChild(s); 
      } 
    }
    if(cBox){ 
      cBox.innerHTML = ''; 
      for(var j=0; j<cpuCap; j++){ 
        var s=document.createElement('span'); 
        s.className='cap-stone light'; 
        cBox.appendChild(s); 
      } 
    }

    var myTurn = (phase==='play')&&!over&&!busy&&selected==null&&chaining==null&&(mode==='pvp'||turn==='you');
    for(var m=0;m<cells.length;m++){ 
      var p2=cellEls[m].querySelector('.pc'); 
      if(p2){ 
        p2.classList.toggle('can', myTurn&&side(cells[m])===turn&&moveTargets(cells,m).length>0); 
      } 
    }
    hud(); 
  }

  function hud(){ 
    $('youCap').textContent=youCap; 
    $('cpuCap').textContent=cpuCap; 
    if(over)return;
    
    var hintEl = document.querySelector('.hint');
    var afButton = $('autoFill');
    if(afButton) afButton.style.display = (phase === 'placement' && !over && !busy) ? '' : 'none';
    
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
      if(hintEl) hintEl.innerHTML="<b>Placement Phase:</b> Alternate placing 2 soldiers. The first piece you place will be your <b>Sultan 👑</b> (capture = instant defeat!). The rest are standard soldiers. Center Citadel remains empty.";
    }else{
      $('status').textContent = mode==='pvp' ? (turn==='you'?'Light to move':'Dark to move') : (busy?'Enemy is thinking…':'Your move');
      if(hintEl){
        if(firstMove) hintEl.innerHTML="<b>First Move:</b> Light (You) must move a soldier adjacent to the Citadel into the Citadel to open the board.";
        else hintEl.innerHTML="Glowing soldiers can move. Tap one, then tap a highlighted square. Trap an enemy between two of yours to capture (custodial capture). Promote to <b>Mullah 👑</b> at 7 captures. The <b>Sultan 👑</b> slides orthogonally from the start. Capture the enemy Sultan to win instantly!";
      }
    }
  }

  function pop(txt,big){ 
    var el=$('boardPop'); 
    if(!el)return; 
    el.textContent=txt; 
    el.className='board-pop'+(big?' big':''); 
    void el.offsetWidth; 
    el.classList.add('show'); 
  }

  // ---------- MOVES STEP LOGIC ----------
  var COMBO=['','','DOUBLE!','TRIPLE!','ONSLAUGHT!','ANNIHILATION!'];
  function step(from,to){
    var originalCells = clone(cells);
    var caps=applyStep(cells,from,to);
    if(turn==='you')youCap+=caps.length; else cpuCap+=caps.length;
    if(firstMove)firstMove=false;
    
    for(var g=0; g<caps.length; g++){
      var capturedPiece = originalCells[caps[g]];
      if(capturedPiece === 'cpuW') cpuSultanCaptured = true;
      if(capturedPiece === 'youW') youSultanCaptured = true;
    }

    var sideName = turn==='you' ? 'You' : (mode==='pvp'?'Player 2':'CPU');
    var capStr = caps.length ? ' (captured '+caps.length+')' : '';
    addLog(sideName + ': ' + coord(from) + ' ➔ ' + coord(to) + capStr);
    
    if(caps.length){ 
      turnCaps+=caps.length; 
      if(turnCaps>=2) pop(COMBO[Math.min(turnCaps,5)]); 
    }
    lastFrom=from; 
    lastTo=to; 
    beep(caps.length?'cap':'move'); 
    render(caps,to);
    
    if(cpuSultanCaptured) { win('You captured the enemy Sultan! 🏆'); return caps; }
    if(youSultanCaptured) { win(mode==='pvp'?'Player 2 captured your Sultan! 🏆':'Enemy captured your Sultan.'); return caps; }
    
    return caps; 
  }

  function maybePromote(){ 
    if(turn==='you'&&!centYou&&youCap>=7&&cells[lastTo]&&side(cells[lastTo])==='you'&&!isWarlord(cells[lastTo])){ 
      cells[lastTo]='youC'; 
      centYou=true; 
      pop('MULLAH! 👑',true); 
      beep('win'); 
      addLog('👑 You promoted a Mullah at '+coord(lastTo)+'!'); 
    }
    if(turn==='cpu'&&!centCpu&&cpuCap>=7&&cells[lastTo]&&side(cells[lastTo])==='cpu'&&!isWarlord(cells[lastTo])){ 
      cells[lastTo]='cpuC'; 
      centCpu=true; 
      pop('ENEMY MULLAH! 👑',true); 
      addLog('👑 CPU promoted a Mullah at '+coord(lastTo)+'!'); 
    }
  }

  function humanStep(from,to){ 
    var caps=step(from,to); 
    var cont=caps.length&&!cpuSultanCaptured&&!youSultanCaptured?chainTargets(cells,to):[];
    if(cont.length){ 
      chaining=to; 
      selected=to; 
      render(caps,to); 
      $('status').textContent='Keep capturing! ⚔️'; 
    } else { 
      chaining=null; 
      selected=null; 
      if(!cpuSultanCaptured&&!youSultanCaptured) maybePromote(); 
      render(); 
      if(!cpuSultanCaptured&&!youSultanCaptured) endTurn(); 
    } 
  }

  function endTurn(){ 
    var o=opp(turn);
    if(pieces(cells,'cpu')<=1)return win('You win! 🏆');
    if(pieces(cells,'you')<=1)return win(mode==='pvp'?'Dark wins! 🏆':'Enemy wins.');
    
    var legalTurns = genTurns(cells, o);
    if(legalTurns.length===0) {
      return win(o==='cpu'?'Enemy is blocked — You win! 🏆':(mode==='pvp'?'Light is blocked — Dark wins!':'You are blocked — Enemy wins.'));
    }
    
    turn=o; 
    turnCaps=0; 
    snap(); 
    render();
    if(mode==='cpu'&&turn==='cpu'){ 
      busy=true; 
      hud(); 
      setTimeout(aiTurn,420); 
    } 
  }

  function aiTurn(){ 
    var t=aiPick(cells,'cpu',diff===1?1:diff===2?2:3); 
    if(!t){ 
      win('Enemy is blocked — You win! 🏆'); 
      return; 
    }
    turnCaps=0; 
    var s=0; 
    (function next(){
      if(cpuSultanCaptured||youSultanCaptured) return;
      if(s>=t.steps.length){ 
        maybePromote(); 
        busy=false; 
        turn='you'; 
        turnCaps=0; 
        selected=null; 
        chaining=null;
        if(pieces(cells,'you')<=1)return win('Enemy wins.'); 
        if(genTurns(cells,'you').length===0)return win('You are blocked — Enemy wins.'); 
        snap(); 
        render(); 
        return; 
      }
      var st=t.steps[s++]; 
      turn='cpu'; 
      step(st[0],st[1]); 
      setTimeout(next,420); 
    })(); 
  }

  function win(msg){ 
    over=true; 
    selected=null; 
    chaining=null; 
    render(); 
    $('status').textContent=msg; 
    var m=$('modal'); 
    if(m){ 
      $('modalMsg').textContent=msg; 
      m.classList.add('show'); 
    } 
    beep('win'); 
    addLog('Game Over: ' + msg); 
  }

  function aiPlace(){
    var pType1 = getPieceValue('cpu', cpuPlaced);
    var isSultan1 = pType1 === 'cpuW';
    var slots1 = getCpuPlacementSlots(isSultan1);
    var cell1 = slots1[Math.floor(Math.random() * slots1.length)];
    cells[cell1] = pType1;
    cpuPlaced++;
    
    var pType2 = getPieceValue('cpu', cpuPlaced);
    var isSultan2 = pType2 === 'cpuW';
    var slots2 = getCpuPlacementSlots(isSultan2);
    slots2 = slots2.filter(function(x) { return x !== cell1; });
    if(slots2.length === 0) {
      for(var i=0; i<49; i++) { if(i!==24 && i!==cell1 && !cells[i]) slots2.push(i); }
    }
    var cell2 = slots2[Math.floor(Math.random() * slots2.length)];
    cells[cell2] = pType2;
    cpuPlaced++;
    
    beep('move'); 
    var name1 = pType1 === 'cpuW' ? 'Sultan' : 'Soldier';
    var name2 = pType2 === 'cpuW' ? 'Sultan' : 'Soldier';
    addLog('CPU placed '+name1+' at '+coord(cell1)+' & '+name2+' at '+coord(cell2));
    render();
    
    turnPlaced=0;
    if(youPlaced+cpuPlaced===48){
      phase='play'; turn='you'; firstMove=true; pop('PLAY PHASE! ⚔️',true);
    } else {
      turn='you';
    }
    busy=false; snap(); render();
  }

  function autoFillBoard() {
    if (phase !== 'placement') return;
    cells = new Array(49).fill(null);
    var youSlots = [];
    var cpuSlots = [];
    for(var r=0; r<7; r++) {
      for(var c=0; c<7; c++) {
        var i = r*7 + c;
        if(i === 24) continue;
        if(r < 3 || (r === 3 && c < 3)) { cpuSlots.push(i); }
        else { youSlots.push(i); }
      }
    }
    var youSultanIndex = 42 + Math.floor(Math.random() * 7);
    var cpuSultanIndex = Math.floor(Math.random() * 7);
    
    cells[youSultanIndex] = 'youW';
    cells[cpuSultanIndex] = 'cpuW';
    
    youSlots = youSlots.filter(function(x) { return x !== youSultanIndex; });
    cpuSlots = cpuSlots.filter(function(x) { return x !== cpuSultanIndex; });
    
    for(var s=0; s<youSlots.length; s++) { cells[youSlots[s]] = 'you'; }
    for(var s=0; s<cpuSlots.length; s++) { cells[cpuSlots[s]] = 'cpu'; }
    
    youPlaced = 24;
    cpuPlaced = 24;
    turnPlaced = 0;
    phase = 'play';
    turn = 'you';
    firstMove = true;
    
    addLog('⚡ Auto-Fill complete: smart battle lines drawn!');
    pop('PLAY PHASE! ⚔️', true);
    snap();
    render();
  }

  function onClick(e){ 
    if(over||busy)return; 
    var i=parseInt(e.currentTarget.getAttribute('data-i'),10);
    if(mode==='cpu'&&turn!=='you')return;
    
    if(phase==='placement'){
      if(i===24||cells[i])return;
      var pType = turn==='you' ? getPieceValue('you', youPlaced) : getPieceValue('cpu', cpuPlaced);
      cells[i]=pType; 
      turnPlaced++;
      if(turn==='you')youPlaced++; else cpuPlaced++;
      var sideName = turn==='you' ? 'You' : (mode==='pvp'?'Player 2':'CPU');
      var nameString = pType === 'youW' || pType === 'cpuW' ? 'Sultan' : 'Soldier';
      addLog(sideName + ' placed ' + nameString + ' at ' + coord(i));
      beep('move'); 
      render();
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
    
    if(chaining!=null){ 
      if(chainTargets(cells,chaining).indexOf(i)>=0) humanStep(chaining,i); 
      return; 
    }
    if(selected==null){ 
      if(side(cells[i])===turn&&moveTargets(cells,i).length){ 
        selected=i; 
        render(); 
      } 
      return; 
    }
    if(moveTargets(cells,selected).indexOf(i)>=0){ 
      humanStep(selected,i); 
      return; 
    }
    if(side(cells[i])===turn&&moveTargets(cells,i).length){ 
      selected=i; 
      render(); 
      return; 
    }
    selected=null; 
    render(); 
  }

  function newGame(){ setup(); snap(); render(); var m=$('modal'); if(m)m.classList.remove('show'); }
  
  function undo(){ 
    if(busy)return; 
    var n=mode==='cpu'?2:1; 
    if(history.length<=n){ 
      newGame(); 
      return; 
    }
    history.splice(-n); 
    restore(history[history.length-1]); 
    render(); 
    var m=$('modal'); 
    if(m)m.classList.remove('show'); 
  }

  // ---------- LOGGING AND AUDIO ----------
  function addLog(txt){ movesLog.push(txt); updateLog(); }
  
  function updateLog(){ 
    var logEl = $('moveLog'); 
    if(!logEl) return;
    if(movesLog.length === 0){ 
      logEl.innerHTML = '<div class="empty-log">Drop 2 soldiers to begin the placement phase.</div>'; 
      return; 
    }
    logEl.innerHTML = ''; 
    for(var i=0; i<movesLog.length; i++){ 
      var d = document.createElement('div');
      d.className = 'log-item'; 
      d.textContent = movesLog[i]; 
      logEl.appendChild(d); 
    }
    logEl.scrollTop = logEl.scrollHeight; 
  }

  var ac; 
  function beep(type){ 
    try{ 
      if(!ac)ac=new (window.AudioContext||window.webkitAudioContext)();
      var seq=type==='win'?[523,659,784]:type==='cap'?[210]:[440];
      seq.forEach(function(f,n){ 
        var o=ac.createOscillator(),g=ac.createGain(); 
        o.type=type==='cap'?'triangle':'sine'; 
        o.frequency.value=f;
        var t0=ac.currentTime+n*0.09; 
        g.gain.setValueAtTime(0.0001,t0); 
        g.gain.exponentialRampToValueAtTime(0.12,t0+0.01); 
        g.gain.exponentialRampToValueAtTime(0.0001,t0+0.16);
        o.connect(g); 
        g.connect(ac.destination); 
        o.start(t0); 
        o.stop(t0+0.18); 
      }); 
    }catch(e){} 
  }

  build(); 
  newGame();
  
  $('newGame').addEventListener('click',newGame);
  var ub=$('undo'); if(ub)ub.addEventListener('click',undo);
  var rb=$('rematch'); if(rb)rb.addEventListener('click',newGame);
  var afb=$('autoFill'); if(afb)afb.addEventListener('click',autoFillBoard);
  
  $('modeSeg').addEventListener('click',function(e){ 
    var b=e.target.closest('button'); 
    if(!b)return; 
    var ch=e.currentTarget.children; 
    for(var i=0;i<ch.length;i++)ch[i].classList.remove('active'); 
    b.classList.add('active'); 
    mode=b.getAttribute('data-m'); 
    var dw=$('diffWrap'); 
    if(dw)dw.style.display=mode==='cpu'?'':'none'; 
    newGame(); 
  });
  
  var playModeSeg = $('playModeSeg');
  if (playModeSeg) {
    playModeSeg.addEventListener('click', function(e) {
      var b=e.target.closest('button');
      if(!b)return;
      var ch=e.currentTarget.children;
      for(var i=0;i<ch.length;i++)ch[i].classList.remove('active');
      b.classList.add('active');
      playMode=b.getAttribute('data-pm');
      newGame();
    });
  }

  var ds=$('diffSeg'); 
  if(ds)ds.addEventListener('click',function(e){ 
    var b=e.target.closest('button'); 
    if(!b)return; 
    var ch=e.currentTarget.children; 
    for(var i=0;i<ch.length;i++)ch[i].classList.remove('active'); 
    b.classList.add('active'); 
    diff=parseInt(b.getAttribute('data-d'),10); 
    newGame(); 
  });

  // learn diagrams
  function dc(o){
    o=o||{};
    var c=document.createElement('div');
    c.className='dcell'+(o.hl?' hl':'');
    if(o.dot){
      var d=document.createElement('div');
      d.className='dot '+o.dot;
      c.appendChild(d);
    } 
    if(o.x){
      var x=document.createElement('span');
      x.className='x';
      x.textContent='✕';
      c.appendChild(x);
    } 
    if(o.crown){
      var k=document.createElement('span');
      k.className='crown';
      k.textContent='👑';
      c.appendChild(k);
    } 
    return c;
  }
  function arr(){
    var a=document.createElement('span');
    a.className='arrow';
    a.textContent='→';
    return a;
  }
  function fill(s,n){
    var b=document.querySelector(s);
    if(b) {
      b.innerHTML = '';
      n.forEach(function(x){
        b.appendChild(x);
      });
    }
  }
  
  fill('.d-move',[dc({dot:'t'}),arr(),dc({hl:true})]); 
  fill('.d-cap',[dc({dot:'t'}),dc({dot:'e',x:true}),dc({dot:'t'})]);
  fill('.d-combo',[dc({dot:'t'}),dc({dot:'e',x:true}),dc({dot:'e',x:true}),dc({dot:'t'})]); 
  fill('.d-crown',[dc({dot:'g',crown:true})]);
})();
