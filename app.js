'use strict';
/* =====================================================================
   Pokédex — a private family app for real Pokémon trading cards.
   Motion follows the MeFit house rules: one object on one journey, no fades
   (mask wipes, scale-from-a-point), three house curves, springs set by
   duration T and bounce b, idle loops on one 4.8 s master clock.
   ===================================================================== */

/* ---------- house motion maths ---------- */
// Spring by duration T and bounce b, mass 1: k=(2π/T)², c=4π(1−b)/T  →  ω0=2π/T, ζ=1−b
function springX(t,T,b){const w=2*Math.PI/T,z=1-b;if(t<=0)return 0;
  if(z>=1)return 1-Math.exp(-w*t)*(1+w*t);
  const wd=w*Math.sqrt(1-z*z);return 1-Math.exp(-z*w*t)*(Math.cos(wd*t)+(z*w/wd)*Math.sin(wd*t));}
// k,c form (SNAP k520 c36): ω0=√k, ζ=c/(2√k), T=2π/ω0, b=1−ζ
const fromKC=(k,c)=>{const w=Math.sqrt(k);return {T:2*Math.PI/w,b:1-c/(2*w)}};
const SP={lift:{T:.5,b:.15},drop:{T:.45,b:.1},settle:{T:.6,b:0},snap:fromKC(520,36),pop:fromKC(360,25)};
// sample a spring into CSS linear(); duration = 1.25T (residual < 2%)
function toLinear(s){const D=1.25*s.T,n=40,pts=[];for(let i=0;i<=n;i++){const x=i===n?1:springX(D*i/n,s.T,s.b);pts.push(+x.toFixed(4))}return {css:`linear(${pts.join(',')})`,ms:Math.round(D*1000)}}
(function(){const r=document.documentElement.style;if(!CSS.supports('transition-timing-function','linear(0,1)'))return;
  for(const k of ['lift','drop','snap']){const l=toLinear(SP[k]);r.setProperty(`--sp-${k}`,l.css);r.setProperty(`--sp-${k}-ms`,l.ms+'ms')}})();
// cubic-bezier solver for the three house curves
function bez(x1,y1,x2,y2){const cx=3*x1,bx=3*(x2-x1)-cx,ax=1-cx-bx,cy=3*y1,by=3*(y2-y1)-cy,ay=1-cy-by;
  const sx=t=>((ax*t+bx)*t+cx)*t,sy=t=>((ay*t+by)*t+cy)*t,dx=t=>(3*ax*t+2*bx)*t+cx;
  return x=>{if(x<=0)return 0;if(x>=1)return 1;let t=x;for(let i=0;i<8;i++){const e=sx(t)-x,d=dx(t);if(Math.abs(e)<1e-5||!d)break;t-=e/d}
    t=Math.min(1,Math.max(0,t));return sy(t)}}
const GLIDE=bez(.05,.7,.1,1),HAND=bez(.2,0,0,1);
const lerp=(a,b,p)=>a+(b-a)*p, clamp01=x=>Math.max(0,Math.min(1,x));
// arc: quadratic Bézier, control point offset 18–22% of distance, perpendicular to travel
function arcPoint(a,b,p,k=.2){const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
  const cx=mx+(-dy/len)*len*k,cy=my+(dx/len)*len*k,q=1-p;return {x:q*q*a.x+2*q*p*cx+p*p*b.x,y:q*q*a.y+2*q*p*cy+p*p*b.y}}
// anticipation: 6% counter-move shaped sin² over the first 20% of the move
const antic=u=>u<.2?-.06*Math.sin(Math.PI*u/.2)**2:0;
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
function play(dur,fn){return new Promise(res=>{if(RM){fn(dur);res();return}const t0=performance.now();
  (function f(now){const t=Math.min(dur,now-t0);fn(t);t<dur?requestAnimationFrame(f):res()})(t0)})}
const wait=ms=>new Promise(r=>setTimeout(r,RM?0:ms));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- reference data ---------- */
const T={fire:['#ff7a3d','#5a1d0a','embers','Fire'],water:['#3fa8ff','#0b2a52','ripples','Water'],grass:['#4fd16b','#0f3b1b','leaves','Grass'],
 electric:['#ffd23f','#4a3a05','sparks','Electric'],psychic:['#ff5fa8','#4a0f30','rings','Psychic'],ghost:['#9b7bff','#1f1446','fog','Ghost'],
 fighting:['#e0603a','#44160a','impact','Fighting'],rock:['#c8a56a','#3a2c12','rock','Rock'],normal:['#c9c3b5','#2e2c27','dust','Normal'],
 fairy:['#ffa8e0','#45203a','stars','Fairy'],dragon:['#7b8cff','#141d4d','scales','Dragon'],poison:['#c063ff','#300f45','bubbles','Poison'],
 flying:['#9fc3ff','#1b2a48','wind','Flying'],ground:['#d9a95b','#3d2a0e','dust','Ground'],bug:['#a8c93a','#2c370b','leaves','Bug'],
 steel:['#b7c4d6','#263040','sheen','Steel'],dark:['#8a76a0','#17121e','shadow','Dark'],ice:['#8fe6ff','#123a4a','frost','Ice']};
