/* deck.js: the Today cards become a real card deck (swipe the top card away and it tucks in at
   the back), and this week's challenges get a trophy-board makeover.
   Motion (MeFit): the dragged card follows the finger 1:1, leaves on the exit curve, then glides
   in behind the stack; the card underneath lifts up as you drag. One object at a time, no fades. */

/* ================= challenges ================= */
const WK_IC={any:'🃏',new:'🆕',rare:'💎',gen:'🗺️',evo:'🧬',bingo:'🎯',quiz:'❓'};
const WK_COL={any:'#ff4656',new:'#3ddc84',rare:'#b084ff',gen:'#4aa8ff',evo:'#ff8a5c',bingo:'#ffcf3a',quiz:'#ff6bd6'};
function wkIcon(c){if(c.id==='type'){const k=Object.keys(T).find(k=>T[k][0]===c.col);return (typeof TYPE_IC!=='undefined'&&TYPE_IC[k])||'⭐'}return WK_IC[c.id]||'⭐'}
challengeHTML=function(compact){const S=challengeState(),d=daysLeft(),done=S.filter(c=>c.claimed).length,all=done===S.length;
  const rows=S.map(c=>{const st=c.claimed?'claimed':c.ready?'ready':'',p=c.claimed?1:Math.max(c.have/c.need,0);
    const pips=c.need<=5?`<span class="wk2-pips">${Array.from({length:c.need},(_,i)=>`<i class="${i<c.have?'on':''}"></i>`).join('')}</span>`:'';
    return `<div class="wk2-row ${st}" style="--c:${c.col||WK_COL[c.id]||'#ffb020'};--p:${p}">
      <span class="wk2-ring" aria-hidden="true"><span>${c.claimed?'✓':wkIcon(c)}</span></span>
      <span class="wk2-tx"><b>${esc(c.text)}</b><span class="wk2-sub">${pips}<em>${c.claimed?'Collected':c.ready?'Done! Collect your XP':c.have+' of '+c.need}</em></span></span>
      ${c.ready?`<button class="wk2-go" data-claim="${c.id}">Collect<b>+${CHALLENGE_XP}</b></button>`:c.claimed?`<span class="wk2-stamp">DONE</span>`:`<span class="wk2-coin">+${CHALLENGE_XP}<small>XP</small></span>`}</div>`}).join('');
  return `<div class="wk2 ${compact?'compact':''} ${all?'all':''}"><i class="wk2-sky" aria-hidden="true"></i><i class="wk2-sheen" aria-hidden="true"></i>
    <div class="wk2-top"><span class="wk2-medal" aria-hidden="true">🏅</span><span class="wk2-h"><b>This week's challenges</b><small>${all?'All done! New ones on Monday':done+' of '+S.length+' done'}</small></span>
      <span class="wk2-days"><b>${d}</b>day${d===1?'':'s'} left</span></div>
    <div class="wk2-meter" aria-hidden="true">${S.map(c=>`<i class="${c.claimed?'on':c.ready?'rd':''}"></i>`).join('')}</div>
    <div class="wk2-list">${rows}</div></div>`};

