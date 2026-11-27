'use strict';
/* Play: Who's that Pokémon?, evolution families, trading by QR code, weekly challenges.
   Motion: same house rules. Reveals are mask wipes out of the silhouette's centre, badges
   arrive through the celebration overlay, nothing fades. */

const PKEY='pokedex.play.v1';
let PLAY={game:{day:'',xpToday:0,xp:0,best:0,week:{}},fams:[],claimed:{}};
try{const s=JSON.parse(localStorage.getItem(PKEY)||'{}');PLAY={...PLAY,...s,game:{...PLAY.game,...(s.game||{})}}}catch(e){}
function savePlay(){try{localStorage.setItem(PKEY,JSON.stringify(PLAY))}catch(e){}}
const rnd=n=>Math.floor(Math.random()*n);
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const today=()=>new Date().toISOString().slice(0,10);

/* ---------- weeks ---------- */
function weekStart(d=new Date()){const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x}
function weekId(d=new Date()){const s=weekStart(d);return s.toISOString().slice(0,10)}

/* ---------- XP from PLAY (added to the main XP through packXP) ---------- */
const FAMILY_XP=100,GAME_XP=10,GAME_CAP=50,CHALLENGE_XP=75;
if(typeof packXP==='function'){const _px=packXP;packXP=function(){return _px()+(PLAY.game.xp||0)+Object.values(PLAY.claimed).reduce((s,w)=>s+w.length*CHALLENGE_XP,0)+families().filter(f=>f.done).length*FAMILY_XP}}

/* =====================================================================
   1. Who's that Pokémon?
   ===================================================================== */
let quiz=null;
function quizPool(){const mine=DEX.filter(p=>has(p.no));return mine.length>=4?mine:DEX.filter(p=>p.gen===1)}
function openQuiz(){quiz={round:0,score:0,streak:0,of:10};openSheet('Who\'s that Pokémon?',body=>quizRound(body))}
function quizRound(body){const pool=quizPool(),ans=pool[rnd(pool.length)];
  const others=shuffle(DEX.filter(p=>p.no!==ans.no&&p.gen===ans.gen)).slice(0,3);const opts=shuffle([ans,...others]);quiz.ans=ans;quiz.locked=false;
  const c=tc(ans.types[0]);
  body.innerHTML=`<div class="qz-top"><span>Round <b>${quiz.round+1}</b> of ${quiz.of}</span><span>Score <b>${quiz.score}</b>${quiz.streak>1?` · 🔥 ${quiz.streak} in a row`:''}</span></div>
   <div class="qz-stage" style="--c:${c[0]};--d:${c[1]}"><div class="qz-rays"></div><img class="qz-sil" src="${ART(ans.no)}" alt="A mystery Pokémon"><img class="qz-real" src="${ART(ans.no)}" alt=""></div>
   <div class="mask"><span class="qz-q">${quiz.round===0?'Who\'s that Pokémon?':'Who\'s this one?'}</span></div>
   <div class="qz-opts">${opts.map(o=>`<button class="qz-opt" data-q="${o.no}">${esc(o.name)}</button>`).join('')}</div>
   <div class="qz-after" hidden></div>`;
  body.querySelector('.qz-opts').addEventListener('click',e=>{const b=e.target.closest('.qz-opt');if(b)quizAnswer(body,b)})}