const GENS=[[1,'Kanto'],[2,'Johto'],[3,'Hoenn'],[4,'Sinnoh'],[5,'Unova'],[6,'Kalos'],[7,'Alola'],[8,'Galar'],[9,'Paldea']];
const ART=no=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${no}.png`;
const TCG='https://api.pokemontcg.io/v2/cards';
let DEX=[],kids={},FLAV=[];
const byNo=i=>DEX[i-1];
function evoLine(p){let r=p;while(r.from)r=byNo(r.from);const line=[r.name];let c=r.no;
  while(kids[c]){const k=kids[c];if(k.length>2){line.push(`${k.length} different evolutions`);break}line.push(k.map(n=>byNo(n).name).join(' or '));c=k[0]}
  return line.length>1?line.join(' → '):'Does not evolve'}

/* ---------- the collection (this device only) ----------
   own = { [pokedexNo]: [ {id,name,number,set,setId,total,rarity,tier,img,imgL,date,photo?} , ...] }
   fav = { [pokedexNo]: index of the card shown on the front }                                   */
const KEY='pokedex.v1';
let own={},fav={},wish={};
function load(){try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');own=s.own||{};fav=s.fav||{};wish=s.wish||{}}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify({own,fav,wish}))}catch(e){toast(e&&e.name==='QuotaExceededError'?'Storage is full. Save a backup, then use fewer photos.':'Could not save on this device')}}
const has=n=>!!(own[n]&&own[n].length);
const XT={};const tc=t=>T[t]||XT[t]||T.normal;
const pad=n=>'#'+String(n).padStart(4,'0');
// rarity → tier: c common, r rare, u ultra (special art, secret, hyper…)
function tierOf(r){r=r||'';if(/secret|ultra|illustration|hyper|rainbow|shiny|amazing|special|radiant|gold|crown/i.test(r))return 'u';if(/rare|holo|ace spec|double/i.test(r))return 'r';return 'c'}
const tierName={c:'Common',r:'Rare',u:'Ultra rare'};

/* ---------- XP: new Pokémon 100 · duplicate 20 · rare +150 · ultra +400 · photo +25 · album done +500 ---------- */
function xpOf(A){let x=0;for(const n in own){own[n].forEach((c,i)=>{x+=(i===0?100:20)+(c.tier==='r'?150:c.tier==='u'?400:0)+(c.photo?25:0)})}
  if(A)x+=[...A.gen,...A.type,...A.mini,...A.set].filter(a=>a.p>=1).length*500;
  if(typeof packXP==='function')x+=packXP();return x}
const LV=500; // XP per level

/* ---------- albums ---------- */
const STARTERS=[1,4,7,152,155,158,252,255,258,387,390,393,495,498,501,650,653,656,722,725,728,810,813,816,906,909,912];
const EEVEE=[133,134,135,136,196,197,470,471,700];
const GENKEY=['grass','water','fire','psychic','electric','fairy','dark','steel','ghost'];
function albums(){const score=(name,key,all)=>{const h=all.filter(p=>has(p.no)).length;return {name,key,all,have:h,tot:all.length,p:all.length?h/all.length:0}};
  const gen=GENS.map(([g,r],i)=>({...score(`Gen ${g} · ${r}`,GENKEY[i],DEX.filter(p=>p.gen===g)),id:'gen:'+g}));
  const type=Object.keys(T).map(k=>({...score(`${T[k][3]} album`,k,DEX.filter(p=>p.types.includes(k))),id:'type:'+k}));
  const mini=[score('Every starter Pokémon','fire',STARTERS.map(byNo)),score('All the Eeveelutions','normal',EEVEE.map(byNo)),
    score('Legendary Pokémon','dragon',DEX.filter(p=>p.leg)),score('Mythical Pokémon','psychic',DEX.filter(p=>p.myth)),
    score('Heavier than a car (over 1,000 kg)','steel',DEX.filter(p=>p.wt>=1000)),score('Tiny ones (under 30 cm)','bug',DEX.filter(p=>p.ht<0.3))].map((a,i)=>({...a,id:'mini:'+i}));
  // card sets he has started: progress = distinct card numbers owned ÷ printed total
  const sets={};for(const n in own)own[n].forEach(c=>{if(!c.setId)return;const s=sets[c.setId]||(sets[c.setId]={name:c.set,total:c.total||0,nums:new Set()});s.nums.add(c.number)});
  const set=Object.entries(sets).filter(([,s])=>s.total).map(([sid,s])=>({id:'set:'+sid,setId:sid,name:s.name,key:(typeof setKey==='function'?setKey(sid):'water'),all:[],have:Math.min(s.nums.size,s.total),tot:s.total,p:Math.min(1,s.nums.size/s.total),isSet:true})).sort((a,b)=>b.p-a.p);
  return {gen,type,mini,set}}
const tier=p=>p>=1?'gold':p>=.5?'silver':p>=.1?'bronze':'none';
const tierLabel={gold:'Gold',silver:'Silver',bronze:'Bronze',none:'Locked'};
function albumRow(a){const c=tc(a.key);const miss=a.isSet?[]:a.all.filter(p=>!has(p.no)).map(p=>p.name);
  return `<button class="album" data-album="${a.id}" style="--p:${a.p}"><div class="ic fill ${a.id.startsWith('gen:')?'region r'+a.id.slice(4):''}" style="--c:${c[0]};--d:${c[1]};background:radial-gradient(circle at 50% 40%,${c[0]},${c[1]} 80%)"><div class="fx fx-${c[2]}"></div>${a.isSet?`<img class="setlogo" src="https://images.pokemontcg.io/${esc(a.setId)}/symbol.png" alt="" loading="lazy" onerror="this.remove()">`:''}</div>
  <div class="tx"><div class="t1">${esc(a.name)}</div><div class="t2">${a.have} of ${a.tot}${miss.length&&miss.length<=2?' · needs '+miss.map(esc).join(' and '):''}</div>
  <div class="bar" style="--c:${c[0]}"><i style="--p:${Math.max(a.p,.015)}"></i></div></div><span class="tro ${tier(a.p)}">${tierLabel[tier(a.p)]}</span></button>`}
// trainer title: best type album with at least 3
function titleOf(A){const best=[...A.type].sort((a,b)=>b.have-a.have)[0];if(!best||best.have<3)return 'Pokémon Trainer';
  const n={fire:'Fire Specialist',water:'Water Champion',grass:'Grass Ranger',electric:'Thunder Tamer',psychic:'Mind Master',ghost:'Ghost Whisperer',fighting:'Black Belt',rock:'Rock Hound',
   normal:'Everyday Hero',fairy:'Fairy Friend',dragon:'Dragon Tamer',poison:'Toxic Expert',flying:'Sky Rider',ground:'Earth Shaker',bug:'Bug Catcher',steel:'Steel Smith',dark:'Shadow Hunter',ice:'Ice Skater'};
  return n[best.key]||'Pokémon Trainer'}

/* ---------- renderers ---------- */
const $=s=>document.querySelector(s);
function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;t.classList.remove('in');void t.offsetWidth;t.classList.add('in');clearTimeout(toast.h);toast.h=setTimeout(()=>{t.hidden=true},2800)}
function renderHome(){const A=albums(),xp=xpOf(A),lv=Math.floor(xp/LV)+1,into=xp%LV,n=Object.keys(own).filter(has).length;
  $('#lvlChip').innerHTML=`Level <b>${lv}</b>`;$('#xpbar').style.setProperty('--p',into/LV);
  $('#xpl1').textContent=`${xp.toLocaleString()} XP`;$('#xpl2').textContent=`${LV-into} XP to level ${lv+1}`;
  $('#sCaught').textContent=n;$('#sCards').textContent=Object.values(own).reduce((s,a)=>s+a.length,0);
  const all=[...A.gen,...A.type,...A.mini,...A.set];$('#sTro').textContent=all.filter(a=>a.p>=.1).length;
  $('#ttitle').textContent=n?titleOf(A):'Tap your name to change it';
  $('#homeEmpty').hidden=n>0;$('#homeBody').hidden=n===0;
  $('#near').innerHTML=all.filter(a=>a.p<1&&a.have>0).sort((a,b)=>(a.tot-a.have)-(b.tot-b.have)||b.p-a.p).slice(0,3).map(albumRow).join('');
  const recent=[];for(const k in own)own[k].forEach(c=>recent.push([c.date||'',+k]));recent.sort((a,b)=>b[0].localeCompare(a[0]));
  $('#latest').innerHTML=[...new Set(recent.map(r=>r[1]))].slice(0,8).map(n=>{const p=byNo(n),c=tc(p.types[0]);return `<button class="mini opencard" data-no="${n}" style="--c:${c[0]};--d:${c[1]}"><img src="${ART(n)}" alt="" loading="lazy">${esc(p.name)}</button>`}).join('');
  $('#setAlb').innerHTML=A.set.length?A.set.map(albumRow).join(''):'<p class="hint">Sets appear here as soon as you add your first card.</p>';
  $('#genAlb').innerHTML=A.gen.map(albumRow).join('');$('#typeAlb').innerHTML=A.type.sort((a,b)=>b.p-a.p).map(albumRow).join('');$('#miniAlb').innerHTML=A.mini.map(albumRow).join('');
  if(typeof renderHomeExtra==='function')renderHomeExtra(A,xp,lv)}

let gen=1,filt='all',sortBy='no';
const FILTERS=[['all','All'],['caught','Caught'],['missing','Missing'],['wish','Wish list'],...Object.keys(T).map(k=>[k,T[k][3]])];
function renderGens(){$('#gens').innerHTML=[...GENS.map(([g,r])=>[g,`Gen ${g} ${r}`]),[0,'All 1,025']].map(([g,l])=>`<button class="chip gen" data-g="${g}" aria-pressed="${gen===g}">${l}</button>`).join('')}
function renderFilters(){$('#filters').innerHTML=FILTERS.map(([k,l])=>`<button class="chip" data-f="${k}" aria-pressed="${filt===k}" ${T[k]?`style="--c:${T[k][0]}"`:''}>${T[k]?'<span class="dot"></span>':''}${l}</button>`).join('')}
function topCard(n){const a=own[n];if(!a||!a.length)return null;return a[Math.min(fav[n]||0,a.length-1)]}
function tileHTML(p){const c=tc(p.types[0]),d=tc(p.types[1]||p.types[0]),o=topCard(p.no),cnt=own[p.no]?.length||0,rare=o&&o.tier!=='c';
  return `<button class="tile ${o?'':'missing'} ${rare?'holo':''} ${o&&o.tier==='u'?'foil':''}" data-no="${p.no}" style="--c:${c[0]};--d:${c[1]}" aria-label="${o?esc(p.name):'Not caught yet, number '+p.no}">
   ${o?`<div class="fx fx-${c[2]}"></div>`:''}${o&&p.types[1]?`<div class="fx" style="clip-path:polygon(100% 0,100% 100%,0 100%);background:radial-gradient(circle at 50% 38%, ${d[0]}aa, ${d[1]}cc 72%)"></div>`:''}
   <span class="no">${pad(p.no)}</span><img class="art" src="${ART(p.no)}" alt="" loading="lazy" decoding="async">
   ${cnt>1?`<span class="count-tag">×${cnt}</span>`:rare?`<span class="rare-tag">${o.tier==='u'?'ULTRA':'RARE'}</span>`:''}${wish[p.no]&&!o?'<span class="wish-tag">★</span>':''}<span class="nm">${o?esc(p.name):'???'}</span></button>`}
function listFor(){let L=DEX.filter(p=>(!gen||p.gen===gen)&&(filt==='all'||(filt==='caught'?has(p.no):filt==='missing'?!has(p.no):filt==='wish'?!!wish[p.no]:p.types.includes(filt))));
  const last=n=>(own[n]||[]).reduce((m,c)=>c.date>m?c.date:m,'');
  const s={no:(a,b)=>a.no-b.no,atk:(a,b)=>b.atk-a.atk,hp:(a,b)=>b.hp-a.hp,az:(a,b)=>a.name.localeCompare(b.name),new:(a,b)=>last(b.no).localeCompare(last(a.no))||a.no-b.no}[sortBy];
  return L.sort(s)}
function renderCount(L){const h=L.filter(p=>has(p.no)).length;$('#count').innerHTML=`<b>${h}</b> of ${L.length} caught`;
  const g=GENS.find(x=>x[0]===gen);$('#genTitle').textContent=g?`Generation ${g[0]} · ${g[1]}`:'Every generation'}
function renderGrid(){const L=listFor();$('#grid').innerHTML=L.map(tileHTML).join('')||'<p class="hint">Nothing here yet.</p>';renderCount(L)}
// FLIP regrid for small grids; big grids wipe behind a mask so 150+ tiles never pop
async function regrid(big){const g=$('#grid');const L=listFor();
  if(RM){renderGrid();return}
  if(big||L.length>60||g.children.length>60){g.style.transition='clip-path 200ms var(--exit)';g.style.clipPath='inset(0 0 100% 0)';await wait(200);
    renderGrid();g.style.transition='none';g.style.clipPath='inset(0 0 100% 0)';void g.offsetWidth;
    g.style.transition='clip-path var(--sp-lift-ms) var(--sp-lift)';g.style.clipPath='inset(0 0 0 0)';setTimeout(()=>{g.style.clipPath='';g.style.transition=''},700);return}
  const old=new Map([...g.children].map(el=>[el.dataset.no,el.getBoundingClientRect()])),keep=new Set(L.map(p=>String(p.no)));
  const leavers=[...g.children].filter(el=>!keep.has(el.dataset.no));
  if(leavers.length){leavers.forEach(el=>{el.style.transition=`transform 200ms var(--exit)`;el.style.transform='scale(0)'});await wait(200)}
  renderGrid();
  [...g.children].forEach((el,i)=>{if(!el.dataset.no)return;const o=old.get(el.dataset.no),n=el.getBoundingClientRect();
    el.style.transition='none';el.style.transform=o?`translate(${o.left-n.left}px,${o.top-n.top}px)`:'scale(0)';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{el.style.transition=`transform var(--sp-lift-ms) var(--sp-lift) ${Math.min(i,8)*50}ms`;el.style.transform=''}))});
  setTimeout(()=>[...g.children].forEach(el=>{el.style.transition=''}),900)}

/* ---------- finding the exact card (Pokémon TCG API) ---------- */
let found=[];
function parseQuery(q){q=q.trim();const m=q.match(/^#?\s*([A-Za-z]{0,4}\d{1,4}[A-Za-z]?)\s*\/\s*([A-Za-z]{0,4}\d{1,4})$/);
  if(m){const num=m[1].replace(/^0+(?=\d)/,'');const tot=m[2].replace(/^0+(?=\d)/,'');return {kind:'num',num,tot}}
  const n=parseInt(q.replace(/^#/,''),10);if(/^#?\d+$/.test(q)&&byNo(n))return {kind:'dex',no:n};
  const low=q.toLowerCase();const exact=DEX.find(p=>p.name.toLowerCase()===low);const p=exact||DEX.find(p=>p.name.toLowerCase().startsWith(low))||DEX.find(p=>p.name.toLowerCase().includes(low));
  return p?{kind:'dex',no:p.no}:{kind:'none'}}
// the card library can be slow to wake up: allow 30 s, and try a second time before giving up
async function tcg(q,tries=2){const url=`${TCG}?q=${encodeURIComponent(q)}&orderBy=-set.releaseDate&pageSize=60&select=id,name,number,rarity,images,set,nationalPokedexNumbers,supertype`;
  for(let i=1;;i++){const ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),30000);
    try{const r=await fetch(url,{signal:ctl.signal});if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();return (j.data||[]).filter(c=>c.supertype==='Pokémon'&&c.nationalPokedexNumbers?.length)}
    catch(e){if(i>=tries)throw e;$('#resTitle').textContent='Still looking… the card library is waking up'}
    finally{clearTimeout(to)}}}
function cardTile(c,i){const p=byNo(c.nationalPokedexNumbers[0]);const own1=has(p?.no);const t=tierOf(c.rarity);
  return `<button class="pick" data-i="${i}" aria-label="${esc(c.name)}, ${esc(c.set.name)} ${esc(c.number)}/${esc(c.set.printedTotal)}">
   <span class="pimg"><img src="${esc(c.images.small)}" alt="" loading="lazy" decoding="async"><span class="ball sm" aria-hidden="true"></span></span>
   <span class="pt1">${esc(c.name)}</span><span class="pt2">${esc(c.set.name)} · ${esc(c.number)}/${esc(c.set.printedTotal)}</span>
   <span class="rar ${t==='r'?'r':t==='u'?'u':''}">${esc(c.rarity||'Promo')}</span>${own1?'<span class="have">In your Pokédex</span>':''}</button>`}
async function find(qs){const q=parseQuery(qs),out=$('#results'),title=$('#resTitle');
  if(q.kind==='none'){title.hidden=true;out.innerHTML='<p class="hint">I couldn\'t find that. Type the number from the bottom corner, like <b>025/198</b>, or a Pokémon\'s name.</p>';return}
  title.hidden=false;title.textContent='Looking for your card…';out.innerHTML='<div class="loading"><span class="ball"></span></div>';
  try{found=q.kind==='num'?await tcg(`number:"${q.num}" set.printedTotal:${q.tot}`):await tcg(`nationalPokedexNumbers:${q.no}`);
    if(q.kind==='num'&&!found.length)found=await tcg(`number:"${q.num}" set.total:${q.tot}`);
    if(!found.length){title.textContent='No cards found';
      out.innerHTML=`<p class="hint">No card matches that. Check the number in the bottom corner, or type the Pokémon's name instead.</p>${q.kind==='dex'?manualHTML(q.no):''}`;return}
    title.textContent=q.kind==='num'?(found.length===1?'Is this your card?':'Which one is your card?'):`${byNo(q.no).name} cards · tap yours`;
    out.innerHTML=`<div class="picks">${found.map(cardTile).join('')}</div>${q.kind==='dex'?manualHTML(q.no):''}`}
  catch(e){title.textContent='The card library isn\'t answering';
    out.innerHTML=`<p class="hint">I couldn't reach the card library just now. Check the internet connection and try again${q.kind==='dex'?', or add it without the card picture':''}.</p>${q.kind==='dex'?manualHTML(q.no):''}`}}
