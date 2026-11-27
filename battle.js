'use strict';
/* Card battles (Top Trumps style). He picks 3 of his Pokémon, then each round chooses the stat
   to battle with. Type advantage and rare cards give boosts. Beat four rivals to become Champion.
   Motion: both cards arrive on arcs (LIFT spring), the rival's card spins and swaps its face only
   at the edge-on moment, the winner pops (SNAP) and the loser drops away (Exit). No fades. */

const BKEY='pokedex.battle.v1';
let BT={beaten:[],wins:0,day:'',xpToday:0,xp:0,champ:false};
try{BT={...BT,...JSON.parse(localStorage.getItem(BKEY)||'{}')}}catch(e){}
function saveBT(){try{localStorage.setItem(BKEY,JSON.stringify(BT))}catch(e){}}
const BATTLE_XP=30,BATTLE_CAP=90,CHAMP_XP=500;
if(typeof packXP==='function'){const _p=packXP;packXP=function(){return _p()+(BT.xp||0)+(BT.champ?CHAMP_XP:0)}}

/* simplified type chart: attacker strong against these */
const STRONG={fire:['grass','ice','bug','steel'],water:['fire','ground','rock'],grass:['water','ground','rock'],electric:['water','flying'],
  ice:['grass','ground','flying','dragon'],fighting:['normal','ice','rock','dark','steel'],poison:['grass','fairy'],ground:['fire','electric','poison','rock','steel'],
  flying:['grass','fighting','bug'],psychic:['fighting','poison'],bug:['grass','psychic','dark'],rock:['fire','ice','flying','bug'],ghost:['psychic','ghost'],
  dragon:['dragon'],dark:['psychic','ghost'],steel:['ice','rock','fairy'],fairy:['fighting','dragon','dark'],normal:[]};
const beats=(a,b)=>a.types.some(t=>(STRONG[t]||[]).some(x=>b.types.includes(x)));
const STATS=[['hp','HP',p=>p.hp,''],['atk','Attack',p=>p.atk,''],['ht','Height',p=>p.ht,' m'],['wt','Weight',p=>p.wt,' kg']];

const RIVALS=[
  {id:'youngster',name:'Youngster Joey',pic:19,lv:'Easy',col:'#4fd16b',pick:p=>p.hp+p.atk<120&&!p.leg&&!p.myth},
  {id:'ace',name:'Ace Trainer Rita',pic:36,lv:'Medium',col:'#3fa8ff',pick:p=>p.hp+p.atk>=120&&p.hp+p.atk<170&&!p.leg&&!p.myth},
  {id:'gym',name:'Gym Leader Bruno',pic:68,lv:'Hard',col:'#ff7a3d',pick:p=>p.hp+p.atk>=165&&!p.leg&&!p.myth},
  {id:'champ',name:'Champion Lance',pic:149,lv:'Champion',col:'#FFE27A',pick:p=>p.leg||p.hp+p.atk>=200}];
const unlocked=i=>i===0||BT.beaten.includes(RIVALS[i-1].id);

/* ---------- ladder ---------- */
function openBattles(){openSheet('Card battles',body=>{const mine=DEX.filter(p=>has(p.no));
  body.innerHTML=`<p class="sub">Pick 3 of your Pokémon, then choose which stat to battle with each round. Win 2 rounds to win.</p>
   ${mine.length<3?`<p class="hint">Catch at least 3 Pokémon to start battling. You have ${mine.length}.</p>`:''}
   <div class="rivals">${RIVALS.map((r,i)=>{const ok=unlocked(i)&&mine.length>=3,won=BT.beaten.includes(r.id);
     return `<button class="rival ${won?'won':''}" data-rival="${i}" ${ok?'':'disabled'} style="--rc:${r.col}"><img src="${ART(r.pic)}" alt=""><div class="tx"><div class="t1">${r.name}</div><div class="t2">${r.lv}${won?' · beaten ✓':''}</div></div><span class="tro ${won?'gold':'none'}">${ok?(won?'Rematch':'Battle!'):'🔒'}</span></button>`}).join('')}</div>
   <div class="sec">How to win</div><div class="rules">
     <div><span>Type advantage (like Water against Fire)</span><b>Much stronger</b></div><div><span>Your rare card</span><b>A bit stronger</b></div><div><span>Your ultra rare card</span><b>Stronger</b></div>
     <div><span>Win a battle</span><b>+${BATTLE_XP} XP</b></div><div><span>Beat the Champion</span><b>+${CHAMP_XP} XP</b></div></div>
   <p class="hint">Battle XP is up to ${BATTLE_CAP} a day. ${BT.wins} battles won so far.</p>`;
  body.addEventListener('click',e=>{const b=e.target.closest('[data-rival]');if(b&&!b.disabled)pickTeam(+b.dataset.rival)})})}

