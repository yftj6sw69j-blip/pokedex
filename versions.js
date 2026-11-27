/* versions.js: every print of a Pokémon in one album. The prints he owns are in colour,
   the rest are empty pockets he can hunt for. Milestone badges at 5, 10 and 25 versions.
   Motion (MeFit): badges stamp in on SNAP, filters toggle on SNAP, nothing fades. */

const VER_TIERS=[[5,'Collector','🥉',40],[10,'Super fan','🥈',80],[25,'Mega fan','🥇',150]];
const VER_KEY='pokedex.vers.';
// distinct card ids he owns for one Pokémon (tag-team cards count for each Pokémon on them)
function verOwned(no){const ids=new Map();for(const n in own)own[n].forEach(c=>{if(+n===no||(c.also||[]).includes(no))if(!ids.has(c.id))ids.set(c.id,c)});return ids}
const verCount=no=>verOwned(no).size;
const verTier=n=>[...VER_TIERS].reverse().find(t=>n>=t[0]);
function verAllCounts(){const m={};for(const n in own)own[n].forEach(c=>[+n,...(c.also||[])].forEach(k=>{(m[k]=m[k]||new Set()).add(c.id)}));const o={};for(const k in m)o[k]=m[k].size;return o}
function verXP(){const C=verAllCounts();let x=0;for(const k in C)VER_TIERS.forEach(t=>{if(C[k]>=t[0])x+=t[3]});return x}
const _xpV=xpOf;xpOf=function(A){return _xpV(A)+verXP()};

// every print, from the card database, cached on this device for a week
async function verFetch(no,force){const k=VER_KEY+no;
  if(!force){try{const c=JSON.parse(localStorage.getItem(k)||'null');if(c&&Date.now()-c.t<6048e5)return c.L}catch(e){}}
  const L=[];for(let page=1;page<=4;page++){const url=`${TCG}?q=${encodeURIComponent('nationalPokedexNumbers:'+no)}&page=${page}&pageSize=250&select=id,name,number,rarity,images,set,supertype`;
    let j;for(let a=0;a<4&&!j;a++){const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),20000);
      try{const r=await fetch(url,{signal:ctl.signal});if(!r.ok)throw new Error('HTTP '+r.status);j=await r.json()}catch(e){if(a===3)throw e;await new Promise(r=>setTimeout(r,800*(a+1)))}finally{clearTimeout(to)}}
    (j.data||[]).forEach(c=>L.push({id:c.id,name:c.name,number:c.number,set:c.set?.name||'',date:c.set?.releaseDate||'',rarity:c.rarity||'',img:c.images?.small||''}));
    if(L.length>=(j.totalCount||0)||!(j.data||[]).length)break}
  L.sort((a,b)=>String(b.date).localeCompare(String(a.date)));try{localStorage.setItem(k,JSON.stringify({t:Date.now(),L}))}catch(e){}return L}

