'use strict';
/* =====================================================================
   Full-release features: tappable pages (sheets), album pages with
   grid/binder switch, trainer profile and ranks, trophy room, my cards,
   trade corner, pack mode with Pack Bingo, camera scanning, celebrations,
   welcome adventure, read-aloud and the grown-ups corner.
   Motion: sheets wipe up behind a mask on LIFT and leave on Exit; badges
   scale out from the point they belong to; words slide up 3 frames apart.
   ===================================================================== */

/* ---------- extra saved state ---------- */
const KEY2='pokedex.extra.v1';
let prof={name:'',partner:0,fav:'',onboarded:false},packs=[],pack=null,lastBackup='',seenTiers={},celebrated={lv:1};
function load2(){try{const s=JSON.parse(localStorage.getItem(KEY2)||'{}');prof={...prof,...(s.prof||{})};packs=s.packs||[];pack=s.pack||null;lastBackup=s.lastBackup||'';seenTiers=s.seenTiers||{};celebrated=s.celebrated||{lv:1}}catch(e){}}
function save2(){try{localStorage.setItem(KEY2,JSON.stringify({prof,packs,pack,lastBackup,seenTiers,celebrated}))}catch(e){}}

/* ---------- ranks by level ---------- */
const RANKS=[[1,'Rookie'],[3,'Pokémon Trainer'],[6,'Ace Trainer'],[10,'Gym Challenger'],[15,'Gym Leader'],[22,'Elite Four'],[30,'Champion'],[45,'Pokémon Master']];
const rankOf=lv=>RANKS.filter(r=>lv>=r[0]).pop()[1];
const nextRank=lv=>RANKS.find(r=>r[0]>lv);

/* ---------- sheets: full-screen pages that wipe up from the bottom ---------- */
const sheetStack=[];
function sheetEl(){let s=$('#sheet');if(s)return s;s=document.createElement('section');s.id='sheet';s.className='sheet';s.hidden=true;
  s.innerHTML='<header class="sh-top"><button class="sh-back" aria-label="Back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 5l-7 7 7 7"/></svg></button><h2 class="sh-title"></h2><span></span></header><div class="sh-body"></div>';
  document.body.appendChild(s);s.querySelector('.sh-back').addEventListener('click',()=>closeSheet());return s}
async function openSheet(title,render,{replace=false}={}){const s=sheetEl();
  if(replace)sheetStack.pop();sheetStack.push({title,render});
  const first=s.hidden;s.querySelector('.sh-title').textContent=title;const body=s.querySelector('.sh-body');
  if(!first){ // page inside a page: old content leaves left on Exit, new arrives from the right on LIFT
    body.style.transition='clip-path 200ms var(--exit), transform 200ms var(--exit)';body.style.clipPath='inset(0 100% 0 0)';body.style.transform='translateX(-24px)';await wait(200)}
  body.innerHTML='';render(body);body.scrollTop=0;s.scrollTop=0;
  if(first){s.hidden=false;s.style.transition='none';s.style.clipPath='inset(100% 0 0 0)';s.style.transform='translateY(28px)';void s.offsetWidth;
    s.style.transition='clip-path var(--sp-lift-ms) var(--sp-lift), transform var(--sp-lift-ms) var(--sp-lift)';s.style.clipPath='inset(0 0 0 0)';s.style.transform='none';
    document.body.classList.add('sheet-open')}
  else{body.style.transition='none';body.style.clipPath='inset(0 0 0 100%)';body.style.transform='translateX(24px)';void body.offsetWidth;
    body.style.transition='clip-path var(--sp-lift-ms) var(--sp-lift), transform var(--sp-lift-ms) var(--sp-lift)';body.style.clipPath='inset(0 0 0 0)';body.style.transform='none'}
  riseIn(body)}
async function closeSheet(all){const s=$('#sheet');if(!s||s.hidden)return;sheetStack.pop();
  if(!all&&sheetStack.length){const prev=sheetStack.pop();return openSheet(prev.title,prev.render)}
  sheetStack.length=0;s.style.transition='clip-path 240ms var(--exit), transform 240ms var(--exit)';s.style.clipPath='inset(100% 0 0 0)';s.style.transform='translateY(28px)';
  await wait(240);s.hidden=true;document.body.classList.remove('sheet-open');renderHome();if(!$('#v-dex').hidden)renderGrid()}
function refreshSheet(){const top=sheetStack[sheetStack.length-1];if(!top)return;const body=$('#sheet .sh-body');const y=$('#sheet').scrollTop;body.innerHTML='';top.render(body);$('#sheet').scrollTop=y}
function riseIn(root){root.querySelectorAll('.mask>span').forEach((s,i)=>{s.style.setProperty('--i',i)});root.classList.remove('rise');void root.offsetWidth;root.classList.add('rise')}
addEventListener('keydown',e=>{if(e.key==='Escape'){if(open)closeTile();else closeSheet()}});

/* ---------- progress ring (SVG) ---------- */
function ring(p,col,size=96){const r=size/2-8,C=2*Math.PI*r;return `<svg class="pring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
  <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#ffffff18" stroke-width="10"/>
  <circle class="pr-arc" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" style="--off:${C*(1-Math.max(p,.004))}" transform="rotate(-90 ${size/2} ${size/2})"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="currentColor" font-family="Inter Tight" font-weight="700" font-size="${size/4.4}">${Math.round(p*100)}%</text></svg>`}