function manualHTML(no){return `<button class="ghost manual" data-no="${no}">Add ${esc(byNo(no).name)} without the card picture</button>`}
$('#findForm').addEventListener('submit',e=>{e.preventDefault();const v=$('#search').value;if(v.trim())find(v);$('#search').blur()});
$('#results').addEventListener('click',e=>{const b=e.target.closest('.pick');if(b){const c=found[+b.dataset.i];catchCard(b,toEntry(c));return}
  const m=e.target.closest('.manual');if(m){const no=+m.dataset.no;catchCard(m,{id:'manual-'+no+'-'+Date.now(),name:byNo(no).name,no,number:'',set:'Added by hand',setId:'',total:0,rarity:'',tier:'c',img:'',imgL:'',date:new Date().toISOString()})}});
function toEntry(c){return {id:c.id,name:c.name,no:c.nationalPokedexNumbers[0],also:c.nationalPokedexNumbers.slice(1),number:c.number,set:c.set.name,setId:c.set.id,total:c.set.printedTotal,rarity:c.rarity||'',tier:tierOf(c.rarity),img:c.images.small,imgL:c.images.large||c.images.small,date:new Date().toISOString()}}

/* ---------- tabs: mask wipe + slide; old exits on Exit, new enters on LIFT 2 frames later ---------- */
const VIEWS=['#v-home','#v-dex','#v-add','#v-albums','#v-trainer'];let cur=0,busy=false;
const GLOWS=['#ff4656','#3fa8ff','#ff4656','#ffd23f','#b07cff'];
async function go(i){if(i===cur||busy)return;busy=true;const dir=i>cur?1:-1,o=$(VIEWS[cur]),n=$(VIEWS[i]);if(typeof onTab==='function')onTab(i,cur);
  document.querySelectorAll('.tab').forEach(t=>{if(+t.dataset.tab===i)t.setAttribute('aria-current','page');else t.removeAttribute('aria-current')});
  $('#app').style.setProperty('--glow',GLOWS[i]);
  if(RM){o.hidden=true;n.hidden=false;cur=i;busy=false;scrollTo(0,0);return}
  o.style.transition='clip-path 220ms var(--exit), transform 220ms var(--exit)';
  o.style.clipPath=dir>0?'inset(0 100% 0 0)':'inset(0 0 0 100%)';o.style.transform=`translateX(${-24*dir}px)`;
  n.hidden=false;n.style.transition='none';n.style.clipPath=dir>0?'inset(0 0 0 100%)':'inset(0 100% 0 0)';n.style.transform=`translateX(${24*dir}px)`;
  n.classList.remove('rise');void n.offsetWidth;
  await wait(33); // 2 frames
  n.classList.add('rise');n.style.transition='clip-path var(--sp-lift-ms) var(--sp-lift), transform var(--sp-lift-ms) var(--sp-lift)';n.style.clipPath='inset(0 0 0 0)';n.style.transform='';
  await wait(190);o.hidden=true;o.style.cssText='';scrollTo({top:0});cur=i;
  setTimeout(()=>{n.style.clipPath='';n.style.transition='';busy=false},450)}
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>go(+t.dataset.tab)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(+b.dataset.go)));