async function quizAnswer(body,b){if(quiz.locked)return;quiz.locked=true;const ok=+b.dataset.q===quiz.ans.no,ans=quiz.ans;
  body.querySelectorAll('.qz-opt').forEach(x=>{x.disabled=true;if(+x.dataset.q===ans.no)x.classList.add('right')});
  if(!ok){b.classList.add('wrong');buzz?.(40)}
  // reveal: the colour picture opens out of the silhouette's centre
  const real=body.querySelector('.qz-real');real.style.clipPath='circle(0% at 50% 50%)';real.style.visibility='visible';void real.offsetWidth;
  real.style.transition='clip-path var(--sp-lift-ms) var(--sp-lift)';real.style.clipPath='circle(75% at 50% 50%)';
  let gained=0;
  if(ok){quiz.score++;quiz.streak++;const g=PLAY.game;if(g.day!==today()){g.day=today();g.xpToday=0}
    if(g.xpToday<GAME_CAP){gained=Math.min(GAME_XP,GAME_CAP-g.xpToday);g.xpToday+=gained;g.xp=(g.xp||0)+gained}
    const w=weekId();g.week[w]=(g.week[w]||0)+1;savePlay();sfx?.('catch');buzz?.([15,30,15])}
  else{quiz.streak=0;sfx?.('flip')}
  if(typeof soundOn!=='undefined'&&soundOn&&'speechSynthesis' in window){try{speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(`It's ${ans.name}!`))}catch(e){}}
  const after=body.querySelector('.qz-after');quiz.round++;const last=quiz.round>=quiz.of;
  after.innerHTML=`<div class="mask"><span class="qz-res ${ok?'ok':''}">${ok?'Yes!':'Nearly!'} It's ${esc(ans.name)}!</span></div>
    <div class="mask"><span class="muted">${ok?(gained?`+${gained} XP`:'Brilliant! (No more XP today, but keep playing)'):'You\'ll get the next one'}</span></div>
    <button class="cta qz-next">${last?'See my score':'Next Pokémon'}</button>`;
  after.hidden=false;riseIn(after);renderHome();
  after.querySelector('.qz-next').addEventListener('click',()=>{if(last)quizEnd(body);else{body.innerHTML='';quizRound(body);riseIn(body)}})}
function quizEnd(body){const best=PLAY.game.best||0;if(quiz.score>best){PLAY.game.best=quiz.score;savePlay()}
  const msg=quiz.score>=9?'Pokémon Professor!':quiz.score>=7?'Super Trainer!':quiz.score>=4?'Great job!':'Keep practising!';
  body.innerHTML=`<div class="qz-end"><div class="lv-badge"><span>SCORE</span><b>${quiz.score}</b></div><div class="mask"><span class="pf-name">${msg}</span></div>
   <div class="mask"><span class="muted">${quiz.score} out of ${quiz.of}${quiz.score>best?' · a new best!':` · best ${best}`}</span></div>
   <button class="cta qz-again">Play again</button></div>`;riseIn(body);
  if(quiz.score>=7)sfx?.('level');
  body.querySelector('.qz-again').addEventListener('click',()=>{quiz={round:0,score:0,streak:0,of:10};body.innerHTML='';quizRound(body);riseIn(body)})}

/* =====================================================================
   2. Evolution families
   ===================================================================== */
let FAMS=null;
function familyList(){if(FAMS)return FAMS;const root=n=>{let p=byNo(n);while(p.from)p=byNo(p.from);return p.no};const m={};
  DEX.forEach(p=>{const r=root(p.no);(m[r]=m[r]||[]).push(p.no)});
  FAMS=Object.entries(m).filter(([,a])=>a.length>1).map(([r,a])=>({root:+r,members:a.sort((x,y)=>x-y)}));return FAMS}
function families(){if(!DEX.length)return [];return familyList().map(f=>{const have=f.members.filter(has).length;return {...f,have,tot:f.members.length,done:have===f.members.length,started:have>0}})}
function famRow(f){const p=byNo(f.root),c=tc(p.types[0]);
  return `<button class="album fam ${f.done?'done':''}" data-fam="${f.root}" style="--p:${f.have/f.tot}"><div class="fam-chain">${f.members.slice(0,4).map(n=>`<img class="${has(n)?'':'sil'}" src="${ART(n)}" alt="" loading="lazy">`).join('<i>›</i>')}${f.members.length>4?`<span>+${f.members.length-4}</span>`:''}</div>
   <div class="tx"><div class="t1">${esc(p.name)} family</div><div class="t2">${f.have} of ${f.tot}${f.done?' · badge won!':''}</div><div class="bar" style="--c:${c[0]}"><i style="--p:${Math.max(f.have/f.tot,.015)}"></i></div></div>
   <span class="tro ${f.done?'gold':'none'}">${f.done?'Badge':'+'+FAMILY_XP+' XP'}</span></button>`}
function openFamilies(){openSheet('Evolution families',body=>{const F=families(),done=F.filter(f=>f.done),going=F.filter(f=>f.started&&!f.done).sort((a,b)=>(a.tot-a.have)-(b.tot-b.have));
  body.innerHTML=`<p class="sub">Collect every Pokémon in a family to win its badge and ${FAMILY_XP} XP.</p>
   <div class="fam-badges">${done.length?done.map(f=>`<button class="fbadge" data-fam="${f.root}"><img src="${ART(f.members[f.members.length-1])}" alt=""><span>${esc(byNo(f.root).name)}</span></button>`).join(''):'<p class="hint">No family badges yet. Your first one is waiting!</p>'}</div>
   <div class="sec">Nearly complete</div><div class="near">${going.map(famRow).join('')||'<p class="hint">Add a card to start a family.</p>'}</div>
   <div class="sec">All families (${F.length})</div><div class="near">${F.filter(f=>!f.started).slice(0,60).map(famRow).join('')}</div>`})}