/* ---------- pick a team ---------- */
function boost(no){const o=topCard(no);return o?.tier==='u'?1.25:o?.tier==='r'?1.1:1}
function pickTeam(ri){const team=[];openSheet('Pick your team',body=>{const mine=DEX.filter(p=>has(p.no)).sort((a,b)=>(b.hp+b.atk)*boost(b.no)-(a.hp+a.atk)*boost(a.no));
  const draw=()=>{body.innerHTML=`<p class="sub">Choose 3 Pokémon to battle ${RIVALS[ri].name}. Strongest are first.</p>
    <div class="team-slots">${[0,1,2].map(i=>team[i]?`<div class="slot-on"><img src="${ART(team[i])}" alt=""><span>${esc(byNo(team[i]).name)}</span></div>`:'<div class="slot-off">?</div>').join('')}</div>
    <div class="cgrid">${mine.map(p=>{const o=topCard(p.no),on=team.includes(p.no);return `<button class="cthumb pickme ${on?'on':''} ${o?.tier==='u'?'foil':''}" data-pk="${p.no}">${o?.img||o?.photo?`<img src="${o.photo||esc(o.img)}" alt="">`:`<img class="partart" src="${ART(p.no)}" alt="">`}<span>${esc(p.name)} · ${p.hp} HP</span></button>`}).join('')}</div>
    <button class="cta go-battle" ${team.length===3?'':'disabled'}>${team.length===3?'Battle!':`Pick ${3-team.length} more`}</button>`};
  draw();body.addEventListener('click',e=>{const b=e.target.closest('[data-pk]');if(b){const n=+b.dataset.pk,i=team.indexOf(n);if(i>=0)team.splice(i,1);else if(team.length<3)team.push(n);sfx?.('tap');draw();return}
    if(e.target.closest('.go-battle')&&team.length===3)startBattle(ri,[...team])})})}

/* ---------- the battle ---------- */
let B=null;
function rivalTeam(r){const pool=DEX.filter(r.pick);return shuffle([...pool]).slice(0,3).map(p=>p.no)}
function startBattle(ri,team){const r=RIVALS[ri];B={ri,r,team,foe:rivalTeam(r),round:0,me:0,them:0,busy:false};
  openSheet('vs '+r.name,body=>{body.innerHTML=`<div class="bt-score"><span>You <b id="btMe">0</b></span><span class="bt-r">Round <b id="btRound">1</b> of 3</span><span><b id="btThem">0</b> ${esc(r.name.split(' ').pop())}</span></div>
    <div class="arena" id="arena"><div class="bcard me" id="bMe"></div><div class="vs">VS</div><div class="bcard foe" id="bFoe"></div></div>
    <div class="mask"><span class="bt-say" id="btSay">Pick a stat to battle with!</span></div>
    <div class="bt-stats" id="btStats"></div><div id="btAfter"></div>`;
    nextRound(body)})}
function cardFace(p,mine){const c=tc(p.types[0]),o=mine?topCard(p.no):null,b=mine?boost(p.no):1;
  return `<div class="bc-in" style="--c:${c[0]};--d:${c[1]}"><div class="fx fx-${c[2]}"></div>${b>1?`<span class="bc-boost">${b===1.25?'ULTRA POWER UP':'RARE POWER UP'}</span>`:''}
   <img src="${ART(p.no)}" alt=""><b>${esc(p.name)}</b><span class="bc-types">${p.types.map(t=>tc(t)[3]).join(' · ')}</span></div>`}
async function nextRound(body){const me=byNo(B.team[B.round]),foe=byNo(B.foe[B.round]),bm=body.querySelector('#bMe'),bf=body.querySelector('#bFoe');
  body.querySelector('#btRound').textContent=B.round+1;body.querySelector('#btAfter').innerHTML='';body.querySelector('#btSay').textContent=`${me.name} is ready! Pick a stat.`;
  bm.innerHTML=cardFace(me,true);bf.innerHTML='<div class="bc-back"><span class="bb-mini"></span></div>';bm.className='bcard me';bf.className='bcard foe';
  // both cards arrive on arcs from opposite sides
  await play(560,t=>{const s=t/1000,p=springX(s,SP.lift.T,SP.lift.b),k=1-clamp01(p);bm.style.transform=`translate(${-160*k}px,${60*k-40*Math.sin(Math.PI*clamp01(p))*k}px) rotate(${-12*k}deg)`;bf.style.transform=`translate(${160*k}px,${60*k-40*Math.sin(Math.PI*clamp01(p))*k}px) rotate(${12*k}deg)`});
  const adv=beats(me,foe);
  body.querySelector('#btStats').innerHTML=STATS.map(([k,l,f,u])=>`<button class="bstat" data-st="${k}"><span>${l}</span><b>${(Math.round(f(me)*10)/10)}${u}</b></button>`).join('')+(adv?`<p class="hint bt-adv">⚡ ${tc(me.types[0])[3]} has the advantage here!</p>`:'');
  body.querySelector('#btStats').onclick=e=>{const b=e.target.closest('[data-st]');if(b&&!B.busy)resolve(body,b.dataset.st)}}