/* ---------- stage ---------- */
const stage=$('#stage'),hero=$('#hero'),flip=$('#flip'),front=$('#front'),back=$('#back'),words=$('#words'),done=$('#done'),r1=$('#ring1'),r2=$('#ring2');
// real trading cards are 63 × 88 mm → aspect 1.397
function cardRect(){const W=Math.min(300,innerWidth-64,(innerHeight-260)/1.397),H=W*1.397;return {x:innerWidth/2,y:Math.max(H/2+24,innerHeight*0.42),w:W,h:H}}
function setHero(x,y,w,h,rad,sc=1,rx=0,ry=0,sx=1,sy=1){hero.style.width=w+'px';hero.style.height=h+'px';hero.style.borderRadius=rad+'px';
  hero.style.transform=`translate(${x-w/2}px,${y-h/2}px) scale(${sc*sx},${sc*sy}) rotate(${rx}deg)`;flip.style.borderRadius=rad+'px';flip.style.transform=`rotateY(${ry}deg)`}
function frontHTML(p,o){const c=tc(p.types[0]);
  if(o&&o.photo)return `<img class="cardimg" src="${o.photo}" alt="Photo of the ${esc(p.name)} card">${o.tier!=='c'?'<div class="shine"></div>':''}`;
  if(o&&o.imgL)return `<img class="cardimg" src="${esc(o.imgL)}" alt="${esc(o.name)} card, ${esc(o.set)}">${o.tier!=='c'?'<div class="shine"></div>':''}`;
  return `${o?`<div class="fx fx-${c[2]}"></div>`:''}<span class="no">${pad(p.no)}</span><img class="bigart ${o?'':'sil'}" src="${ART(p.no)}" alt="">
   <span class="nm">${o?esc(p.name):'Who\'s that Pokémon?'}</span>`}