function openFamily(root){const f=families().find(x=>x.root===root);if(!f)return;openSheet(byNo(root).name+' family',body=>{
  body.innerHTML=`<div class="fam-big">${f.members.map(n=>{const p=byNo(n);return `<button class="fam-mem ${has(n)?'got':''} ${has(n)?'opencard':''}" ${has(n)?`data-no="${n}"`:''}><img class="${has(n)?'':'sil'}" src="${ART(n)}" alt=""><span>${has(n)?esc(p.name):'???'}</span></button>`}).join('')}</div>
   <p class="hint" style="text-align:center">${f.done?'You\'ve got the whole family! Badge won.':`Find ${f.tot-f.have} more to win the ${esc(byNo(root).name)} family badge.`}</p>
   ${f.done?'':`<button class="ghost" id="famWish">☆ Put the missing ones on my wish list</button>`}`;
  body.querySelector('#famWish')?.addEventListener('click',e=>{f.members.filter(n=>!has(n)).forEach(n=>wish[n]=1);save();e.target.textContent='★ Added to your wish list';renderHome()})})}
document.addEventListener('click',e=>{const f=e.target.closest('[data-fam]');if(f)openFamily(+f.dataset.fam)});

/* family badge celebrations, alongside level-ups and trophies */
if(typeof celebrateAfter==='function'){const _c=celebrateAfter;celebrateAfter=function(lb,la){const now=families().filter(f=>f.done).map(f=>f.root),had=new Set(PLAY.fams||[]);
  now.filter(r=>!had.has(r)).forEach(r=>celebQ.push({kind:'trophy',a:{name:byNo(r).name+' family complete! +'+FAMILY_XP+' XP'},t:'gold'}));PLAY.fams=now;savePlay();_c(lb,la)}}

/* =====================================================================
   3. Trade with a friend (QR code)
   ===================================================================== */
