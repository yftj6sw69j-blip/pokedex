'use strict';
/* Toolbar: five slots with the Pokéball dead centre. A glowing pill springs from tab to tab (SNAP spring),
   stretching along its path and settling with a small overshoot; under the Pokéball it tucks away.
   Each icon has its own move on arrival. Hold the Pokéball to jump straight to the camera.
   The bar tucks down while scrolling down and returns on scroll up. */
const PILL_W=46;
function tabCentre(i){const t=document.querySelector(`.tab[data-tab="${i}"]`),n=$('#tabs nav');if(!t||!n)return 0;const a=t.getBoundingClientRect(),b=n.getBoundingClientRect();return a.left-b.left+a.width/2}
let pillX=null,pillAnim=0;
function placePill(i,instant){const pill=$('#pill');if(!pill)return;const to=tabCentre(i),hide=i===2;
  if(pillX===null||instant||RM){pillX=to;pill.style.transform=`translateX(${to-PILL_W/2}px) scale(${hide?0:1},${hide?0:1})`;return}
  const from=pillX,id=++pillAnim,sp=SP.snap,wasHidden=Math.abs(from-tabCentre(2))<1;
  play(520,t=>{if(id!==pillAnim)return;const p=springX(t/1000,sp.T,sp.b),u=Math.min(1,t/300),x=lerp(from,to,p);
    const stretch=1+Math.min(.9,Math.abs(to-from)/120)*Math.sin(Math.PI*Math.min(1,u)); // longest mid-journey
    const s=hide?lerp(1,0,GLIDE(u)):wasHidden?lerp(0,1,GLIDE(u)):1;
    pill.style.transform=`translateX(${x-PILL_W/2}px) scale(${s*stretch},${s})`;pillX=x});
  pillX=to}
function iconMove(i){const t=document.querySelector(`.tab[data-tab="${i}"]`);if(!t)return;t.classList.remove('moved');void t.offsetWidth;t.classList.add('moved')}
function onTab(i,prev){$('#tabs').classList.remove('tucked');$('#tabs').style.setProperty('--glow',GLOWS[i]);placePill(i);iconMove(i);if(i===4)renderTrainer()}

/* Trainer tab: his card, rank progress, and doors into everything he owns */
function renderTrainer(){const A=albums(),xp=xpOf(A),lv=Math.floor(xp/LV)+1,nr=nextRank(lv),cards=Object.values(own).reduce((s,a)=>s+a.length,0);
  const all=[...A.gen,...A.type,...A.mini,...A.set],tro=all.filter(a=>tier(a.p)!=='none').length;
  const doors=[['openLevels','Levels and ranks',`Level ${lv} · ${rankOf(lv)}`,'lv'],['openTrophies','Trophy room',`${tro} trophies won`,'tr'],['openMyCards','All my cards',`${cards} cards`,'cd'],
    ['openPacks','My packs',`${packs.length} packs opened`,'pk'],['openSpares','Got spare',`${spares().length} to trade`,'sp'],['openWish','Wish list',`${Object.keys(wish).filter(n=>!has(+n)).length} wanted`,'wi'],['openProfile','Change my trainer card','Name, partner and favourite type','pf'],['toggleSound','Sounds',typeof soundOn!=='undefined'&&soundOn?'On · tap to turn off':'Off · tap to turn on','snd']];
  $('#trainerBody').innerHTML=`<div class="tcard" style="--tc:${prof.fav?tc(prof.fav)[0]:'#b07cff'}"><div class="tc-shine"></div>
    <div class="avatar big ${prof.partner?'has-art':''}">${partnerArt()}</div>
    <div class="mask"><span class="pf-name">${esc(prof.name||'Trainer')}</span></div><div class="mask"><span class="muted">${rankOf(lv)}${nr?` · ${nr[1]} at level ${nr[0]}`:''}</span></div>
    <div class="tc-stats"><div><b>${Object.keys(own).length}</b><span>Pokémon</span></div><div><b>${cards}</b><span>Cards</span></div><div><b>${tro}</b><span>Trophies</span></div><div><b>${lv}</b><span>Level</span></div></div></div>
   <div class="near doors">${doors.map(([fn,t1,t2,ic])=>`<button class="album door" data-fn="${fn}"><div class="ic dic dic-${ic}" aria-hidden="true"></div><div class="tx"><div class="t1">${t1}</div><div class="t2">${t2}</div></div><span class="chev" aria-hidden="true">›</span></button>`).join('')}</div>`}
document.addEventListener('click',e=>{const d=e.target.closest('[data-fn]');if(d&&typeof window[d.dataset.fn]==='function')window[d.dataset.fn]()});

/* hold the Pokéball for the camera */
(function(){const ball=document.querySelector('.tab.add');let timer=0,held=false;
  ball.addEventListener('pointerdown',()=>{held=false;ball.classList.add('charging');timer=setTimeout(async()=>{held=true;ball.classList.remove('charging');ball.classList.add('burst');navigator.vibrate?.(20);
    if(cur!==2)await go(2);setTimeout(()=>{ball.classList.remove('burst');if(!$('#scanBtn').hidden)openScanner()},cur===2?120:520)},450)});
  const cancel=()=>{clearTimeout(timer);ball.classList.remove('charging')};['pointerup','pointerleave','pointercancel'].forEach(ev=>ball.addEventListener(ev,cancel));
  ball.addEventListener('click',e=>{if(held){e.stopImmediatePropagation();held=false;return}ball.classList.remove('spin');void ball.offsetWidth;ball.classList.add('spin')},true);
  ball.addEventListener('contextmenu',e=>e.preventDefault())})();

/* tuck the bar away on scroll down, bring it back on scroll up */
(function(){let last=scrollY,acc=0;addEventListener('scroll',()=>{const y=scrollY,dy=y-last;last=y;acc=(Math.sign(dy)===Math.sign(acc)?acc:0)+dy;
  const bar=$('#tabs');if(y<40||acc<-24)bar.classList.remove('tucked');else if(acc>36)bar.classList.add('tucked')},{passive:true})})();

addEventListener('resize',()=>placePill(cur,true));
requestAnimationFrame(()=>placePill(cur,true));
document.fonts?.ready.then(()=>placePill(cur,true));

if(typeof closeSheet==='function'){const _cs=closeSheet;closeSheet=async function(a){const r=await _cs(a);$('#tabs').classList.remove('tucked');return r}}
