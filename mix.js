/* mix.js: five small things that make collecting feel bigger.
   1 Type mix (one slim bar on the Trainer page)  2 Pack value reveal  3 Collection worth chart
   4 Daily gift spin (a card in the Today deck)   5 Printable album checklists
   Motion (MeFit): bars grow on GLIDE, numbers count up on HAND, the gift wheel decelerates on a
   long glide, the chart line draws on. Nothing fades. */

const waitPrices=async ids=>{for(let i=0;i<60&&priceBusy;i++)await wait(300);await fetchPrices(ids)};
const countUp=(el,to,fmt)=>play(900,t=>{el.textContent=fmt(to*HAND(Math.min(1,t/900)))}).then(()=>el.textContent=fmt(to));

/* ================= 1 · Type mix ================= */
function typeMix(){const C={};let n=0;for(const k in own){if(!own[k].length)continue;const p=byNo(+k);if(!p)continue;const t=p.types[0];C[t]=(C[t]||0)+1;n++}
  return {n,L:Object.entries(C).map(([t,c])=>({t,c,p:c/n})).sort((a,b)=>b.c-a.c)}}
const pct=p=>Math.round(p*100)+'%';
function typeMixHTML(){const {n,L}=typeMix();if(!n)return '';
  return `<button class="tm" data-fn="openTypeMix" aria-label="My type mix"><span class="tm-h"><b>My type mix</b><span class="chev">›</span></span>
    <span class="tm-bar">${L.map((x,i)=>`<i style="--c:${T[x.t][0]};--w:${x.p*100}%;--i:${i}"></i>`).join('')}</span>
    <span class="tm-top">${L.slice(0,3).map(x=>`<span style="--c:${T[x.t][0]}"><em></em>${TYPE_IC[x.t]||''} ${T[x.t][3]} <b>${pct(x.p)}</b></span>`).join('')}</span></button>`}