function loadLib(src,name){return window[name]?Promise.resolve():new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
const ascii=s=>s.replace(/[\u0080-￿]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
function packCard(c,no){return 'PKDX1:'+ascii(JSON.stringify({i:c.id,n:c.name,o:no,u:c.number,s:c.set,d:c.setId,t:c.total,r:c.rarity,k:c.tier,g:c.img,a:c.also||[]}))}
function unpackCard(txt){if(!txt||!txt.startsWith('PKDX1:'))return null;try{const j=JSON.parse(txt.slice(6));if(!j.o||!byNo(j.o))return null;
  return {id:j.i+'~t'+Date.now(),name:j.n||byNo(j.o).name,no:j.o,also:j.a||[],number:j.u||'',set:j.s||'Traded card',setId:j.d||'',total:j.t||0,rarity:j.r||'',tier:['c','r','u'].includes(j.k)?j.k:'c',
    img:j.g||'',imgL:(j.g||'').replace(/\.png$/,'_hires.png'),date:new Date().toISOString(),traded:true}}catch(e){return null}}
function openTrade(){openSheet('Trade with a friend',body=>{
  body.innerHTML=`<p class="sub">Swap real cards with a friend who has this app too. Each of you gives a card and gets a card.</p>
   <div class="trade-big"><button class="tbig give" id="tGive"><b>Give a card</b><span>Show your friend a code to scan</span></button>
   <button class="tbig get" id="tGet"><b>Get a card</b><span>Scan your friend's code</span></button></div>
   <p class="hint">Only swap cards you're both happy with. A grown-up can help if you're not sure.</p>`;
  body.querySelector('#tGive').onclick=openGive;body.querySelector('#tGet').onclick=openGet})}
function openGive(){openSheet('Give a card',body=>{const sp=new Set(spares().map(c=>c.id)),L=allCards().sort((a,b)=>sp.has(b.id)-sp.has(a.id));
  body.innerHTML=L.length?`<p class="sub">Which card are you giving away? Spares are first.</p><div class="cgrid">${L.map(c=>`<button class="cthumb ${c.tier==='u'?'foil':''}" data-give="${c.no}:${esc(c.id)}">${c.img||c.photo?`<img src="${c.photo||esc(c.img)}" alt="">`:`<img class="partart" src="${ART(c.no)}" alt="">`}<span>${sp.has(c.id)?'⭐ Spare · ':''}${esc(c.name)}</span></button>`).join('')}</div>`:'<p class="hint">You need some cards before you can trade.</p>';
  body.addEventListener('click',e=>{const b=e.target.closest('[data-give]');if(!b)return;const [no,id]=b.dataset.give.split(/:(.*)/s);showGiveCode(+no,id)})})}
async function showGiveCode(no,id){const c=(own[no]||[]).find(x=>x.id===id);if(!c)return;
  try{await loadLib('vendor/qrcode.js?v=1','qrcode')}catch(e){toast('Couldn\'t load the code maker. Check the internet');return}
  openSheet('Give '+c.name,body=>{const q=qrcode(0,'M');q.addData(packCard(c,no));q.make();
    body.innerHTML=`<div class="qr-card"><div class="qr">${q.createSvgTag({cellSize:6,margin:2,scalable:true})}</div><div class="mask"><span class="pf-name">${esc(c.name)}</span></div><div class="mask"><span class="muted">${esc(c.set||'')}${c.number?' · '+esc(c.number):''}</span></div></div>
     <p class="sub" style="text-align:center">Your friend taps <b>Get a card</b> and scans this code. Then hand over the real card.</p>
     <button class="ghost danger" id="gaveIt">My friend has it now</button>`;
    body.querySelector('#gaveIt').addEventListener('click',e=>{const b=e.target;if(!b.classList.contains('sure')){b.classList.add('sure');b.textContent=`Tap again to take ${c.name} out of my Pokédex`;return}
      own[no]=(own[no]||[]).filter(x=>x.id!==id);(c.also||[]).forEach(n=>{own[n]=(own[n]||[]).filter(x=>x.id!==id);if(!own[n].length)delete own[n]});if(!own[no].length){delete own[no];delete fav[no]}
      save();renderHome();renderGrid();toast(`Traded away ${c.name}. Enjoy your new card!`);closeSheet(true)})})}
let tradeStream=null,tradeTimer=0;
async function openGet(){let ov=$('#qrScan');if(!ov){ov=document.createElement('div');ov.id='qrScan';ov.className='scanner';
    ov.innerHTML=`<video playsinline muted autoplay></video><div class="sc-frame"><div class="qr-box"></div></div><div class="sc-msg" id="qrMsg">Getting the camera ready…</div>
     <div class="sc-tip">Point at your friend's trade code.</div><button class="sc-close" aria-label="Close camera">×</button>`;document.body.appendChild(ov);
    ov.querySelector('.sc-close').addEventListener('click',closeGet)}
  ov.hidden=false;ov.style.transition='none';ov.style.clipPath='circle(0% at 50% 50%)';void ov.offsetWidth;ov.style.transition='clip-path var(--sp-lift-ms) var(--sp-lift)';ov.style.clipPath='circle(150% at 50% 50%)';
  const msg=$('#qrMsg');
  try{await loadLib('vendor/jsQR.js?v=1','jsQR')}catch(e){msg.textContent='Couldn\'t load the code reader. Check the internet.';return}
  try{tradeStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});const v=ov.querySelector('video');v.srcObject=tradeStream;await v.play()}
  catch(e){msg.textContent='The camera isn\'t available. Allow camera access in your settings.';return}
  msg.textContent='Looking for a trade code…';scanQR()}
function scanQR(){const ov=$('#qrScan');if(!ov||ov.hidden||!tradeStream)return;const v=ov.querySelector('video');
  if(v.videoWidth){const cv=scanQR.cv||(scanQR.cv=document.createElement('canvas')),k=Math.min(1,640/v.videoWidth);cv.width=v.videoWidth*k;cv.height=v.videoHeight*k;const g=cv.getContext('2d',{willReadFrequently:true});g.drawImage(v,0,0,cv.width,cv.height);
    const r=jsQR(g.getImageData(0,0,cv.width,cv.height).data,cv.width,cv.height);if(r&&r.data){const card=unpackCard(r.data);if(card){buzz?.(30);closeGet();showGot(card);return}$('#qrMsg').textContent='That isn\'t a Pokédex trade code'}}
  tradeTimer=setTimeout(scanQR,180)}