function animateRings(root){requestAnimationFrame(()=>requestAnimationFrame(()=>root.querySelectorAll('.pr-arc').forEach(a=>{a.style.transition='stroke-dashoffset var(--sp-lift-ms) var(--sp-lift)';a.style.strokeDashoffset=a.style.getPropertyValue('--off')})))}

/* ---------- album page: grid ⇄ binder ---------- */
let albumView='grid';
function findAlbum(id){const A=albums();return [...A.gen,...A.type,...A.mini,...A.set].find(a=>a.id===id)}
function nextTierText(a){const steps=[[.1,'Bronze'],[.5,'Silver'],[1,'Gold']];const n=steps.find(s=>a.p<s[0]);if(!n)return 'Gold trophy won!';
  const need=Math.ceil(n[0]*a.tot)-a.have;return `${need} more for ${n[1]}`}
function openAlbum(id){const a0=findAlbum(id);if(!a0)return;openSheet(a0.name,body=>{const a=findAlbum(id),c=tc(a.key);
  body.innerHTML=`<div class="al-head" style="--c:${c[0]};--d:${c[1]}"><div class="fx fx-${c[2]}"></div>${ring(a.p,c[0])}
    <div class="al-tx"><div class="mask"><span class="al-n">${a.have} <small>of ${a.tot}</small></span></div><div class="mask"><span class="tro ${tier(a.p)}">${tier(a.p)==='none'?'No trophy yet':tierLabel[tier(a.p)]+' trophy'}</span></div><div class="mask"><span class="al-next">${nextTierText(a)}</span></div></div></div>
    <div class="seg" role="tablist"><button role="tab" data-v="grid" aria-selected="${albumView==='grid'}">Grid</button><button role="tab" data-v="binder" aria-selected="${albumView==='binder'}">Binder</button><i></i></div>
    <div class="al-body"></div>`;
  const seg=body.querySelector('.seg'),ab=body.querySelector('.al-body');
  const draw=()=>{ab.innerHTML=albumView==='grid'?albumGrid(a):albumBinder(a);seg.style.setProperty('--x',albumView==='grid'?'0%':'100%');
    seg.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',b.dataset.v===albumView));if(albumView==='binder')binderDots(ab)};
  seg.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b||b.dataset.v===albumView)return;albumView=b.dataset.v;
    ab.style.transition='clip-path 180ms var(--exit)';ab.style.clipPath='inset(0 0 100% 0)';await wait(180);draw();ab.style.transition='none';ab.style.clipPath='inset(0 0 100% 0)';void ab.offsetWidth;
    ab.style.transition='clip-path var(--sp-lift-ms) var(--sp-lift)';ab.style.clipPath='inset(0 0 0 0)'});
  draw();animateRings(body)})}
function setSlots(a){const cards={};for(const n in own)own[n].forEach(c=>{if(c.setId===a.setId&&!cards[c.number])cards[c.number]={c,no:+n}});
  const slots=[];for(let i=1;i<=a.tot;i++)slots.push({num:String(i),hit:cards[String(i)]});
  Object.keys(cards).filter(k=>!/^\d+$/.test(k)||+k>a.tot).forEach(k=>slots.push({num:k,hit:cards[k]}));return slots}
function albumGrid(a){if(a.isSet){return `<div class="grid">${setSlots(a).map(s=>s.hit?`<button class="tile set-own opencard" data-no="${s.hit.no}"><img class="cardfill" src="${esc(s.hit.c.img)}" alt="${esc(s.hit.c.name)}" loading="lazy"></button>`:`<div class="tile pocket"><span class="pk-n">${esc(s.num)}</span></div>`).join('')}</div>`}
  return `<div class="grid">${a.all.map(tileHTML).join('')}</div>`}
function albumBinder(a){const items=a.isSet?setSlots(a).map(s=>s.hit?{own:true,no:s.hit.no,img:s.hit.c.img,label:s.hit.c.name}:{own:false,label:'#'+s.num}):
  a.all.map(p=>{const o=topCard(p.no);return o?{own:true,no:p.no,img:o.photo||o.img,art:!o.photo&&!o.img,label:p.name}:{own:false,no:p.no,label:pad(p.no)}});
  const pages=[];for(let i=0;i<items.length;i+=9)pages.push(items.slice(i,i+9));
  return `<div class="binder">${pages.map((pg,pi)=>`<div class="bpage" aria-label="Page ${pi+1} of ${pages.length}">${pg.map(it=>it.own?
     `<button class="pocket full opencard" data-no="${it.no}">${it.img?`<img src="${esc(it.img)}" alt="${esc(it.label)}" loading="lazy">`:`<img class="partart" src="${ART(it.no)}" alt="${esc(it.label)}" loading="lazy">`}</button>`:
     `<div class="pocket">${it.no?`<img class="ghostart" src="${ART(it.no)}" alt="" loading="lazy">`:''}<span class="pk-n">${esc(it.label)}</span></div>`).join('')}${'<div class="pocket blank"></div>'.repeat(9-pg.length)}</div>`).join('')}</div>
   <div class="bdots">${pages.length>1?`Page <b class="bcur">1</b> of ${pages.length} · swipe for more`:''}</div>`}