function backHTML(p){const list=own[p.no]||[],tp=p.types.map(t=>`<span class="tpill" style="--c:${tc(t)[0]}">${tc(t)[3]}</span>`).join('');
  if(!list.length)return `<div class="hp"><div class="typerow">${tp}</div><span>${pad(p.no)}</span></div><p class="bname">${esc(p.name)}</p><p style="margin:0;color:var(--muted)">Not caught yet. Find any ${esc(p.name)} card and add it to unlock its stats.</p><div class="evo">${esc(evoLine(p))}</div>
   <button class="ghost act" data-act="wish" data-no="${p.no}">${wish[p.no]?'★ On your wish list':'☆ Add to my wish list'}</button><button class="photo-btn act" data-act="findit" data-no="${p.no}">Find ${esc(p.name)} cards</button>`;
  const f=Math.min(fav[p.no]||0,list.length-1),o=list[f];
  return `<div class="hp"><div class="typerow">${tp}</div><div style="text-align:right"><span>HP</span> <b>${p.hp}</b></div></div><p class="bname">${esc(p.name)} <span>${pad(p.no)}</span></p>
  <p class="flav">${esc(FLAV[p.no-1]||'')}</p><button class="ghost act say" data-act="say" data-no="${p.no}">🔊 Read it to me</button>
  <div class="atk"><span class="an">Attack power</span><span class="ad">${p.atk}</span></div>
  <div class="kv"><div><span>Height</span><b>${p.ht} m</b></div><div><span>Weight</span><b>${p.wt} kg</b></div></div>
  <div class="evo">${esc(evoLine(p))}${p.leg?' · Legendary':''}${p.myth?' · Mythical':''}</div>
  <div class="mycards"><div class="mch">My cards (${list.length})</div><div class="thumbs">${list.map((c,i)=>`<button class="thumb act ${i===f?'on':''}" data-act="fav" data-no="${p.no}" data-i="${i}" aria-label="${esc(c.set)} ${esc(c.number)}">${c.photo||c.img?`<img src="${c.photo||esc(c.img)}" alt="">`:`<span>${esc(c.set)}</span>`}</button>`).join('')}</div>
  <div class="cinfo">${esc(o.set)}${o.number?` · ${esc(o.number)}/${esc(o.total)}`:''} · ${esc(o.rarity||tierName[o.tier])}</div></div>
  <label class="ghost act-photo">${o.photo?'Change the photo of this card':'Use my own photo for this card'}<input type="file" accept="image/*" capture="environment" data-no="${p.no}" data-i="${f}"></label>`}