async function closeGet(){clearTimeout(tradeTimer);const ov=$('#qrScan');if(!ov||ov.hidden)return;if(tradeStream){tradeStream.getTracks().forEach(t=>t.stop());tradeStream=null}
  ov.style.transition='clip-path 240ms var(--exit)';ov.style.clipPath='circle(0% at 50% 50%)';await wait(240);ov.hidden=true}
function showGot(card){const p=byNo(card.no);openSheet('A card from your friend',body=>{
  body.innerHTML=`<div class="best"><div class="mask"><span class="tag">TRADE</span></div>${card.img?`<img src="${esc(card.imgL||card.img)}" alt="${esc(card.name)}">`:`<img class="partart" src="${ART(card.no)}" alt="">`}<div class="mask"><span class="pf-name">${esc(card.name)}</span></div><div class="mask"><span class="muted">${esc(card.set)}${card.number?' · '+esc(card.number):''}${has(card.no)?'':' · a new Pokémon!'}</span></div></div>
   <button class="cta" id="gotYes">Add it to my Pokédex</button><button class="ghost" id="gotNo">Not now</button>`;
  body.querySelector('#gotNo').onclick=()=>closeSheet(true);
  body.querySelector('#gotYes').onclick=()=>{const lb=Math.floor(xpOf(albums())/LV)+1;if(typeof snapTiers==='function')snapTiers();card.wasNew=!has(card.no);
    (own[card.no]=own[card.no]||[]).push(card);(card.also||[]).forEach(n=>{if(byNo(n))(own[n]=own[n]||[]).push({...card,no:n,also:[]})});delete wish[card.no];save();
    sfx?.('catch');renderHome();renderGrid();closeSheet(true);toast(`Traded! ${card.name} joined your Pokédex`);
    const la=Math.floor(xpOf(albums())/LV)+1;setTimeout(()=>celebrateAfter(lb,la),400)}})}

/* =====================================================================
   4. Weekly challenges
   ===================================================================== */