function binderDots(root){const b=root.querySelector('.binder'),cur=root.querySelector('.bcur');if(!b||!cur)return;b.addEventListener('scroll',()=>{cur.textContent=Math.round(b.scrollLeft/b.clientWidth)+1},{passive:true})}
document.addEventListener('click',e=>{const al=e.target.closest('[data-album]');if(al)openAlbum(al.dataset.album)});

/* ---------- trainer profile, levels and ranks ---------- */
function partnerArt(){return prof.partner?`<img src="${ART(prof.partner)}" alt="">`:esc((prof.name||'T')[0].toUpperCase())}
function openLevels(){openSheet('Levels and ranks',body=>{const A=albums(),xp=xpOf(A),lv=Math.floor(xp/LV)+1,nr=nextRank(lv);
  const rows=[['A new Pokémon','100 XP'],['Another card of a Pokémon you have','20 XP'],['Rare card bonus','+150 XP'],['Ultra rare bonus','+400 XP'],['Your own photo of a card','+25 XP'],['Each Pack Bingo line','+50 XP'],['Pack Bingo full house','+300 XP'],['Finishing an album','+500 XP']];
  body.innerHTML=`<div class="lv-hero"><div class="lv-badge"><span>LEVEL</span><b>${lv}</b></div><div><div class="mask"><span class="lv-rank">${rankOf(lv)}</span></div><div class="mask"><span class="muted">${xp.toLocaleString()} XP · ${LV-xp%LV} XP to level ${lv+1}</span></div>${nr?`<div class="mask"><span class="muted">Reach level ${nr[0]} to become <b>${nr[1]}</b></span></div>`:''}</div></div>
   <div class="sec">How to earn XP</div><div class="rules">${rows.map(r=>`<div><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div>
   <div class="sec">Ranks</div><div class="ranks">${RANKS.map(r=>`<div class="${lv>=r[0]?'got':''}"><b>Level ${r[0]}</b><span>${r[1]}</span>${lv>=r[0]?'<i>✓</i>':''}</div>`).join('')}</div>`})}
function openProfile(){openSheet('My trainer card',body=>{const A=albums(),xp=xpOf(A),lv=Math.floor(xp/LV)+1;
  body.innerHTML=`<div class="pf-card"><div class="avatar big">${partnerArt()}</div><div class="mask"><span class="pf-name">${esc(prof.name||'Trainer')}</span></div><div class="mask"><span class="muted">${rankOf(lv)} · ${titleOf(A)}</span></div></div>
   <label class="fl">My name<input id="pfName" maxlength="20" value="${esc(prof.name||'')}" placeholder="Type your name"></label>
   <div class="sec">My partner Pokémon</div><div class="partners">${PARTNERS.map(n=>`<button class="partner ${prof.partner===n?'on':''}" data-pn="${n}"><img src="${ART(n)}" alt="">${esc(byNo(n).name)}</button>`).join('')}</div>
   <div class="sec">My favourite type</div><div class="filters wrap">${Object.keys(T).map(k=>`<button class="chip" data-ft="${k}" aria-pressed="${prof.fav===k}" style="--c:${T[k][0]}"><span class="dot"></span>${T[k][3]}</button>`).join('')}</div>`;
  body.querySelector('#pfName').addEventListener('change',e=>{prof.name=e.target.value.trim().slice(0,20)||'Trainer';save2();applyProfile()});
  body.addEventListener('click',e=>{const pn=e.target.closest('[data-pn]');if(pn){prof.partner=+pn.dataset.pn;save2();applyProfile();refreshSheet()}
    const ft=e.target.closest('[data-ft]');if(ft){prof.fav=ft.dataset.ft;save2();applyProfile();refreshSheet()}})})}
const PARTNERS=[25,133,4,7,1,94,448,658,906,909,912,700,39,143,150,6];
function applyProfile(){$('#tname').textContent=prof.name||'Trainer';const av=$('.avatar');av.innerHTML=partnerArt();av.classList.toggle('has-art',!!prof.partner);
  if(prof.fav)$('#app').style.setProperty('--glow',tc(prof.fav)[0])}

/* ---------- trophy room, my cards, trade corner ---------- */
function openTrophies(){openSheet('Trophy room',body=>{const A=albums(),all=[...A.gen,...A.type,...A.mini,...A.set];
  const g=t=>all.filter(a=>tier(a.p)===t);
  body.innerHTML=['gold','silver','bronze'].map(t=>`<div class="sec">${tierLabel[t]} (${g(t).length})</div><div class="near">${g(t).map(albumRow).join('')||'<p class="hint">None yet. Keep collecting!</p>'}</div>`).join('')+
   `<div class="sec">Still locked</div><p class="hint">Get 10% of any album for Bronze, half for Silver and all of it for Gold.</p><div class="near">${g('none').slice(0,8).map(albumRow).join('')}</div>`})}
function allCards(){const L=[];for(const n in own)own[n].forEach((c,i)=>L.push({...c,no:+n,i}));return L.sort((a,b)=>(b.date||'').localeCompare(a.date||''))}
function cardThumbs(L){return `<div class="cgrid">${L.map(c=>`<button class="cthumb opencard" data-no="${c.no}">${c.photo||c.img?`<img src="${c.photo||esc(c.img)}" alt="${esc(c.name)}" loading="lazy">`:`<img class="partart" src="${ART(c.no)}" alt="${esc(c.name)}">`}<span>${esc(c.name)}</span></button>`).join('')}</div>`}
function openMyCards(){openSheet('All my cards',body=>{const L=allCards();body.innerHTML=L.length?`<p class="sub">${L.length} cards, newest first. Tap one to see it.</p>${cardThumbs(L)}`:'<p class="hint">No cards yet. Tap Add to put in your first one.</p>'})}
function spares(){const L=[];for(const n in own)if(own[n].length>1){const keep=Math.min(fav[n]||0,own[n].length-1);own[n].forEach((c,i)=>{if(i!==keep)L.push({...c,no:+n,i})})}return L}
function openSpares(){openSheet('Got spare',body=>{const L=spares();body.innerHTML=`<p class="sub">Cards you have more than one of. These are great for trading with friends.</p>${L.length?cardThumbs(L):'<p class="hint">No spares yet. When you get a second card of a Pokémon, it shows up here.</p>'}`})}
function openWish(){openSheet('My wish list',body=>{const L=Object.keys(wish).map(Number).filter(n=>!has(n));body.innerHTML=`<p class="sub">Pokémon you'd love to get. Show this list at birthdays, or when trading.</p>${L.length?`<div class="grid">${L.map(n=>tileHTML(byNo(n))).join('')}</div>`:'<p class="hint">Your wish list is empty. Open any Pokémon you haven\'t caught and tap "Add to my wish list".</p>'}`})}

/* ---------- home extras ---------- */
function renderHomeExtra(A,xp,lv){$('#ttitle').textContent=Object.keys(own).length?`${rankOf(lv)} · ${titleOf(A)}`:rankOf(lv);
  $('#spareN').textContent=spares().length;$('#wishN').textContent=Object.keys(wish).filter(n=>!has(+n)).length;$('#packN').textContent=packs.length;
  const n=Object.values(own).reduce((s,a)=>s+a.length,0),days=lastBackup?(Date.now()-Date.parse(lastBackup))/864e5:999;
  $('#backupNag').hidden=!(n>=10&&days>30);
  const pb=$('#packBar');if(pb)renderPackBar()}

/* ---------- Pack mode + Pack Bingo ---------- */
const BINGO=[['new','A new Pokémon'],['rare','A rare card'],['ultra','An ultra rare'],['types3','3 different types'],['evo','An evolution pair'],['dup','A card you already had'],['legend','Legendary or mythical'],['starter','Fire, Water or Grass'],['five','5 or more cards']];
const LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function bingoHits(pk){const hit=new Set(),cards=pk.cards.map(id=>{for(const n in own){const c=own[n].find(c=>c.id===id);if(c)return {...c,no:+n}}}).filter(Boolean);
  const types=new Set();cards.forEach(c=>{const p=byNo(c.no);p.types.forEach(t=>types.add(t));if(c.wasNew)hit.add('new');if(c.tier!=='c')hit.add('rare');if(c.tier==='u')hit.add('ultra');if(!c.wasNew)hit.add('dup');
    if(p.leg||p.myth)hit.add('legend');if(p.types.some(t=>['fire','water','grass'].includes(t)))hit.add('starter')});
  if(types.size>=3)hit.add('types3');if(cards.length>=5)hit.add('five');
  const nos=new Set(cards.map(c=>c.no));if(cards.some(c=>{const p=byNo(c.no);return (p.from&&nos.has(p.from))||(kids[p.no]||[]).some(k=>nos.has(k))}))hit.add('evo');
  const idx=BINGO.map((b,i)=>hit.has(b[0])?i:-1).filter(i=>i>=0);const lines=LINES.filter(l=>l.every(i=>idx.includes(i))).length;
  return {hit,lines,full:idx.length===9,cards}}
function packBonus(pk){const b=bingoHits(pk);return b.lines*50+(b.full?300:0)}
function packXP(){return packs.reduce((s,p)=>s+(p.bonus||0),0)}
function bingoHTML(pk,small){const b=bingoHits(pk);return `<div class="bingo ${small?'sm':''}">${BINGO.map(([k,l])=>`<div class="bsq ${b.hit.has(k)?'on':''}"><span>${l}</span></div>`).join('')}</div>`}
function renderPackBar(){const pb=$('#packBar');if(!pack){pb.innerHTML=`<button class="pack-start" id="packStart"><span class="pk-ic" aria-hidden="true"></span><span><b>Opening a pack?</b><br><small>Add its cards one by one and play Pack Bingo</small></span></button>`;return}
  const b=bingoHits(pack);pb.innerHTML=`<div class="pack-live"><div class="pl-top"><b>Pack open · ${pack.cards.length} card${pack.cards.length===1?'':'s'}</b><span>${b.lines} bingo line${b.lines===1?'':'s'}</span></div>${bingoHTML(pack,true)}
   <button class="photo-btn" id="packEnd">Finish this pack</button></div>`}
document.addEventListener('click',e=>{if(e.target.closest('#packStart')){pack={date:new Date().toISOString(),cards:[]};save2();renderPackBar();toast('Pack started! Scan or type each card');return}
  if(e.target.closest('#packEnd'))finishPack()});
async function finishPack(){if(!pack)return;const pk=pack;pack=null;
  if(!pk.cards.length){save2();renderPackBar();return}
  pk.bonus=packBonus(pk);const b=bingoHits(pk);pk.lines=b.lines;pk.full=b.full;packs.unshift(pk);save2();renderPackBar();renderHome();
  openPackSummary(pk,true)}
function openPackSummary(pk,fresh){openSheet(fresh?'Pack complete!':'Pack from '+new Date(pk.date).toLocaleDateString('en-GB',{day:'numeric',month:'short'}),body=>{const b=bingoHits(pk);
  const best=[...b.cards].sort((x,y)=>'cru'.indexOf(y.tier)-'cru'.indexOf(x.tier))[0];
  body.innerHTML=`${best?`<div class="best"><div class="mask"><span class="tag">BEST PULL</span></div><img src="${esc(best.img||ART(best.no))}" alt="${esc(best.name)}"><div class="mask"><span class="pf-name">${esc(best.name)}</span></div></div>`:''}
   <div class="mask"><span class="pk-sum">${b.cards.length} cards · ${b.lines} bingo line${b.lines===1?'':'s'}${b.full?' · FULL HOUSE!':''} · +${pk.bonus||0} bonus XP</span></div>
   ${bingoHTML(pk)}<div class="sec">Cards in this pack</div>${cardThumbs(b.cards.map(c=>({...c})))}`})}
function openPacks(){openSheet('My packs',body=>{body.innerHTML=packs.length?`<div class="near">${packs.map((p,i)=>`<button class="album" data-pack="${i}"><div class="ic pkic"></div><div class="tx"><div class="t1">${new Date(p.date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}</div><div class="t2">${p.cards.length} cards · ${p.lines||0} bingo lines${p.full?' · full house':''}</div></div><span class="tro ${p.full?'gold':p.lines?'silver':'none'}">+${p.bonus||0} XP</span></button>`).join('')}</div>`:'<p class="hint">No packs yet. On the Add page, tap "Opening a pack?" before you add the cards from a new pack.</p>'});}
document.addEventListener('click',e=>{const p=e.target.closest('[data-pack]');if(p)openPackSummary(packs[+p.dataset.pack])});

/* ---------- after a catch: pack bookkeeping, stay on Add while a pack is open ---------- */
async function afterCatch(p,card,lb,la){card.wasNew=(own[p.no]||[]).length===1;save();
  if(pack){pack.cards.push(card.id);save2();renderPackBar();
    // stay on Add, clear the search for the next card, celebrate, and keep scanning
    $('#search').value='';$('#results').innerHTML='';$('#resTitle').hidden=true;const b=bingoHits(pack);
    toast(b.lines?`Bingo! ${b.lines} line${b.lines===1?'':'s'} so far`:'Next card!');
    celebrateAfter(lb,la);return true}
  return false}

/* ---------- celebrations: level up and new trophies ---------- */
function snapTiers(){const A=albums();seenTiers={};[...A.gen,...A.type,...A.mini,...A.set].forEach(a=>seenTiers[a.id]=tier(a.p))}
const celebQ=[];let celebBusy=false;
function celebrateAfter(lb,la){const A=albums(),order=['none','bronze','silver','gold'];
  if(la>lb)celebQ.push({kind:'level',lv:la});
  [...A.gen,...A.type,...A.mini,...A.set].forEach(a=>{const was=seenTiers[a.id]||'none',now=tier(a.p);if(order.indexOf(now)>order.indexOf(was))celebQ.push({kind:'trophy',a,t:now})});
  snapTiers();save2();runCeleb()}
async function runCeleb(){if(celebBusy||!celebQ.length)return;celebBusy=true;const it=celebQ.shift();
  let ov=$('#celeb');if(!ov){ov=document.createElement('div');ov.id='celeb';ov.className='celeb';document.body.appendChild(ov)}
  const from=(it.kind==='level'?$('#lvlChip'):$('.tab[data-tab="3"]')).getBoundingClientRect();
  const col=it.kind==='level'?'#FFE27A':{gold:'#FFE27A',silver:'#e8eaf0',bronze:'#f0b27a'}[it.t];
  ov.innerHTML=`<div class="cb-dim"></div><div class="cb-badge" style="--col:${col}">${it.kind==='level'?`<span>LEVEL</span><b>${it.lv}</b>`:`<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#3a2a00" stroke-width="1.8"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M17 5h3a3 3 0 0 1-3 4M7 5H4a3 3 0 0 0 3 4"/></svg>`}</div>
   <div class="cb-words"><div class="mask"><span class="big ${it.kind==='level'||it.t==='gold'?'gold':''}">${it.kind==='level'?'Level up!':tierLabel[it.t]+' trophy!'}</span></div>
   <div class="mask"><span class="small">${it.kind==='level'?`You're now level ${it.lv} · ${rankOf(it.lv)}`:esc(it.a.name)}</span></div><div class="mask"><span class="small muted">Tap to carry on</span></div></div>`;
  ov.hidden=false;const bd=ov.querySelector('.cb-badge'),cx=innerWidth/2,cy=innerHeight*0.4,fx=from.left+from.width/2,fy=from.top+from.height/2;
  // badge is born at the chip it belongs to and travels on an arc to centre (LIFT), growing as it goes
  await play(700,t=>{const p=springX(t/1000,SP.lift.T,SP.lift.b),pt=arcPoint({x:fx,y:fy},{x:cx,y:cy},clamp01(p),.2);bd.style.transform=`translate(${pt.x-70}px,${pt.y-70}px) scale(${lerp(.15,1,p)})`});
  const w=ov.querySelector('.cb-words');w.style.top=(cy+90)+'px';riseIn(w);ov.querySelector('.cb-dim').classList.add('on');
  // ring of light
  const rg=document.createElement('div');rg.className='ring';rg.style.setProperty('--rc',col);ov.appendChild(rg);
  play(700,t=>{const u=t/700,s=lerp(.6,3.6,GLIDE(u));rg.style.borderWidth=(10*(1-GLIDE(u)))+'px';rg.style.transform=`translate(${cx-60}px,${cy-60}px) scale(${s})`}).then(()=>rg.remove());
  await new Promise(r=>ov.addEventListener('click',r,{once:true}));
  ov.querySelector('.cb-dim').classList.remove('on');w.innerHTML='';
  await play(420,t=>{const e=HAND(t/420),pt=arcPoint({x:cx,y:cy},{x:fx,y:fy},e,-.2);bd.style.transform=`translate(${pt.x-70}px,${pt.y-70}px) scale(${lerp(1,0.02,e)})`});
  ov.hidden=true;celebBusy=false;runCeleb()}

/* ---------- read aloud ---------- */
function sayDex(p){if(!('speechSynthesis' in window)){toast('Reading aloud isn\'t available on this device');return}speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(`${p.name}. The ${p.types.map(t=>tc(t)[3]).join(' and ')} type Pokémon. ${FLAV[p.no-1]||''}`);
  const v=speechSynthesis.getVoices().find(v=>/en-GB/i.test(v.lang))||speechSynthesis.getVoices().find(v=>/^en/i.test(v.lang));if(v)u.voice=v;u.rate=.95;u.pitch=.9;speechSynthesis.speak(u)}

/* ---------- camera scanning: read the number in the card's bottom corner ---------- */
let scanStream=null,ocr=null,scanTimer=0;
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
async function openScanner(){let ov=$('#scanner');if(!ov){ov=document.createElement('div');ov.id='scanner';ov.className='scanner';
    ov.innerHTML=`<video playsinline muted autoplay></video><div class="sc-frame"><div class="sc-card"><span class="sc-corner l"></span><span class="sc-corner r"></span></div></div>
     <div class="sc-msg" id="scMsg">Getting the camera ready…</div><div class="sc-tip">Fit the card in the box. Keep the bottom corner number sharp and out of glare.</div>
     <button class="sc-close" aria-label="Close camera">×</button><button class="sc-type ghost">Type it instead</button>`;document.body.appendChild(ov);
    ov.querySelector('.sc-close').addEventListener('click',closeScanner);ov.querySelector('.sc-type').addEventListener('click',()=>{closeScanner();$('#search').focus()})}
  ov.hidden=false;ov.style.transition='none';ov.style.clipPath='circle(0% at 50% 50%)';void ov.offsetWidth;
  const r=$('#scanBtn').getBoundingClientRect();ov.style.setProperty('--ox',(r.left+r.width/2)+'px');ov.style.setProperty('--oy',(r.top+r.height/2)+'px');
  ov.style.clipPath=`circle(0% at ${r.left+r.width/2}px ${r.top+r.height/2}px)`;void ov.offsetWidth;ov.style.transition='clip-path var(--sp-lift-ms) var(--sp-lift)';ov.style.clipPath=`circle(150% at ${r.left+r.width/2}px ${r.top+r.height/2}px)`;
  const msg=$('#scMsg');
  try{scanStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1920},height:{ideal:1080}},audio:false});const v=ov.querySelector('video');v.srcObject=scanStream;await v.play()}
  catch(e){msg.textContent='The camera isn\'t available. Allow camera access in your settings, or type the number instead.';return}
  msg.textContent='Loading the number reader…';
  try{if(!window.Tesseract)await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
    if(!ocr){ocr=await Tesseract.createWorker('eng');await ocr.setParameters({tessedit_char_whitelist:'0123456789/ ',tessedit_pageseg_mode:'7'})}}
  catch(e){msg.textContent='Couldn\'t load the number reader. Check the internet, or type the number instead.';return}
  msg.textContent='Looking for the number…';scanLoop()}
async function scanLoop(){const ov=$('#scanner');if(!ov||ov.hidden||!scanStream)return;const v=ov.querySelector('video');
  try{const hit=await readCorner(v);if(hit){$('#scMsg').textContent=`Found ${hit}!`;navigator.vibrate?.(30);await wait(300);closeScanner();$('#search').value=hit;find(hit);return}}catch(e){}
  scanTimer=setTimeout(scanLoop,350)}
// crop the two bottom corners of the on-screen guide box out of the video frame, enlarge, threshold, and OCR each
async function readCorner(v){const vw=v.videoWidth,vh=v.videoHeight;if(!vw)return null;const box=$('.sc-card').getBoundingClientRect(),vr=v.getBoundingClientRect();
  const s=Math.max(vr.width/vw,vr.height/vh),ox=(vr.width-vw*s)/2,oy=(vr.height-vh*s)/2; // object-fit: cover mapping
  const toV=(x,y)=>[(x-vr.left-ox)/s,(y-vr.top-oy)/s];
  for(const side of ['l','r']){const x0=side==='l'?box.left:box.left+box.width*0.55,[sx,sy]=toV(x0,box.top+box.height*0.86),[ex,ey]=toV(x0+box.width*0.45,box.bottom);
    const w=Math.max(8,ex-sx),h=Math.max(8,ey-sy),cv=document.createElement('canvas'),k=Math.min(4,600/w);cv.width=w*k;cv.height=h*k;const g=cv.getContext('2d');
    g.filter='grayscale(1) contrast(1.8)';g.drawImage(v,sx,sy,w,h,0,0,cv.width,cv.height);
    const {data}=await ocr.recognize(cv);const m=(data.text||'').replace(/\s+/g,'').match(/(\d{1,3})\/(\d{2,3})/);if(m&&+m[1]>0&&+m[2]>=20)return `${m[1].padStart(3,'0')}/${m[2]}`}
  return null}
async function closeScanner(){clearTimeout(scanTimer);const ov=$('#scanner');if(!ov||ov.hidden)return;if(scanStream){scanStream.getTracks().forEach(t=>t.stop());scanStream=null}
  ov.style.transition='clip-path 240ms var(--exit)';ov.style.clipPath='circle(0% at 50% 50%)';await wait(240);ov.hidden=true}

/* ---------- welcome adventure (first launch) ---------- */
function startWelcome(){const ov=document.createElement('div');ov.className='welcome';ov.id='welcome';document.body.appendChild(ov);let step=0,pick={name:'',fav:'',partner:0};
  const steps=[()=>`<div class="wl-ball"></div><div class="mask"><span class="big">Welcome, Trainer!</span></div><div class="mask"><span class="small">This is your very own Pokédex. Every real card you collect fills it in.</span></div><button class="cta wl-next">Let's go</button>`,
   ()=>`<div class="mask"><span class="big">What's your name?</span></div><input id="wlName" class="search" maxlength="20" placeholder="Type your name" value="${esc(pick.name)}"><button class="cta wl-next">That's me</button>`,
   ()=>`<div class="mask"><span class="big">Pick your favourite type</span></div><div class="filters wrap">${Object.keys(T).map(k=>`<button class="chip" data-wt="${k}" aria-pressed="${pick.fav===k}" style="--c:${T[k][0]}"><span class="dot"></span>${T[k][3]}</button>`).join('')}</div><button class="cta wl-next" ${pick.fav?'':'disabled'}>Next</button>`,
   ()=>`<div class="mask"><span class="big">Choose your partner</span></div><div class="mask"><span class="small">Your partner Pokémon goes on your trainer card.</span></div><div class="partners">${PARTNERS.map(n=>`<button class="partner ${pick.partner===n?'on':''}" data-wp="${n}"><img src="${ART(n)}" alt="">${esc(byNo(n).name)}</button>`).join('')}</div><button class="cta wl-next" ${pick.partner?'':'disabled'}>Next</button>`,
   ()=>`<div class="avatar big">${pick.partner?`<img src="${ART(pick.partner)}" alt="">`:''}</div><div class="mask"><span class="big">You're ready, ${esc(pick.name||'Trainer')}!</span></div><div class="mask"><span class="small">Grab a card and look for the number in its bottom corner, like 025/198. Then tap <b>Add</b>.</span></div><button class="cta wl-next">Add my first card</button>`];
  const draw=async(dir=1)=>{const inner=ov.querySelector('.wl-in');if(inner){inner.style.transition='clip-path 200ms var(--exit), transform 200ms var(--exit)';inner.style.clipPath='inset(0 100% 0 0)';inner.style.transform='translateX(-24px)';await wait(200);inner.remove()}
    const d=document.createElement('div');d.className='wl-in';d.innerHTML=steps[step]()+`<div class="wl-dots">${steps.map((_,i)=>`<i class="${i===step?'on':''}"></i>`).join('')}</div>`;ov.appendChild(d);
    d.style.clipPath='inset(0 0 0 100%)';d.style.transform='translateX(24px)';void d.offsetWidth;d.style.transition='clip-path var(--sp-lift-ms) var(--sp-lift), transform var(--sp-lift-ms) var(--sp-lift)';d.style.clipPath='inset(0 0 0 0)';d.style.transform='none';riseIn(d);
    d.querySelector('#wlName')?.focus()};
  ov.addEventListener('click',e=>{const wt=e.target.closest('[data-wt]');if(wt){pick.fav=wt.dataset.wt;ov.style.setProperty('--glow',tc(pick.fav)[0]);ov.querySelectorAll('[data-wt]').forEach(c=>c.setAttribute('aria-pressed',c===wt));ov.querySelector('.wl-next').disabled=false;return}
    const wp=e.target.closest('[data-wp]');if(wp){pick.partner=+wp.dataset.wp;ov.querySelectorAll('[data-wp]').forEach(c=>c.classList.toggle('on',c===wp));ov.querySelector('.wl-next').disabled=false;return}
    if(e.target.closest('.wl-next')){if(step===1){pick.name=($('#wlName').value.trim()||'Trainer').slice(0,20)}
      if(step<steps.length-1){step++;draw()}else{prof={...prof,...pick,onboarded:true};save2();applyProfile();renderHome();
        ov.style.transition='clip-path 300ms var(--exit)';ov.style.clipPath='circle(0% at 50% 100%)';setTimeout(()=>{ov.remove();go(2)},300)}}});
  ov.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='wlName')ov.querySelector('.wl-next').click()});
  draw()}