function paint(p){const o=topCard(p.no),c=tc(p.types[0]);hero.style.setProperty('--c',c[0]);hero.style.setProperty('--d',c[1]);
  front.className='face front'+(o?'':' missing')+(o&&(o.photo||o.imgL)?' has-photo':'');front.style.transform='';front.innerHTML=frontHTML(p,o);back.innerHTML=backHTML(p)}

/* ---------- tap a tile: it travels on an arc to centre, then flips (one object) ---------- */
let open=null;
async function openTile(el){if(open||busy)return;busy=true;const p=byNo(+el.dataset.no),r=el.getBoundingClientRect(),C=cardRect();
  const a={x:r.left+r.width/2,y:r.top+r.height/2};open={el,p,a,w:r.width,h:r.height};
  paint(p);stage.style.setProperty('--ox',a.x+'px');stage.style.setProperty('--oy',a.y+'px');
  hero.hidden=false;el.style.visibility='hidden';setHero(a.x,a.y,r.width,r.height,16);stage.classList.add('on');
  const D=700,F0=260,flipTo=has(p.no)?0:180; // owned: land face-up showing the real card; missing: flip to the info side
  await play(D+380,t=>{const s=t/1000,u=clamp01(t/D),p1=springX(s,SP.lift.T,SP.lift.b)+antic(u)*(1-u);
    const pt=arcPoint(a,C,clamp01(p1),.18);setHero(pt.x,pt.y,lerp(r.width,C.w,p1),lerp(r.height,C.h,p1),lerp(16,14,clamp01(p1)),1,0,flipTo*springX(Math.max(0,s-F0/1000),SP.settle.T,0))});
  open.side=flipTo;const h=$('#closeHint');h.textContent='Tap the card to turn it over · tap outside to put it back';h.hidden=false;busy=false}
async function turnCard(){if(!open||busy)return;busy=true;const C=cardRect(),from=open.side,to=from?0:180;
  await play(560,t=>{setHero(C.x,C.y,C.w,C.h,14,1,0,lerp(from,to,springX(t/1000,SP.settle.T,0)))});open.side=to;busy=false}
async function closeTile(){if(!open||busy)return;busy=true;$('#closeHint').hidden=true;const {a,w,h,side,p}=open,C=cardRect();
  const el=open.el.isConnected?open.el:($(`.tile[data-no="${p.no}"]`)||open.el);stage.classList.remove('on');
  await play(620,t=>{const u=t/620,e=HAND(u),fl=1-HAND(clamp01(u/0.7));const pt=arcPoint(C,a,e,-.18);setHero(pt.x,pt.y,lerp(C.w,w,e),lerp(C.h,h,e),lerp(14,16,e),1,0,side*fl)});
  el.style.visibility='';hero.hidden=true;open=null;busy=false}
document.addEventListener('click',e=>{if(e.target.closest('#stage'))return;const t=e.target.closest('.tile,.opencard');if(t&&t.dataset.no)openTile(t)});
stage.addEventListener('click',e=>{if(!open||e.target===done)return;const act=e.target.closest('.act');
  if(act){const no=+act.dataset.no;
    if(act.dataset.act==='wish'){if(wish[no])delete wish[no];else wish[no]=1;save();act.textContent=wish[no]?'★ On your wish list':'☆ Add to my wish list';refreshTile(no);return}
    if(act.dataset.act==='fav'){fav[no]=+act.dataset.i;save();paint(byNo(no));refreshTile(no);turnCard();return}
    if(act.dataset.act==='say'){sayDex(byNo(no));return}
    if(act.dataset.act==='findit'){closeTile().then(()=>{go(2).then(()=>{$('#search').value=byNo(no).name;find(byNo(no).name)})});return}}
  if(e.target.closest('.act-photo,input'))return;if(e.target.closest('#hero'))turnCard();else closeTile()});
hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();hero.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');hero.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%')});
function refreshTile(no){document.querySelectorAll(`.tile[data-no="${no}"]`).forEach(el=>{const tmp=document.createElement('div');tmp.innerHTML=tileHTML(byNo(no)).trim();const nu=tmp.firstChild;nu.style.visibility=el.style.visibility;el.replaceWith(nu);if(open&&open.el===el)open.el=nu})}
$('#filters').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;filt=b.dataset.f;document.querySelectorAll('#filters .chip').forEach(c=>c.setAttribute('aria-pressed',c===b));regrid()});
$('#gens').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;gen=+b.dataset.g;document.querySelectorAll('#gens .chip').forEach(c=>c.setAttribute('aria-pressed',c===b));regrid(true)});
$('#sort').addEventListener('change',e=>{sortBy=e.target.value;regrid()});

/* ---------- own photo of a card: downscale to 420 px wide JPEG ---------- */
stage.addEventListener('change',e=>{const inp=e.target;if(!inp.matches('input[type=file]')||!inp.files[0])return;const no=+inp.dataset.no,i=+inp.dataset.i;
  const img=new Image();img.onload=async()=>{const W=420,H=Math.round(W*1.397),cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');
    const s=Math.max(W/img.width,H/img.height);g.drawImage(img,(W-img.width*s)/2,(H-img.height*s)/2,img.width*s,img.height*s);
    own[no][i].photo=cv.toDataURL('image/jpeg',.72);URL.revokeObjectURL(img.src);save();refreshTile(no);renderHome();
    paint(byNo(no));await turnCard();toast('Photo added · +25 XP')};
  img.src=URL.createObjectURL(inp.files[0])});

/* ---------- catch sequence: render(t) — ball lifts off the card you tapped → shakes ×3 → squash → spin-burst into the exact card ---------- */
let catching=null;
function rings(cx,cy,t0,t,col,rare){[[r1,0],[r2,120]].forEach(([r,dl],i)=>{if(i===1&&!rare){r.hidden=true;return}const u=clamp01((t-t0-dl)/700);
  if(u<=0||u>=1){r.hidden=true;return}r.hidden=false;const s=lerp(.6,4.2,GLIDE(u));r.style.setProperty('--rc',col);
  r.style.borderWidth=(10*(1-GLIDE(u)))+'px';r.style.transform=`translate(${cx-60}px,${cy-60}px) scale(${s})`})}
function preload(src){return new Promise(res=>{if(!src)return res();const i=new Image();const to=setTimeout(res,4000);i.onload=i.onerror=()=>{clearTimeout(to);res()};i.src=src})}
async function catchCard(src,card){if(busy||catching)return;const p=byNo(card.no);if(!p)return;
  if((own[p.no]||[]).some(c=>c.id===card.id)){toast('That exact card is already in your Pokédex');return}
  busy=true;const isNew=!has(p.no);const pre=preload(card.imgL);
  const orb=src.querySelector('.ball')||src,r=orb.getBoundingClientRect(),a={x:r.left+r.width/2,y:r.top+r.height/2},C=cardRect(),B={x:C.x,y:C.y};
  const c=tc(p.types[0]),rare=card.tier!=='c',ultra=card.tier==='u';catching=p;
  stage.style.setProperty('--ox',a.x+'px');stage.style.setProperty('--oy',a.y+'px');stage.classList.add('on');
  hero.style.setProperty('--c',c[0]);hero.style.setProperty('--d',c[1]);
  front.className='face front ball';front.style.transform='';front.innerHTML='';back.innerHTML='';
  orb.style.visibility='hidden';hero.hidden=false;setHero(a.x,a.y,r.width||40,r.height||40,(r.width||40)/2);
  // timeline (ms, 30 fps grid: beats on multiples of 200 ms)
  const tA=600,tB=1800,tC=2000,tD=2800,END=3000;let swapped=false;const w0=r.width||40;
  await play(tB,t=>{const s=t/1000;
    if(t<tA){const p1=springX(s,SP.lift.T,SP.lift.b);const pt=arcPoint(a,B,clamp01(p1),.22);const sz=lerp(w0,128,p1);setHero(pt.x,pt.y,sz,sz,sz/2)}
    else{const k=(t-tA)/(tB-tA)*3,u=k%1,n=Math.floor(k);const rot=(n<3)?22*Math.sin(2*Math.PI*Math.min(1,u/.75))*Math.sin(Math.PI*Math.min(1,u/.75)):0;
      setHero(B.x+rot*.6,B.y,128,128,64,1,rot)}});
  await pre; // the card image is ready before the burst, so nothing pops in late
  const cardOwned={...card};
  await play(END-tB,t0=>{const t=t0+tB;
    if(t<tC){const u=(t-tB)/(tC-tB),sy=1-.08*Math.sin(Math.PI*u)**2;setHero(B.x,B.y+(1-sy)*40,128,128,64,1,0,0,1/sy,sy)}
    else{const u=clamp01((t-tC)/(tD-tC)),e=HAND(u),ang=180*e;
      // the picture changes only at the edge-on moment of the spin
      if(!swapped&&ang>=90){swapped=true;front.className='face front'+(cardOwned.imgL?' has-photo':'');front.innerHTML=frontHTML(p,cardOwned);front.style.transform='scaleX(-1)'}
      setHero(B.x,lerp(B.y,C.y,e),lerp(128,C.w,e),lerp(128,C.h,e),lerp(64,14,e),1,0,ang)}
    rings(B.x,B.y,tC,t,ultra?'#FFE27A':rare?'#ffffff':c[0],rare)});
  // settle on the same frame: rotateY(180)+scaleX(-1) reads the same as rotateY(0)
  front.style.transform='';setHero(C.x,C.y,C.w,C.h,14,1,0,0);
  const xp=(isNew?100:20)+(card.tier==='r'?150:ultra?400:0);
  const head=isNew?'Gotcha!':'Another one!';const line=isNew?`${esc(p.name)} joined your Pokédex · +${xp} XP`:`A new ${esc(p.name)} card for your collection · +${xp} XP`;
  words.innerHTML=`${rare?`<div class="mask"><span><span class="tag">${ultra?'LEGENDARY PULL!':'RARE PULL!'}</span></span></div>`:''}<div class="mask"><span class="big ${ultra?'gold':''}">${head}</span></div><div class="mask"><span class="small">${line}</span></div>`;
  // if the card and words don't fit, push the camera up so both stay on screen
  const wordsH=rare?150:118,bottom=C.y+C.h/2+18+wordsH+64;let lift=Math.max(0,bottom-(innerHeight-16));
  if(lift){await play(300,t=>{const e=GLIDE(t/300);setHero(C.x,C.y-lift*e,C.w,C.h,14)});C.y-=lift}
  words.style.top=(C.y+C.h/2+18)+'px';words.hidden=false;words.classList.remove('rise');void words.offsetWidth;words.classList.add('rise');[...words.querySelectorAll('.mask>span')].forEach((s,i)=>s.style.setProperty('--i',i));
  done.style.top=(C.y+C.h/2+18+wordsH)+'px';done.hidden=false;done.animate?.([{transform:'translateX(-50%) scale(0)'},{transform:'translateX(-50%) scale(1)'}],{duration:SP.snap.T*1250,easing:getComputedStyle(document.documentElement).getPropertyValue('--sp-snap').trim()||'ease-out'});
  catching={p,C,orb,card};busy=false}
