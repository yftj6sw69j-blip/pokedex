/* extras.js: Pokédex search, hold-for-shortcuts, home goal card, Pokémon of the day,
   recent pulls carousel, Hall of Fame shelf, living region maps, cries and the dex voice.
   Motion (MeFit): no fades. Menus and shelves wipe in behind masks on LIFT, map areas
   grow from their centres on staggered springs, the goal card's bar fills on GLIDE. */

const dayNo=()=>Math.floor((Date.now()-new Date().getTimezoneOffset()*6e4)/864e5);
const hash=n=>{n=(n^61)^(n>>>16);n=n+(n<<3);n=n^(n>>>4);n=Math.imul(n,0x27d4eb2d);return (n^(n>>>15))>>>0};

/* ================= 1. search the Pokédex ================= */
let dq='';
(function(){const g=$('#gens');const w=document.createElement('div');w.className='dsearch';
  w.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><input id="dexQ" type="search" inputmode="search" autocomplete="off" placeholder="Search by name or number" aria-label="Search the Pokédex"><button class="dsx" aria-label="Clear search" hidden>✕</button>`;
  g.parentNode.insertBefore(w,g);const inp=w.querySelector('input'),x=w.querySelector('.dsx');let tm=0;
  inp.addEventListener('input',()=>{clearTimeout(tm);tm=setTimeout(()=>{dq=inp.value.trim().toLowerCase();x.hidden=!dq;$('#v-dex').classList.toggle('searching',!!dq);renderGrid()},120)});
  inp.addEventListener('keydown',e=>{if(e.key==='Enter')inp.blur()});
  x.addEventListener('click',()=>{inp.value='';dq='';x.hidden=true;$('#v-dex').classList.remove('searching');renderGrid();inp.focus()})})();
const dqMatch=p=>{const q=dq.replace(/^#/,'');return /^\d+$/.test(q)?String(p.no).startsWith(String(+q))||p.no===+q:p.name.toLowerCase().includes(q)};
const _lfX=listFor;
listFor=function(){if(!dq)return _lfX();const g0=gen;gen=0;const L=_lfX();gen=g0;
  return L.filter(dqMatch).sort((a,b)=>{const q=dq.replace(/^#/,''),sa=a.name.toLowerCase().startsWith(q),sb=b.name.toLowerCase().startsWith(q);return sb-sa})};
const _rcX=renderCount;
renderCount=function(L){_rcX(L);if(dq){$('#genTitle').textContent=`Results for “${dq}”`;if(!L.length)$('#grid').innerHTML='<p class="hint">No Pokémon called that. Check the spelling, or try the first few letters.</p>'}};

/* ================= 2. hold a Pokémon for shortcuts ================= */
let holdT=0,holdEl=null,holdXY=null,holdFired=false;
document.addEventListener('pointerdown',e=>{const t=e.target.closest('#grid .tile,.opencard');if(!t||open||busy)return;holdEl=t;holdXY=[e.clientX,e.clientY];holdFired=false;
  clearTimeout(holdT);holdT=setTimeout(()=>{holdFired=true;openQuick(t)},460)});
document.addEventListener('pointermove',e=>{if(holdEl&&holdXY&&Math.hypot(e.clientX-holdXY[0],e.clientY-holdXY[1])>9){clearTimeout(holdT);holdEl=null}},{passive:true});
['pointerup','pointercancel'].forEach(k=>addEventListener(k,()=>{clearTimeout(holdT);holdEl=null},{passive:true,capture:true}));
addEventListener('scroll',()=>{clearTimeout(holdT);holdEl=null},{passive:true});
document.addEventListener('click',e=>{if(holdFired&&e.target.closest('#grid .tile,.opencard')){e.stopPropagation();e.preventDefault();holdFired=false}},true);
document.addEventListener('contextmenu',e=>{if(e.target.closest('#grid .tile,.opencard'))e.preventDefault()});
function famOf(no){if(typeof familyList!=='function')return null;return familyList().find(f=>f.members.includes(no))||null}
async function openQuick(t){const no=+t.dataset.no,p=byNo(no);if(!p)return;if(typeof buzz==='function')buzz(12);if(typeof sfx==='function')sfx('pop');
  const o=topCard(no),f=famOf(no),pinned=o&&hofIds().includes(o.id);
  const items=[o?['cards','🃏',`See my ${p.name} card${own[no].length>1?'s':''}`]:['cards','🔍','Look at its card'],
    o?['hof','🏆',pinned?'Take out of the Hall of Fame':'Put in my Hall of Fame']:['wish',wish[no]?'★':'☆',wish[no]?'Take off my wish list':'Add to my wish list'],
    f?['fam','🧬','Evolution family']:null,['cry','🔊','Hear its cry'],['map','🗺️',`Find it on the ${GENS[p.gen-1][1]} map`]].filter(Boolean);
  const ov=document.createElement('div');ov.className='qov';const c=tc(p.types[0]);
  ov.innerHTML=`<div class="qmenu" style="--c:${c[0]};--d:${c[1]}"><div class="qm-head"><img src="${ART(no)}" alt="" class="${o?'':'sil'}"><div><b>${o?esc(p.name):'???'}</b><span>${pad(no)}</span></div></div>
    ${items.map(([k,ic,l],i)=>`<button class="qm-b" data-q="${k}" style="--i:${i}"><span>${ic}</span>${esc(l)}</button>`).join('')}</div>`;
  document.body.appendChild(ov);const m=ov.querySelector('.qmenu'),r=t.getBoundingClientRect();
  const W=Math.min(280,innerWidth-32),H=m.offsetHeight;let x=Math.min(Math.max(16,r.left+r.width/2-W/2),innerWidth-16-W),y=r.bottom+8;if(y+H>innerHeight-100)y=Math.max(16,r.top-H-8);
  Object.assign(m.style,{left:x+'px',top:y+'px',width:W+'px'});m.style.setProperty('--ox',(r.left+r.width/2-x)+'px');m.style.setProperty('--oy',(y>r.top?-8:H+8)+'px');
  t.classList.add('held');void m.offsetWidth;ov.classList.add('on');
  const close=async()=>{ov.classList.remove('on');ov.classList.add('off');t.classList.remove('held');await wait(200);ov.remove()};
  ov.addEventListener('click',async e=>{const b=e.target.closest('.qm-b');await close();if(!b)return;const k=b.dataset.q;
    if(k==='cards')openTile(t);
    if(k==='wish'){if(wish[no])delete wish[no];else wish[no]=1;save();refreshTile(no);renderHome();toast(wish[no]?`${p.name} is on your wish list`:`${p.name} is off your wish list`)}
    if(k==='hof')toggleHof(o,p);
    if(k==='fam'&&typeof openFamily==='function')openFamily(f.root);
    if(k==='cry')cry(no,true);
    if(k==='map')openRegionMap(p.gen,no)})}

/* ================= 3. Pokémon cries + the dex voice ================= */
const CRY_OK=(()=>{try{return !!new Audio().canPlayType('audio/ogg; codecs="vorbis"')}catch(e){return false}})();
let cryAu=null;
function cry(no,asked){if(!soundOn&&!asked)return;if(!CRY_OK){if(asked)toast('This phone can\'t play Pokémon cries yet');return}
  try{if(cryAu)cryAu.pause();cryAu=new Audio(`https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${no}.ogg`);cryAu.volume=.45;cryAu.play().catch(()=>{})}catch(e){}}
const _openTileX=openTile;openTile=async function(el){const no=+el.dataset.no;setTimeout(()=>{if(open&&open.p.no===no)cry(no)},420);return _openTileX(el)};
if(typeof nextCard==='function'){const _nc=nextCard;nextCard=async function(d){await _nc(d);if(open)cry(open.p.no)}}
sayDex=function(p){if(!('speechSynthesis' in window)){toast('Reading aloud isn\'t available on this device');return}speechSynthesis.cancel();
  const vs=speechSynthesis.getVoices(),v=vs.find(v=>/en-GB/i.test(v.lang)&&/daniel|arthur|male/i.test(v.name))||vs.find(v=>/en-GB/i.test(v.lang))||vs.find(v=>/^en/i.test(v.lang));
  const say=(txt,o={})=>{const u=new SpeechSynthesisUtterance(txt);if(v)u.voice=v;u.rate=o.rate||.92;u.pitch=o.pitch||.72;speechSynthesis.speak(u);return u};
  say(`Pokédex entry ${p.no}.`,{rate:1,pitch:.6});say(`${p.name}. The ${p.types.map(t=>tc(t)[3]).join(' and ')} type Pokémon.`);
  const last=say(FLAV[p.no-1]||'');const b=$('#back .say');if(b){b.classList.add('speaking');last.onend=()=>b.classList.remove('speaking')}};

/* ================= 4. home: next goal, Pokémon of the day, recent pulls ================= */
(function(){const hb=$('#homeBody');hb.insertAdjacentHTML('afterbegin','<div id="goalCard"></div><div class="sec">Pokémon of the day</div><div id="potd"></div>');
  const l=$('#latest');l.previousElementSibling.innerHTML='Latest pulls <button class="sec-link" data-fn="openHall">Hall of Fame ›</button>';l.className='pulls'})();
const TIERS=[[.1,'Bronze'],[.5,'Silver'],[1,'Gold']];
function goalOf(){const A=albums(),all=[...A.set,...A.type,...A.gen,...A.mini].filter(a=>a.have>0&&a.p<1);let best=null;
  all.forEach(a=>{const t=TIERS.find(t=>a.p<t[0]);const need=Math.ceil(t[0]*a.tot-1e-9)-a.have;if(need>0&&(!best||need<best.need||(need===best.need&&a.p>best.a.p)))best={a,need,tier:t[1],goal:t[0]}});return best}
function goalWords(a,n){const id=a.id||'',k=id.split(':')[1];
  if(id.startsWith('type:'))return `${n} more ${T[k][3]} Pokémon`;if(id.startsWith('gen:'))return `${n} more ${GENS[+k-1][1]} Pokémon`;
  if(a.isSet)return `${n} more card${n>1?'s':''} from ${a.name}`;return `${n} more for “${a.name}”`}
function renderGoal(){const el=$('#goalCard');if(!el)return;const g=goalOf();if(!g){el.innerHTML='';return}const {a,need,tier}=g,c=tc(a.key);
  const sug=a.isSet?[]:a.all.filter(p=>!has(p.no)).sort(()=>0).slice(0,3);
  el.innerHTML=`<button class="goal" data-album="${a.id}" style="--c:${c[0]};--d:${c[1]};--p:${a.p};--g:${g.goal}">
    <span class="gl-k">Your next goal</span><span class="gl-t">${esc(goalWords(a,need))} for a <b class="tro ${tier.toLowerCase()}">${tier}</b> trophy</span>
    <span class="gl-bar"><i></i><em></em></span><span class="gl-s">${a.have} of ${a.tot}${sug.length?` · look out for ${sug.map(p=>esc(p.name)).join(', ')}`:''}</span>
    <span class="gl-arts">${sug.map(p=>`<img src="${ART(p.no)}" alt="" class="sil">`).join('')}</span></button>`}
function renderPotd(){const el=$('#potd');if(!el||!DEX.length)return;const p=DEX[hash(dayNo())%DEX.length],c=tc(p.types[0]),got=has(p.no);
  el.innerHTML=`<button class="potd opencard" data-no="${p.no}" style="--c:${c[0]};--d:${c[1]}"><span class="pd-bg"></span><img class="pd-art ${got?'':'sil'}" src="${ART(p.no)}" alt="">
    <span class="pd-tx"><span class="pd-no">${pad(p.no)} · ${p.types.map(t=>tc(t)[3]).join(' / ')}</span><b>${esc(p.name)}</b><span class="pd-f">${esc(FLAV[p.no-1]||'')}</span>
    <span class="pd-have ${got?'yes':''}">${got?'★ You have this one!':'Not caught yet. Keep an eye out!'}</span></span></button>`}
function renderPulls(){const el=$('#latest');if(!el)return;const L=[];for(const k in own)own[k].forEach(c=>{if(c.no===undefined||c.no==+k)L.push({...c,no:+k})});
  const seen=new Set();const top=L.sort((a,b)=>(b.date||'').localeCompare(a.date||'')).filter(c=>!seen.has(c.id)&&seen.add(c.id)).slice(0,10);
  el.innerHTML=top.map(c=>{const p=byNo(c.no),src=c.photo||c.img;return `<button class="pull opencard ${c.tier!=='c'?'shiny':''} ${c.tier==='u'?'ultra':''}" data-no="${c.no}" aria-label="${esc(p.name)}">
    ${src?`<img src="${src}" alt="" loading="lazy">`:`<span class="pl-art" style="--c:${tc(p.types[0])[0]}"><img src="${ART(c.no)}" alt=""></span>`}<i class="pl-shine"></i><span class="pl-n">${esc(p.name)}</span></button>`}).join('')}
const _rhX=renderHomeExtra;renderHomeExtra=function(A,xp,lv){_rhX(A,xp,lv);if($('#gens .rcard'))renderGens();renderGoal();renderPotd();renderPulls()};

/* ================= 5. Hall of Fame shelf ================= */
const hofIds=()=>Array.isArray(prof.hof)?prof.hof:(prof.hof=[]);
function toggleHof(o,p){const L=hofIds(),i=L.indexOf(o.id);if(i>=0){L.splice(i,1);toast(`${p.name} left the Hall of Fame`)}else{if(L.length>=9)L.shift();L.push(o.id);toast(`🏆 ${p.name} is in your Hall of Fame!`);if(typeof sfx==='function')sfx('bingo')}save2();if(typeof refreshSheet==='function'&&$('#sheet .hof'))refreshSheet()}
function hofAll(){const L=[],seen=new Set();for(const k in own)own[k].forEach(c=>{if(c.no!==undefined&&c.no!=+k)return;if(seen.has(c.id))return;seen.add(c.id);L.push({...c,no:+k})});return L}
function hofCards(){const L=hofAll(),pins=hofIds().map(id=>L.find(c=>c.id===id)).filter(Boolean);
  const rank={u:0,r:1,c:2};const rest=L.filter(c=>!pins.includes(c)).sort((a,b)=>rank[a.tier]-rank[b.tier]||(b.date||'').localeCompare(a.date||''));
  return {pins,best:rest.filter(c=>c.tier!=='c').slice(0,9-Math.min(pins.length,6)).concat(rest.filter(c=>c.tier==='c')).slice(0,Math.max(3,9-pins.length))}}
function hofCard(c,i,pin){const p=byNo(c.no),src=c.photo||c.imgL||c.img;
  return `<button class="hf-card opencard ${c.tier==='u'?'ultra':c.tier==='r'?'rare':''}" data-no="${c.no}" style="--i:${i}" aria-label="${esc(p.name)}">
    <span class="hf-frame">${src?`<img src="${src}" alt="">`:`<span class="pl-art" style="--c:${tc(p.types[0])[0]}"><img src="${ART(c.no)}" alt=""></span>`}<i class="hf-shine"></i></span>
    <span class="hf-plate">${pin?'📌 ':''}${esc(p.name)}<small>${esc(c.set||'')}${c.tier!=='c'?' · '+tierName[c.tier]:''}</small></span></button>`}
function shelves(list,pin,off=0){const rows=[];for(let i=0;i<list.length;i+=3)rows.push(list.slice(i,i+3));
  return rows.map((r,ri)=>`<div class="hf-shelf">${r.map((c,i)=>hofCard(c,off+ri*3+i,pin)).join('')}<span class="hf-wood"></span></div>`).join('')}
function openHall(){if(typeof askTilt==='function')askTilt();openSheet('Hall of Fame',body=>{const {pins,best}=hofCards();
  if(!pins.length&&!best.length){body.innerHTML='<div class="hof"><p class="hint">Your Hall of Fame fills up as you collect. Add your first card!</p></div>';return}
  body.innerHTML=`<div class="hof"><div class="hf-lights"><i></i><i></i><i></i></div>
    <div class="mask"><span class="hf-title">${esc((prof.name||'My').trim())}${prof.name?"'s":''} best cards</span></div>
    ${pins.length?`<div class="sec">Pinned by me</div>${shelves(pins,true)}`:''}
    ${best.length?`<div class="sec">${pins.length?'Rarest of the rest':'My rarest cards'}</div>${shelves(best,false,pins.length)}`:''}
    <p class="hint">Tip: press and hold any Pokémon you own in your Pokédex to pin it here. ${CRY_OK?'':''}</p></div>`})}
function hofTilt(x,y){const h=$('#sheet .hof');if(h){h.style.setProperty('--tx',x);h.style.setProperty('--ty',y)}}
addEventListener('deviceorientation',e=>{if(!$('#sheet .hof'))return;hofTilt(Math.max(-1,Math.min(1,(e.gamma||0)/25)),Math.max(-1,Math.min(1,((e.beta||0)-40)/25)))});
addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||!$('#sheet .hof'))return;hofTilt(e.clientX/innerWidth*2-1,e.clientY/innerHeight*2-1)},{passive:true});

/* ================= 6. living region maps ================= */
const AREA_NM={fire:'Ember Peak',water:'Tide Bay',grass:'Leafy Woods',electric:'Spark Plains',psychic:'Mystic Ruins',ghost:'Haunted Tower',fighting:'Dojo Hills',rock:'Boulder Pass',
  normal:'Meadow Town',fairy:'Fairy Glade',dragon:'Dragon Den',poison:'Murky Marsh',flying:'Windy Cliffs',ground:'Dusty Canyon',bug:'Buzzing Forest',steel:'Iron Works',dark:'Shadow Cave',ice:'Frost Lake'};
function regionAreas(g){const L=DEX.filter(p=>p.gen===g).sort((a,b)=>a.no-b.no),n=Math.max(7,Math.min(14,Math.round(L.length/11))),sz=Math.ceil(L.length/n),areas=[],used={};
  for(let i=0;i<L.length;i+=sz){const ms=L.slice(i,i+sz),cnt={};ms.forEach(p=>p.types.forEach((t,j)=>cnt[t]=(cnt[t]||0)+(j?1:2)));
    const key=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]).find(k=>!used[k])||Object.keys(cnt)[0];used[key]=(used[key]||0)+1;
    const have=ms.filter(p=>has(p.no)).length;areas.push({key,name:AREA_NM[key]+(used[key]>1?' '+'II III IV'.split(' ')[used[key]-2]:''),ms,have,p:have/ms.length})}
  return areas}
function hexSpots(n,seed){const all=[];for(let q=-4;q<=4;q++)for(let r=-4;r<=4;r++){const d=(Math.abs(q)+Math.abs(r)+Math.abs(q+r))/2;if(d<=4)all.push([q,r,d])}
  // grow an island outward from the centre, with a seeded wobble so each region has its own coastline
  all.sort((a,b)=>(a[2]+(hash(seed*97+(a[0]+5)*11+(a[1]+5))%100)/90)-(b[2]+(hash(seed*97+(b[0]+5)*11+(b[1]+5))%100)/90));
  return all.slice(0,n).map(([q,r])=>[q,r])}
function hexPath(cx,cy,R){let d='';for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-30),x=cx+R*Math.cos(a),y=cy+R*Math.sin(a);d+=(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)}return d+'Z'}
let mapState={g:1,sel:-1};
function openRegionMap(g,focusNo){g=g||1;const areas0=regionAreas(g);mapState={g,sel:focusNo?areas0.findIndex(a=>a.ms.some(p=>p.no===focusNo)):-1};
  const replace=!!$('#sheet .rmap');openSheet(`${GENS[g-1][1]} map`,body=>drawMap(body),{replace})}
function drawMap(body){const {g}=mapState,areas=regionAreas(g),spots=hexSpots(areas.length,g),R=34,W=360;
  const pts=spots.map(([q,r])=>({x:R*Math.sqrt(3)*(q+r/2),y:R*1.5*r}));const minX=Math.min(...pts.map(p=>p.x)),maxX=Math.max(...pts.map(p=>p.x)),minY=Math.min(...pts.map(p=>p.y)),maxY=Math.max(...pts.map(p=>p.y));
  const vw=maxX-minX+R*2.6,vh=maxY-minY+R*2.6,ox=-minX+R*1.3,oy=-minY+R*1.3;const done=areas.filter(a=>a.p>=1).length,h=areas.reduce((s,a)=>s+a.have,0),tot=areas.reduce((s,a)=>s+a.ms.length,0);
  const lit=a=>a.p>=1?1:a.p>0?.35+.5*a.p:0;
  body.innerHTML=`<div class="rmap"><div class="rm-tabs">${GENS.map(([n,r])=>`<button class="rm-t" data-mg="${n}" aria-pressed="${n===g}">${r}</button>`).join('')}</div>
   <p class="rm-sum"><b>${h}</b> of ${tot} Pokémon found · <b>${done}</b> of ${areas.length} areas lit up</p>
   <div class="rm-sea"><svg viewBox="0 0 ${vw.toFixed(0)} ${vh.toFixed(0)}" role="img" aria-label="${GENS[g-1][1]} map">
    <defs><filter id="rmGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter></defs>
    ${areas.map((a,i)=>{const c=tc(a.key),x=pts[i].x+ox,y=pts[i].y+oy,L=lit(a);return `<g class="rm-a ${a.p>=1?'full':''} ${a.have?'on':''} ${i===mapState.sel?'sel':''}" data-ai="${i}" style="--i:${i};--c:${c[0]};--d:${c[1]};transform-origin:${x.toFixed(1)}px ${y.toFixed(1)}px">
      ${a.have?`<path class="rm-glow" d="${hexPath(x,y,R-2)}" fill="${c[0]}" opacity="${(L*.7).toFixed(2)}" filter="url(#rmGlow)"/>`:''}
      <path class="rm-land" d="${hexPath(x,y,R-2.5)}" style="fill:color-mix(in oklab, ${c[0]} ${Math.round(L*100)}%, #1c2131)"/>
      <path d="${hexPath(x,y,R-2.5)}" fill="none" stroke="${a.have?c[0]:'#2e3550'}" stroke-width="1.5" opacity=".9"/>
      <text x="${x.toFixed(1)}" y="${(y-4).toFixed(1)}" text-anchor="middle" font-size="17">${a.p>=1?'⭐':(typeof TYPE_IC!=='undefined'?TYPE_IC[a.key]:'•')}</text>
      <text x="${x.toFixed(1)}" y="${(y+15).toFixed(1)}" text-anchor="middle" class="rm-f">${a.have}/${a.ms.length}</text></g>`}).join('')}
   </svg></div><div class="rm-area" id="rmArea"></div></div>`;
  const showArea=i=>{mapState.sel=i;body.querySelectorAll('.rm-a').forEach(n=>n.classList.toggle('sel',+n.dataset.ai===i));const a=areas[i],box=body.querySelector('#rmArea');if(!a){box.innerHTML='<p class="hint">Tap an area of the map to see who lives there. Areas light up as you catch their Pokémon.</p>';return}const c=tc(a.key);
    box.innerHTML=`<div class="rm-head" style="--c:${c[0]}"><b>${esc(a.name)}</b><span>${a.have} of ${a.ms.length} found${a.p>=1?' · fully lit! ⭐':''}</span></div>
     <div class="rm-mons">${a.ms.map(p=>`<button class="rm-m opencard" data-no="${p.no}"><img class="${has(p.no)?'':'sil'}" src="${ART(p.no)}" alt="" loading="lazy"><span>${has(p.no)?esc(p.name):pad(p.no)}</span></button>`).join('')}</div>`;
    box.classList.remove('rise');void box.offsetWidth;box.classList.add('rise')};
  body.querySelector('.rm-sea').addEventListener('click',e=>{const a=e.target.closest('.rm-a');if(a){if(typeof sfx==='function')sfx('tap');showArea(+a.dataset.ai)}});
  body.querySelector('.rm-tabs').addEventListener('click',e=>{const b=e.target.closest('.rm-t');if(!b||+b.dataset.mg===mapState.g)return;mapState={g:+b.dataset.mg,sel:-1};drawMap(body);riseIn(body)});
  showArea(mapState.sel);requestAnimationFrame(()=>{const t=body.querySelector('.rm-t[aria-pressed="true"]');if(t)t.parentElement.scrollLeft=t.offsetLeft-60})}

/* entry points: a Map button in the Pokédex, and Hall of Fame + Maps on the Trainer page */
(function(){const rc=$('#v-dex .rowctl');const b=document.createElement('button');b.className='mapbtn';b.innerHTML='🗺️ Map';b.setAttribute('aria-label','Open the region map');
  b.addEventListener('click',()=>openRegionMap(gen||1));rc.insertBefore(b,$('#sort'))})();
if(typeof renderTrainer==='function'){const _rtX=renderTrainer;renderTrainer=function(){_rtX();const g=$('#trainerBody .play-grid');if(g&&!g.querySelector('.pc-hof'))g.insertAdjacentHTML('beforeend',
  `<button class="pcard pc-hof" data-fn="openHall"><b>Hall of Fame</b><span>My best cards on show</span></button><button class="pcard pc-map" data-fn="openMaps"><b>Region maps</b><span>Light up every area</span></button>`)}}
function openMaps(){openRegionMap(gen||1)}
if(typeof cur!=='undefined'&&cur===4&&typeof renderTrainer==='function')renderTrainer();