/* ---------- grown-ups corner (behind a maths question) ---------- */
function openGrownups(){const a=6+Math.floor(Math.random()*4),b=6+Math.floor(Math.random()*4);
  openSheet('Grown-ups corner',body=>{body.innerHTML=`<p class="sub">This part is for grown-ups. What is ${a} × ${b}?</p><form class="find" id="gate"><input class="search" id="gateAns" inputmode="numeric" placeholder="Answer" aria-label="Answer"><button class="go" type="submit">Open</button></form><p class="hint" id="gateMsg"></p>`;
    body.querySelector('#gate').addEventListener('submit',e=>{e.preventDefault();if(+$('#gateAns').value===a*b)openSheet('Grown-ups corner',parentBody,{replace:true});else $('#gateMsg').textContent='Not quite. Ask a grown-up to help.'})})}
function parentBody(body){const L=allCards();
  body.innerHTML=`<div class="sec">Backup</div><p class="hint">${lastBackup?'Last backup: '+new Date(lastBackup).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'No backup saved yet.'} The collection lives only on this device, so save a backup file now and then (for example to iCloud Drive or Google Drive).</p>
   <div class="backup"><button class="photo-btn" id="pExport">Save a backup file</button><label class="ghost">Load a backup file<input type="file" accept="application/json,.json" id="pImport"></label></div>
   ${typeof syncSection==='function'?syncSection():''}
   <div class="sec">Fix a mistake</div><p class="hint">Added a card by accident? Remove it here.</p>
   <div class="rmlist">${L.slice(0,200).map(c=>`<div class="rm"><img src="${c.photo||esc(c.img)||ART(c.no)}" alt=""><span><b>${esc(c.name)}</b><br><small>${esc(c.set)}${c.number?' · '+esc(c.number):''}</small></span><button class="ghost rm-btn" data-rm="${c.no}:${esc(c.id)}">Remove</button></div>`).join('')||'<p class="hint">No cards yet.</p>'}</div>
   <div class="sec">Start again</div><p class="hint">Deletes every card, pack and photo on this device. Save a backup first.</p><button class="ghost danger" id="pReset">Delete everything</button>
   <div class="sec">About</div><p class="hint">Pokémon details and artwork from PokéAPI. Card pictures and data from the Pokémon TCG API. Pokémon and all related names are trademarks of Nintendo, Creatures and GAME FREAK. This is a private, non-commercial family app. No ads, no purchases, no chat, and nothing about your child leaves this device unless you turn on family sync.</p>`;
  body.querySelector('#pExport').addEventListener('click',exportBackup);
  body.querySelector('#pImport').addEventListener('change',importBackup);
  body.addEventListener('click',e=>{const b=e.target.closest('[data-rm]');if(b){if(!b.classList.contains('sure')){b.classList.add('sure');b.textContent='Yes, remove';return}
      const [no,id]=b.dataset.rm.split(/:(.*)/s);own[no]=(own[no]||[]).filter(c=>c.id!==id);if(!own[no].length){delete own[no];delete fav[no]}save();refreshSheet();toast('Card removed')}
    const r=e.target.closest('#pReset');if(r){if(!r.classList.contains('sure')){r.classList.add('sure');r.textContent='Tap again to delete everything';return}
      own={};fav={};wish={};packs=[];pack=null;save();save2();refreshSheet();toast('Everything deleted')}})}