let verF='all';
function verBadges(n){return `<div class="vr-badges">${VER_TIERS.map(([at,l,ic])=>`<span class="vr-b ${n>=at?'got':''}"><i>${ic}</i><b>${l}</b><small>${n>=at?'Won!':at+' versions'}</small></span>`).join('')}</div>`}
function openVersions(no){const p=byNo(no);if(!p)return;verF='all';
  openSheet(`${p.name} versions`,async body=>{const mine=verOwned(no),n=mine.size,t=verTier(n),nt=VER_TIERS.find(x=>x[0]>n),c=tc(p.types[0]);
    body.innerHTML=`<div class="vr-wrap"><div class="vr-head" style="--c:${c[0]};--d:${c[1]}"><img src="${ART(no)}" alt=""><div><b>${n}</b><span>version${n===1?'':'s'} of ${esc(p.name)}</span><small id="vrTot">Looking up every card…</small></div></div>
      ${verBadges(n)}<p class="hint">${nt?`${nt[0]-n} more different ${esc(p.name)} card${nt[0]-n===1?'':'s'} for the ${nt[2]} ${nt[1]} badge!`:`You're a ${esc(p.name)} Mega fan! 🎉`}</p>
      <div class="filters vr-f"><button class="chip" data-vf="all" aria-pressed="true">All</button><button class="chip" data-vf="mine" aria-pressed="false">I have</button><button class="chip" data-vf="need" aria-pressed="false">Still to find</button></div>
      <div class="vr-grid" id="vrGrid">${[...mine.values()].map(x=>verTile(x,true)).join('')}</div></div>`;
    body.firstElementChild.addEventListener('click',e=>{const f=e.target.closest('[data-vf]');if(f){verF=f.dataset.vf;body.querySelectorAll('[data-vf]').forEach(b=>b.setAttribute('aria-pressed',b===f));body.querySelector('#vrGrid').dataset.f=verF;return}
      if(e.target.closest('#vrRetry')){localStorage.removeItem(VER_KEY+no);refreshSheet()}});
    let L;try{L=await verFetch(no)}catch(e){L=null}
    const g=body.querySelector('#vrGrid'),tot=body.querySelector('#vrTot');if(!g||!g.isConnected)return;
    if(!L){tot.innerHTML='Couldn\'t load every card right now. <button class="sec-link" id="vrRetry">Try again</button>';return}
    const extra=[...mine.values()].filter(x=>!L.some(y=>y.id===x.id)),all=[...L.map(x=>({...x,own:mine.has(x.id)})),...extra.map(x=>({...x,own:true}))],T0=all.length;
    tot.textContent=`${n} of ${T0} ${p.name} cards ever made`;
    g.innerHTML=all.map(x=>verTile(x,x.own)).join('');g.dataset.f=verF})}
function verTile(x,got){return `<div class="vr-t ${got?'got':'need'}"><span class="vr-img">${x.img?`<img src="${esc(x.img)}" alt="" loading="lazy">`:''}${got?'<i class="vr-ok">✓</i>':''}</span><b>${esc(x.set||'')}</b><small>${x.number?'#'+esc(x.number):''}${x.date?' · '+esc(String(x.date).slice(0,4)):''}</small></div>`}

// the back of a card he owns gets a door to it
const _backV=backHTML;backHTML=function(p){const h=_backV(p);if(!(own[p.no]||[]).length)return h;const n=verCount(p.no),t=verTier(n);
  const btn=`<button class="vr-door" data-vers="${p.no}"><span class="vr-di">${t?t[2]:'🗂️'}</span><span><b>Every ${esc(p.name)} card</b><small>${n} version${n===1?'':'s'} so far${t?' · '+t[1]:''}</small></span><span class="chev">›</span></button>`;
  return h.includes('<div class="sp-row">')?h.replace('<div class="sp-row">',btn+'<div class="sp-row">'):h.includes('<label class="ghost act-photo">')?h.replace('<label class="ghost act-photo">',btn+'<label class="ghost act-photo">'):h+btn};
document.addEventListener('click',e=>{const b=e.target.closest('[data-vers]');if(!b)return;e.stopPropagation();const no=+b.dataset.vers;
  if(typeof open!=='undefined'&&open&&typeof closeTile==='function'){closeTile();setTimeout(()=>openVersions(no),380)}else openVersions(no)},true);

// a page listing his version badges, reached from the Trainer page
function openVerBadges(){openSheet('Version badges',body=>{const C=verAllCounts(),L=Object.entries(C).map(([k,v])=>({no:+k,n:v})).filter(x=>byNo(x.no)).sort((a,b)=>b.n-a.n),won=L.reduce((s,x)=>s+VER_TIERS.filter(t=>x.n>=t[0]).length,0);
  body.innerHTML=`<p class="sub">Collect different cards of the same Pokémon. 5 versions wins 🥉 Collector, 10 wins 🥈 Super fan and 25 wins 🥇 Mega fan.</p>
    <div class="sec">My Pokémon with the most versions</div>${L.length?`<div class="vr-list">${L.slice(0,30).map(x=>{const p=byNo(x.no),t=verTier(x.n),nt=VER_TIERS.find(y=>y[0]>x.n);
      return `<button class="vr-row" data-vers="${x.no}"><img src="${ART(x.no)}" alt=""><span><b>${esc(p.name)}</b><small>${x.n} version${x.n===1?'':'s'}${nt?' · '+(nt[0]-x.n)+' to '+nt[2]:''}</small></span><span class="vr-rb">${t?t[2]:''}</span><span class="chev">›</span></button>`}).join('')}</div>`:'<p class="hint">Add a card to start.</p>'}
    <p class="hint">${won} badge${won===1?'':'s'} won so far.</p>`})}
if(typeof renderTrainer==='function'){const _rtV=renderTrainer;renderTrainer=function(){_rtV();const g=$('#trainerBody .play-grid');if(g&&!g.querySelector('.pc-ver')){const C=verAllCounts(),won=Object.values(C).reduce((s,v)=>s+VER_TIERS.filter(t=>v>=t[0]).length,0);
  g.insertAdjacentHTML('beforeend',`<button class="pcard pc-ver" data-fn="openVerBadges"><b>Versions</b><span>${won?won+' badge'+(won===1?'':'s')+' won':'Collect 5 of one Pokémon'}</span></button>`)}}}

// celebrate a new version badge once
const _rhV=renderHomeExtra;renderHomeExtra=function(A,xp,lv){_rhV(A,xp,lv);const C=verAllCounts(),first=prof.verSeen===undefined;prof.verSeen=prof.verSeen||{};let ch=false;
  for(const k in C){const i=VER_TIERS.filter(t=>C[k]>=t[0]).length;if(i>(prof.verSeen[k]||0)){if(!first&&byNo(+k)){const t=VER_TIERS[i-1];toast(`${t[2]} ${t[1]} badge! ${t[0]} different ${byNo(+k).name} cards. +${t[3]} XP`);if(typeof sfx==='function')sfx('bingo')}prof.verSeen[k]=i;ch=true}}
  if(ch||first)save2()};