const CTYPES=['fire','water','grass','electric','psychic','fighting','dark','dragon','fairy','ghost','steel','ice','bug','rock'];
function seeded(seed){let s=0;for(const ch of seed)s=(s*31+ch.charCodeAt(0))>>>0;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function weekChallenges(w=weekId()){const r=seeded(w),pick=a=>a[Math.floor(r()*a.length)];const t=pick(CTYPES),g=1+Math.floor(r()*9);
  const pool=[
    {id:'any',text:'Add 3 cards',need:3,count:L=>L.length},
    {id:'new',text:'Catch 2 new Pokémon',need:2,count:L=>L.filter(c=>c.wasNew).length},
    {id:'type',text:`Add a ${tc(t)[3]}-type card`,need:1,count:L=>L.filter(c=>byNo(c.no).types.includes(t)).length,col:tc(t)[0]},
    {id:'rare',text:'Add a rare card or better',need:1,count:L=>L.filter(c=>c.tier!=='c').length},
    {id:'gen',text:`Add a Pokémon from Generation ${g}`,need:1,count:L=>L.filter(c=>byNo(c.no).gen===g).length},
    {id:'evo',text:'Add an evolution of a Pokémon you have',need:1,count:L=>L.filter(c=>{const p=byNo(c.no);return (p.from&&has(p.from))||(kids[p.no]||[]).some(k=>has(k))}).length},
    {id:'bingo',text:'Get a Pack Bingo line',need:1,count:()=>packs.filter(p=>p.date>=weekStart().toISOString()).reduce((s,p)=>s+(p.lines||0),0)},
    {id:'quiz',text:'Get 5 right in Who\'s that Pokémon?',need:5,count:()=>PLAY.game.week[w]||0}];
  const out=[];while(out.length<3){const c=pick(pool);if(!out.some(o=>o.id===c.id))out.push(c)}return out}
function thisWeekCards(){const s=weekStart().toISOString(),L=[],seen=new Set();for(const n in own)own[n].forEach(c=>{if((c.date||'')>=s&&!seen.has(c.id)){seen.add(c.id);L.push({...c,no:+n})}});return L}
function challengeState(){const w=weekId(),L=thisWeekCards(),got=PLAY.claimed[w]||[];
  return weekChallenges(w).map(c=>{const have=Math.min(c.need,c.count(L));return {...c,have,ready:have>=c.need&&!got.includes(c.id),claimed:got.includes(c.id)}})}
function daysLeft(){const end=weekStart();end.setDate(end.getDate()+7);return Math.max(1,Math.ceil((end-Date.now())/864e5))}
function challengeHTML(compact){const S=challengeState();
  return `<div class="wk ${compact?'compact':''}"><div class="wk-top"><b>This week's challenges</b><span>${daysLeft()} day${daysLeft()===1?'':'s'} left</span></div>
   ${S.map(c=>`<div class="wk-row ${c.claimed?'claimed':''}"><div class="wk-dot" style="${c.col?`--c:${c.col}`:''}">${c.claimed?'✓':''}</div><div class="wk-tx"><div>${esc(c.text)}</div><div class="bar"><i style="--p:${Math.max(c.have/c.need,.02)}"></i></div></div>
     ${c.ready?`<button class="wk-claim" data-claim="${c.id}">+${CHALLENGE_XP} XP</button>`:`<span class="wk-n">${c.claimed?'Done':c.have+'/'+c.need}</span>`}</div>`).join('')}</div>`}
function openChallenges(){openSheet('Weekly challenges',body=>{body.innerHTML=`<p class="sub">New challenges every Monday. Finish one, then tap it to collect your XP.</p>${challengeHTML(false)}
   <div class="sec">Earned so far</div><p class="hint">${Object.values(PLAY.claimed).reduce((s,w)=>s+w.length,0)} challenges done · ${Object.values(PLAY.claimed).reduce((s,w)=>s+w.length*CHALLENGE_XP,0)} XP</p>`})}
document.addEventListener('click',e=>{const b=e.target.closest('[data-claim]');if(!b)return;const w=weekId(),lb=Math.floor(xpOf(albums())/LV)+1;
  (PLAY.claimed[w]=PLAY.claimed[w]||[]).push(b.dataset.claim);savePlay();sfx?.('bingo');buzz?.([20,30,20]);toast(`Challenge done! +${CHALLENGE_XP} XP`);
  renderHome();if(typeof refreshSheet==='function'&&!$('#sheet')?.hidden)refreshSheet();const la=Math.floor(xpOf(albums())/LV)+1;if(la>lb)setTimeout(()=>celebrateAfter(lb,la),300)});

/* =====================================================================
   wiring: home, albums and the Trainer tab
   ===================================================================== */
if(typeof renderHomeExtra==='function'){const _h=renderHomeExtra;renderHomeExtra=function(A,xp,lv){_h(A,xp,lv);
  const wb=$('#weekBox');if(wb)wb.innerHTML=Object.keys(own).length?`<div class="wk-open" role="button" tabindex="0" aria-label="Weekly challenges">${challengeHTML(true)}</div>`:'';
  const fa=$('#famAlb');if(fa){const F=families(),d=F.filter(f=>f.done).length,going=F.filter(f=>f.started&&!f.done).sort((a,b)=>(a.tot-a.have)-(b.tot-b.have)).slice(0,3);
    fa.innerHTML=`<button class="album" id="openFams"><div class="ic fam-ic" aria-hidden="true"></div><div class="tx"><div class="t1">All evolution families</div><div class="t2">${d} of ${F.length} badges won</div></div><span class="chev">›</span></button>${going.map(famRow).join('')}`}}}
document.addEventListener('click',e=>{if(e.target.closest('.wk-open')&&!e.target.closest('[data-claim]'))openChallenges();if(e.target.closest('#openFams'))openFamilies()});
if(typeof renderTrainer==='function'){const _t=renderTrainer;renderTrainer=function(){_t();const S=challengeState(),ready=S.filter(c=>c.ready).length,F=families();
  $('#trainerBody .tcard').insertAdjacentHTML('afterend',`<div class="sec">Play</div><div class="play-grid">
    <button class="pcard pc-quiz" data-fn="openQuiz"><b>Who's that Pokémon?</b><span>${PLAY.game.best?'Best score '+PLAY.game.best+'/10':'Guess the silhouette'}</span></button>
    <button class="pcard pc-fam" data-fn="openFamilies"><b>Evolution families</b><span>${F.filter(f=>f.done).length} badges won</span></button>
    <button class="pcard pc-trade" data-fn="openTrade"><b>Trade with a friend</b><span>Swap cards by QR code</span></button>
    <button class="pcard pc-week" data-fn="openChallenges"><b>Weekly challenges</b><span>${ready?ready+' ready to collect!':S.filter(c=>c.claimed).length+' of 3 done'}</span></button></div><div class="sec">My collection</div>`)}}