function exportBackup(){const blob=new Blob([JSON.stringify({app:'pokedex',v:2,saved:new Date().toISOString(),own,fav,wish,extra:{prof,packs,pack,seenTiers,celebrated}})],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`pokedex-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);
  lastBackup=new Date().toISOString();save2();refreshSheet();renderHome();toast('Backup saved')}
async function importBackup(e){const f=e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text());if(j.app!=='pokedex'||typeof j.own!=='object')throw 0;
  own=j.own;fav=j.fav||{};wish=j.wish||{};if(j.extra){prof={...prof,...j.extra.prof};packs=j.extra.packs||[];pack=j.extra.pack||null;seenTiers=j.extra.seenTiers||{};celebrated=j.extra.celebrated||{lv:1}}
  else if(j.name)prof.name=j.name;save();save2();applyProfile();renderHome();renderGrid();refreshSheet();toast('Backup loaded')}catch(_){toast('That file isn\'t a Pokédex backup')}e.target.value=''}

/* ---------- wiring ---------- */
function initFeatures(){load2();
  if(!prof.name){try{const nm=localStorage.getItem('pokedex.name');if(nm)prof.name=nm}catch(e){}}
  const on=(sel,fn)=>document.addEventListener('click',e=>{if(e.target.closest(sel))fn(e)});
  on('#lvlChip',openLevels);on('.xp-tap',openLevels);on('.trow',openProfile);on('#stCaught',()=>{filt='caught';renderFilters();gen=0;renderGens();renderGrid();go(1)});
  on('#stCards',openMyCards);on('#stTro',openTrophies);on('#openSpares',openSpares);on('#openWish',openWish);on('#openPacks',openPacks);on('#openGrown',openGrownups);on('#backupNag',openGrownups);
  on('#scanBtn',openScanner);
  if(!navigator.mediaDevices?.getUserMedia)$('#scanBtn').hidden=true;
  applyProfile();
  if(!prof.onboarded&&!Object.keys(own).length)startWelcome();else if(!prof.onboarded){prof.onboarded=true;save2()}
  snapTiers();if(typeof initSync==='function')initSync()}