done.addEventListener('click',async e=>{e.stopPropagation();if(!catching||busy)return;busy=true;const {p,C,orb,card}=catching;done.hidden=true;words.hidden=true;
  const levelBefore=Math.floor(xpOf(albums())/LV)+1;if(typeof snapTiers==='function')snapTiers();
  const tr=$('#tabDex').getBoundingClientRect(),b={x:tr.left+tr.width/2,y:tr.top+14};
  stage.style.setProperty('--ox',b.x+'px');stage.style.setProperty('--oy',b.y+'px');stage.classList.remove('on');
  // travel to the Pokédex tab: anticipation, arc, shrink to a point (Hand-off)
  await play(620,t=>{const u=t/620,e=HAND(u)+antic(u)*(1-u);const pt=arcPoint({x:C.x,y:C.y},b,clamp01(e),.2);setHero(pt.x,pt.y,C.w,C.h,14,Math.max(0.02,1-clamp01(e)))});
  hero.hidden=true;orb.style.visibility='';const tab=$('#tabDex');tab.classList.remove('pop');void tab.offsetWidth;tab.classList.add('pop');
  (own[p.no]=own[p.no]||[]).push(card);(card.also||[]).forEach(n=>{if(byNo(n)&&!(own[n]||[]).some(c=>c.id===card.id))(own[n]=own[n]||[]).push({...card,no:n,also:[]})});
  delete wish[p.no];save();
  if(gen&&gen!==p.gen){gen=p.gen;renderGens()}if(!['all','caught'].includes(filt)&&!p.types.includes(filt)){filt='all';renderFilters()}
  renderHome();renderGrid();$('#results').querySelectorAll('.pick').forEach(el=>{const c=found[+el.dataset.i];if(c&&c.nationalPokedexNumbers.includes(p.no)&&!el.querySelector('.have'))el.insertAdjacentHTML('beforeend','<span class="have">In your Pokédex</span>')});
  catching=null;busy=false;
  const levelAfter=Math.floor(xpOf(albums())/LV)+1;
  if(typeof afterCatch==='function'&&await afterCatch(p,card,levelBefore,levelAfter))return;
  await go(1);await wait(240);const el=$(`.tile[data-no="${p.no}"]`);if(el){el.scrollIntoView({block:'center',behavior:RM?'auto':'smooth'});await wait(380);
    // ring of light opens out of the tile's centre (a mask, not a fade)
    const rv=document.createElement('div');rv.className='reveal';el.appendChild(rv);
    await play(700,t=>{const u=t/700,o=lerp(0,95,GLIDE(clamp01(u/.55))),i=lerp(0,95,GLIDE(clamp01((u-.2)/.8)));
      rv.style.clipPath=`circle(${o}% at 50% 44%)`;rv.style.setProperty('--in',i+'%')});rv.remove()}
  if(typeof celebrateAfter==='function')celebrateAfter(levelBefore,levelAfter);else if(levelAfter>levelBefore)toast(`Level up! You're now level ${levelAfter}`)});

/* ---------- backup ---------- */

/* ---------- trainer name ---------- */

/* ---------- start ---------- */
(async function start(){load();try{const nm=localStorage.getItem('pokedex.name');if(nm)$('#tname').textContent=nm}catch(e){}
  $('.avatar').textContent=($('#tname').textContent.trim()[0]||'T').toUpperCase();
  const txt=await (await fetch('dex.txt?v=1')).text();
  DEX=txt.trim().split('\n').map((l,i)=>{const f=l.split('|');return {no:i+1,name:f[0],types:f[1].split('.'),gen:+f[2],from:f[3]?+f[3]:0,leg:f[4].includes('L'),myth:f[4].includes('M'),hp:+f[5],atk:+f[6],ht:+f[7]/10,wt:+f[8]/10}});
  kids={};DEX.forEach(p=>{if(p.from)(kids[p.from]=kids[p.from]||[]).push(p.no)});
  try{FLAV=(await (await fetch('flavor.txt?v=1')).text()).split('\n')}catch(e){FLAV=[]}
  if(typeof initFeatures==='function')initFeatures();
  renderGens();renderFilters();renderGrid();renderHome();
  if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
  window.__audit={go,openTile:n=>openTile($(`.tile[data-no="${n}"]`)),closeTile,turnCard,find,catchCard,toEntry,get own(){return own}};})();