/* ================= the Today deck ================= */
(function(){const tr=$('#tdTrack');if(!tr)return;
  tr.classList.add('td-deck');tr.setAttribute('data-noswipe','');
  const hint=$('.today .td-hint');if(hint)hint.textContent='swipe for the next card';
  let order=[],H=0,lastW=0;const DEPTH=11;
  const live=()=>[...tr.querySelectorAll('.td-slide:not(.empty)')];
  const slot=i=>i===0?'none':`translateY(${Math.min(i,2)*DEPTH}px) scale(${1-Math.min(i,2)*.05})`;
  function syncOrder(){const L=live();order=order.filter(s=>L.includes(s));L.forEach(s=>{if(!order.includes(s))order.push(s)})}
  function measure(){if(!tr.offsetWidth)return;tr.classList.add('measuring');let h=0;order.forEach(s=>h=Math.max(h,s.scrollHeight));tr.classList.remove('measuring');
    if(!h)return;H=h;lastW=tr.offsetWidth;tr.style.setProperty('--dh',H+'px');tr.style.height=(H+(order.length>1?Math.min(order.length-1,2)*DEPTH+4:0))+'px'}
  function lay(skip){order.forEach((s,i)=>{if(s!==skip){s.style.zIndex=10-i;s.style.transform=slot(i)}s.classList.toggle('top',i===0);s.classList.toggle('back',i>0);
      i>0?s.setAttribute('inert',''):s.removeAttribute('inert')});tdDots()}
  window.tdDeckRefresh=function(){syncOrder();measure();lay()};
  new ResizeObserver(()=>{if(tr.offsetWidth&&tr.offsetWidth!==lastW)tdDeckRefresh()}).observe(tr);
  tr.addEventListener('load',()=>measure(),true);

  // send the top card to the back: out on the exit curve, then glide in behind
  function flingOut(sign,dx){const s=order[0],w=tr.offsetWidth;if(!s||order.length<2)return;
    order.push(order.shift());if(typeof sfx==='function')sfx('tap');
    if(RM){lay();return}
    tr.classList.remove('drag');s.style.zIndex=30;s.style.transition='transform 220ms var(--exit)';
    s.style.transform=`translateX(${sign*(w+40)}px) rotate(${sign*12}deg)`;lay(s);
    setTimeout(()=>{s.style.zIndex=0;s.style.transition='transform 520ms var(--glide)';s.style.transform=slot(order.length-1);
      setTimeout(()=>{s.style.transition='';lay()},540)},230)}
  window.tdDeckNext=dir=>flingOut(dir||-1);

  // drag the top card
  let D=null,eatClick=false;
  tr.addEventListener('pointerdown',e=>{const s=e.target.closest('.td-slide.top');if(!s||order.length<2||(e.pointerType==='mouse'&&e.button))return;
    D={s,id:e.pointerId,x0:e.clientX,y0:e.clientY,t0:performance.now(),dx:0,on:false,v:0,lt:performance.now(),lx:e.clientX}});
  tr.addEventListener('pointermove',e=>{if(!D||e.pointerId!==D.id)return;const dx=e.clientX-D.x0,dy=e.clientY-D.y0;
    if(!D.on){if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){D=null;return}if(Math.abs(dx)<8)return;
      D.on=true;try{D.s.setPointerCapture(e.pointerId)}catch(_){}tr.classList.add('drag')}
    const now=performance.now();D.v=(e.clientX-D.lx)/Math.max(1,now-D.lt);D.lx=e.clientX;D.lt=now;D.dx=dx;
    D.s.style.transform=`translateX(${dx}px) rotate(${dx/22}deg)`;
    const q=Math.min(1,Math.abs(dx)/140);order.slice(1,3).forEach((b,j)=>{const i=j+1,y=lerp(Math.min(i,2)*DEPTH,(i-1)*DEPTH,q),sc=lerp(1-i*.05,1-(i-1)*.05,q);b.style.transform=`translateY(${y}px) scale(${sc})`})});
  const end=e=>{if(!D||e.pointerId!==D.id)return;const d=D;D=null;if(!d.on)return;eatClick=true;setTimeout(()=>eatClick=false,0);
    if(Math.abs(d.dx)>80||(Math.abs(d.v)>.45&&Math.abs(d.dx)>24))flingOut(Math.sign(d.dx||d.v),d.dx);
    else{tr.classList.remove('drag');lay();if(typeof buzz==='function')buzz(6)}};
  tr.addEventListener('pointerup',end);tr.addEventListener('pointercancel',e=>{if(D&&D.on){D=null;tr.classList.remove('drag');lay()}else D=null});
  tr.addEventListener('click',e=>{if(eatClick){e.stopPropagation();e.preventDefault();eatClick=false}},true);
  tr.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();flingOut(e.key==='ArrowRight'?1:-1)}});

  // dots: show which card is on top; tapping one brings it to the front
  $('#tdDots').addEventListener('click',e=>{const b=e.target.closest('[data-di]');if(!b)return;e.stopImmediatePropagation();
    const want=live()[+b.dataset.di];if(!want||order[0]===want)return;
    if(order[1]===want){flingOut(-1);return}while(order[0]!==want)order.push(order.shift());lay()},true);
  tdDots=function(){const L=live(),k=L.indexOf(order[0]);document.querySelectorAll('#tdDots button').forEach((b,i)=>b.classList.toggle('on',i===k))};
  const _ts=tdSync;tdSync=function(){_ts();tdDeckRefresh()};
  tdSync()})();