async function resolve(body,st){B.busy=true;const me=byNo(B.team[B.round]),foe=byNo(B.foe[B.round]),S=STATS.find(s=>s[0]===st),bm=body.querySelector('#bMe'),bf=body.querySelector('#bFoe');
  body.querySelectorAll('.bstat').forEach(b=>{b.disabled=true;b.classList.toggle('on',b.dataset.st===st)});sfx?.('flip');
  // rival card spins; its face swaps at the edge-on moment
  let swapped=false;await play(520,t=>{const e=HAND(t/520),a=180*e;if(!swapped&&a>=90){swapped=true;bf.innerHTML=cardFace(foe,false)}bf.style.transform=`rotateY(${a>=90?a-180:a}deg)`});bf.style.transform='';
  const mAdv=beats(me,foe),fAdv=beats(foe,me);
  const mv=S[2](me)*boost(me.no)*(mAdv?1.5:1),fv=S[2](foe)*(fAdv?1.5:1);
  const r1=v=>Math.round(v*10)/10;
  const winMe=mv>fv,draw=Math.abs(mv-fv)<.05;
  body.querySelector('#btSay').innerHTML=`${S[1]}: <b>${r1(mv)}${S[3]}</b> vs <b>${r1(fv)}${S[3]}</b>${mAdv?' · super effective!':''}${fAdv&&!mAdv?' · they had the advantage':''}`;
  await wait(380);
  if(draw){sfx?.('tap');B.round++;body.querySelector('#btSay').insertAdjacentHTML('beforeend','<br>It\'s a draw!')}
  else{const W=winMe?bm:bf,L=winMe?bf:bm;W.classList.add('win');L.classList.add('lose');if(winMe){B.me++;sfx?.('catch');buzz?.([20,30,20])}else{B.them++;sfx?.('flip');buzz?.(60)}B.round++}
  body.querySelector('#btMe').textContent=B.me;body.querySelector('#btThem').textContent=B.them;
  const over=B.me===2||B.them===2||B.round>=3;
  body.querySelector('#btAfter').innerHTML=`<button class="cta">${over?'See who won':'Next round'}</button>`;
  body.querySelector('#btAfter .cta').onclick=()=>{B.busy=false;if(over)endBattle(body);else{if(B.round>=3)endBattle(body);else nextRound(body)}}}
function endBattle(body){const won=B.me>B.them,r=B.r,lb=Math.floor(xpOf(albums())/LV)+1;let gained=0,champNow=false;
  if(won){BT.wins++;if(!BT.beaten.includes(r.id))BT.beaten.push(r.id);if(BT.day!==new Date().toISOString().slice(0,10)){BT.day=new Date().toISOString().slice(0,10);BT.xpToday=0}
    if(BT.xpToday<BATTLE_CAP){gained=Math.min(BATTLE_XP,BATTLE_CAP-BT.xpToday);BT.xpToday+=gained;BT.xp+=gained}
    if(r.id==='champ'&&!BT.champ){BT.champ=true;champNow=true}saveBT()}
  body.innerHTML=`<div class="qz-end"><div class="lv-badge" style="${won?'':'background:radial-gradient(circle at 35% 30%,#fff,#b9bcc6 45%,#6b7390)'}"><span>${won?'YOU WIN':'SO CLOSE'}</span><b>${B.me}–${B.them}</b></div>
   <div class="mask"><span class="pf-name">${won?(champNow?'You\'re the Champion!':'You beat '+esc(r.name)+'!'):esc(r.name)+' won this time'}</span></div>
   <div class="mask"><span class="muted">${won?(gained?`+${gained} XP`:'No more battle XP today, but great battling!')+(champNow?` · +${CHAMP_XP} XP Champion bonus`:'')+(B.ri<3&&!champNow?' · next rival unlocked!':''):'Try a different team, or pick another stat.'}</span></div>
   <button class="cta" id="btAgain">${won?'Battle again':'Try again'}</button><button class="ghost" id="btLadder">Back to rivals</button></div>`;riseIn(body);
  if(won)sfx?.('level');
  body.querySelector('#btAgain').onclick=()=>pickTeam(B.ri);body.querySelector('#btLadder').onclick=()=>openBattles();
  renderHome();const la=Math.floor(xpOf(albums())/LV)+1;
  if(champNow)celebQ.push({kind:'trophy',a:{name:'Pokémon Champion! +'+CHAMP_XP+' XP'},t:'gold'});
  if(champNow||la>lb)setTimeout(()=>celebrateAfter(lb,la),500)}

/* Trainer tab: add the battle card at the top of Play */
if(typeof renderTrainer==='function'){const _t=renderTrainer;renderTrainer=function(){_t();const g=$('#trainerBody .play-grid');if(g)g.insertAdjacentHTML('afterbegin',
  `<button class="pcard pc-battle" data-fn="openBattles"><b>Card battles</b><span>${BT.champ?'Champion! 🏆':`${BT.beaten.length} of 4 rivals beaten`}</span></button>`)}}