function openTypeMix(){openSheet('My type mix',body=>{const {n,L}=typeMix(),miss=Object.keys(T).filter(t=>!L.some(x=>x.t===t));
  body.innerHTML=`<p class="sub">What your ${n} Pokémon are, by their main type. ${L[0]?`You're a <b style="color:${T[L[0].t][0]}">${T[L[0].t][3]}</b> fan!`:''}</p>
    <div class="tm-list">${L.map((x,i)=>`<button class="tm-row" data-tw="${x.t}" style="--c:${T[x.t][0]};--d:${T[x.t][1]};--p:${x.p};--i:${i}"><span class="tm-ic">${TYPE_IC[x.t]||''}</span><span class="tm-nm">${T[x.t][3]}</span><span class="tm-tr"><i></i></span><b>${pct(x.p)}</b><small>${x.c}</small></button>`).join('')}</div>
    ${miss.length?`<div class="sec">Types you don't have yet</div><div class="tm-miss">${miss.map(t=>`<span style="--c:${T[t][0]}">${TYPE_IC[t]||''} ${T[t][3]}</span>`).join('')}</div>`:'<p class="hint">You have every type! 🎉</p>'}`;
})}
document.addEventListener('click',e=>{const r=e.target.closest('.tm-row[data-tw]');if(r&&typeof openTypeWheel==='function'){e.stopPropagation();openTypeWheel(r.dataset.tw)}},true);

/* ================= 2 · Pack value reveal ================= */
const _ops=openPackSummary;openPackSummary=function(pk,fresh){_ops(pk,fresh);setTimeout(()=>packValue(pk,fresh),40)};
async function packValue(pk,fresh){const b=$('#sheet .sh-body');if(!b||b.querySelector('.pv'))return;const cards=bingoHits(pk).cards,ids=cards.map(c=>c.id);if(!ids.length)return;
  b.insertAdjacentHTML('afterbegin',`<div class="pv"><span class="pv-k">This pack is worth about</span><b class="pv-n">…</b><span class="pv-s">Checking card prices…</span></div>`);
  await waitPrices(ids);const box=b.querySelector('.pv');if(!box||!box.isConnected)return;
  const vals=cards.map(c=>({c,g:PRICES[c.id]?.g})).filter(x=>x.g!=null);const tot=vals.reduce((s,x)=>s+x.g,0);
  if(!vals.length){box.querySelector('.pv-n').textContent='?';box.querySelector('.pv-s').textContent='No prices for these cards yet.';return}
  const best=vals.sort((x,y)=>y.g-x.g)[0];box.querySelector('.pv-s').innerHTML=`Most valuable: <b>${esc(best.c.name)}</b> · ${'🪙'.repeat(coinsOf(best.g))}${showGBP()?' about '+fmtGBP(best.g):''}`;
  const nEl=box.querySelector('.pv-n');if(showGBP())countUp(nEl,tot,v=>fmtGBP(v));else nEl.textContent='🪙'.repeat(coinsOf(tot));
  if(fresh&&!RM){box.classList.add('pop');if(typeof sfx==='function')sfx('bingo')}
  // the best pull spotlight follows value, not just rarity
  const bp=b.querySelector('.best img');if(bp&&best.c.img){bp.src=best.c.img;const nm=b.querySelector('.best .pf-name');if(nm)nm.textContent=best.c.name}}

/* ================= 3 · Collection worth ================= */
function worthNow(){let s=0,n=0,best=null;for(const k in own)own[k].forEach(c=>{const p=PRICES[c.id];
  if(p&&p.g!=null){s+=p.g;n++;if(!best||p.g>best.g)best={c:{...c,no:+k},g:p.g}}});return {s:Math.round(s*100)/100,n,best}}
function worthLog(){const w=worthNow();if(!w.n)return;prof.worth=prof.worth||{};const d=today();if(prof.worth[d]!==w.s){prof.worth[d]=w.s;const ks=Object.keys(prof.worth).sort();while(ks.length>120)delete prof.worth[ks.shift()];save2()}}
let _wT=0;const _rhW=renderHomeExtra;renderHomeExtra=function(A,xp,lv){_rhW(A,xp,lv);clearTimeout(_wT);_wT=setTimeout(async()=>{await waitPrices(ownedIds());worthLog()},2500)};
function worthChart(){const E=Object.entries(prof.worth||{}).sort((a,b)=>a[0].localeCompare(b[0]));if(E.length<2)return `<div class="wc-empty">📈 Your chart starts today. Come back after adding more cards to watch it grow!</div>`;
  const W=320,H=120,max=Math.max(...E.map(e=>e[1]))*1.1||1,min=0,x=i=>8+i*(W-16)/(E.length-1),y=v=>H-10-(v-min)/(max-min)*(H-24);
  const pts=E.map((e,i)=>`${x(i).toFixed(1)},${y(e[1]).toFixed(1)}`).join(' ');
  return `<svg class="wc" viewBox="0 0 ${W} ${H}" aria-label="Collection value over time"><defs><linearGradient id="wcg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3ddc84" stop-opacity=".45"/><stop offset="1" stop-color="#3ddc84" stop-opacity="0"/></linearGradient></defs>
    <polygon points="${x(0)},${H} ${pts} ${x(E.length-1)},${H}" fill="url(#wcg)" class="wc-a"/><polyline points="${pts}" class="wc-l" pathLength="1"/><circle cx="${x(E.length-1)}" cy="${y(E[E.length-1][1])}" r="5" class="wc-d"/></svg>
    <div class="wc-x"><span>${new Date(E[0][0]).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span><span>Today</span></div>`}
function openWorth(){openSheet('My collection\'s worth',async body=>{body.innerHTML=`<div class="wo"><div class="wo-hero"><span class="wo-k">My cards are worth about</span><b class="wo-n">…</b><small class="wo-s">Checking prices…</small></div><div class="wo-chart"></div><div class="wo-spot"></div><div class="wo-top"></div></div>`;
  const W=body.firstElementChild;await waitPrices(ownedIds());if(!W.isConnected)return;worthLog();const w=worthNow();
  const n=W.querySelector('.wo-n');if(showGBP())countUp(n,w.s,fmtGBP);else n.textContent='🪙'.repeat(coinsOf(w.s/Math.max(1,w.n)))||'—';
  W.querySelector('.wo-s').textContent=`${w.n} card${w.n===1?'':'s'} with a price · a rough guide, not a shop price`;
  W.querySelector('.wo-chart').innerHTML=worthChart();
  if(w.best){const c=w.best.c;W.querySelector('.wo-spot').innerHTML=`<div class="sec">My most valuable card</div><button class="wo-sp opencard" data-no="${c.no}"><span class="wo-img"><img src="${esc(c.photo||c.img||ART(c.no))}" alt=""><i></i></span><span class="wo-tx"><b>${esc(c.name)}</b><small>${esc(c.set||'')}</small>${valueHTML(c.rarity,c.id,w.best.g)}</span></button>`}
  const L=[];for(const k in own)own[k].forEach(c=>{const p=PRICES[c.id];if(p&&p.g!=null)L.push({c:{...c,no:+k},g:p.g})});L.sort((a,b)=>b.g-a.g);
  if(L.length>1)W.querySelector('.wo-top').innerHTML=`<div class="sec">Top 5</div><div class="vt-list">${L.slice(0,5).map((x,i)=>`<div class="vt-row"><span class="vt-rank">${i+1}</span><button class="vt-th opencard" data-no="${x.c.no}"><img src="${esc(x.c.photo||x.c.img||ART(x.c.no))}" alt=""></button><span class="vt-tx"><b>${esc(x.c.name)}</b><small>${esc(x.c.set||'')}</small>${valueHTML(x.c.rarity,x.c.id,x.g)}</span></div>`).join('')}</div>`})}

/* ================= 4 · Daily gift ================= */
const GIFT_SEG=[10,25,10,50,15,25,10,100],GIFT_COL=['#ff4656','#3fa8ff','#ffd23f','#4fd16b','#ff5fa8','#9b7bff','#ff7a3d','#ffcf3a'];
const _xpG=xpOf;xpOf=function(A){return _xpG(A)+(prof.giftXP||0)};
(function(){const tr=$('#tdTrack');if(!tr)return;const sl=document.createElement('div');sl.className='td-slide';sl.dataset.for='giftBox';sl.setAttribute('aria-label','Daily gift');sl.innerHTML='<div id="giftBox"></div>';tr.appendChild(sl)})();
function giftHTML(){const done=prof.giftDay===today(),seg=360/GIFT_SEG.length;
  const wheel=`<div class="gf-wheel-wrap"><span class="gf-pin" aria-hidden="true"></span><div class="gf-wheel" style="--rot:${done?prof.giftRot||0:0}deg;background:conic-gradient(${GIFT_SEG.map((_,i)=>`${GIFT_COL[i]} ${i*seg}deg ${(i+1)*seg}deg`).join(',')})">${GIFT_SEG.map((v,i)=>`<span style="--a:${i*seg+seg/2}deg">${v}</span>`).join('')}<i class="gf-hub">🎁</i></div></div>`;
  return `<div class="gift ${done?'done':''}">${wheel}<div class="gf-tx">${done?`<b>You won +${prof.giftLast||0} XP today!</b><p class="gf-fact">${prof.giftFact||''}</p><small>Next gift tomorrow</small>`:
    `<b>Your daily gift!</b><p>Spin the wheel for free XP and a Pokémon fact.</p><button class="cta gf-go">Spin!</button>`}</div></div>`}
function renderGift(){const g=$('#giftBox');if(!g)return;g.innerHTML=DEX.length&&Object.keys(own).length?giftHTML():''}
const _rhG=renderHomeExtra;renderHomeExtra=function(A,xp,lv){renderGift();_rhG(A,xp,lv);
  if(prof.giftDay!==today()&&!renderGift._fronted&&typeof tdDeckFront==='function'){const s=$('.td-slide[data-for="giftBox"]');if(s&&!s.classList.contains('empty')){renderGift._fronted=1;tdDeckFront(s)}}};
document.addEventListener('click',async e=>{const b=e.target.closest('.gf-go');if(!b)return;e.stopPropagation();if(prof.giftDay===today())return;b.disabled=true;
  const lb=Math.floor(xpOf(albums())/LV)+1,i=Math.floor(Math.random()*GIFT_SEG.length),seg=360/GIFT_SEG.length,rot=360*5+(360-(i*seg+seg/2))+((Math.random()-.5)*seg*.6);
  const wh=b.closest('.gift').querySelector('.gf-wheel');if(typeof sfx==='function')sfx('ball');wh.style.setProperty('--rot',rot+'deg');wh.classList.add('spin');
  const p=DEX[Math.floor(Math.random()*DEX.length)],fact=`Did you know? ${esc(p.name)}: ${esc(FLAV[p.no-1]||'is a '+T[p.types[0]][3]+'-type Pokémon.')}`;
  await wait(RM?0:3300);prof.giftDay=today();prof.giftXP=(prof.giftXP||0)+GIFT_SEG[i];prof.giftLast=GIFT_SEG[i];prof.giftRot=rot%360;prof.giftFact=fact;save2();
  if(typeof buzz==='function')buzz([20,40,20]);if(typeof sfx==='function')sfx('bingo');toast(`🎁 +${GIFT_SEG[i]} XP!`);renderHome();
  const la=Math.floor(xpOf(albums())/LV)+1;if(la>lb&&typeof celebrateAfter==='function')setTimeout(()=>celebrateAfter(lb,la),400)},true);

/* ================= 5 · Printable checklists ================= */
const _oaC=openAlbum;openAlbum=function(id){_oaC(id);setTimeout(()=>{const b=$('#sheet .sh-body'),sg=b&&b.querySelector('.seg');if(sg&&!b.querySelector('.ck-btn'))sg.insertAdjacentHTML('afterend',`<button class="ghost ck-btn" data-ck="${esc(id)}">🖨️ Print a checklist for my binder</button>`)},40)};
document.addEventListener('click',e=>{const b=e.target.closest('[data-ck]');if(!b)return;e.stopPropagation();const a=findAlbum(b.dataset.ck);if(!a)return;
  const items=a.isSet?setSlots(a).map(s=>({k:'#'+s.num,n:s.hit?s.hit.c.name:'',got:!!s.hit})):a.all.map(p=>({k:pad(p.no),n:p.name,got:has(p.no)}));
  const got=items.filter(x=>x.got).length,pr=document.createElement('div');pr.className='ckprint';
  pr.innerHTML=`<h1>${esc(a.name)} checklist</h1><p>${esc(prof.name||'Trainer')}'s Pokédex · ${got} of ${items.length} collected · ${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</p>
    <ol>${items.map(x=>`<li class="${x.got?'got':''}"><span class="bx">${x.got?'✓':''}</span><b>${esc(x.k)}</b> ${esc(x.n)}</li>`).join('')}</ol><footer>Tick each box when you find the card!</footer>`;
  document.body.appendChild(pr);const done=()=>{pr.remove();removeEventListener('afterprint',done)};addEventListener('afterprint',done);
  setTimeout(()=>{try{print()}catch(err){toast('Printing isn\'t available here. Try from the browser menu.');pr.remove()}},120)},true);

/* doors */
if(typeof renderTrainer==='function'){const _rtM=renderTrainer;renderTrainer=function(){_rtM();const tcd=$('#trainerBody .tcard');if(tcd&&!$('#trainerBody .tm'))tcd.insertAdjacentHTML('afterend',typeMixHTML());
  const g=$('#trainerBody .play-grid');if(g&&!g.querySelector('.pc-worth'))g.insertAdjacentHTML('beforeend',`<button class="pcard pc-worth" data-fn="openWorth"><b>My collection's worth</b><span>Watch it grow</span></button>`)}}
