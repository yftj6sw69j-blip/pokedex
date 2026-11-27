/* special.js: shiny and special cards, and the duplicates (trade) helper.
   Motion (MeFit): sparkles twinkle on the --L clock, the reverse-holo shimmer sweeps,
   chips toggle on SNAP; nothing fades. */

/* ================= shiny and special cards ================= */
const SPECIAL={shiny:['✨','Shiny',100],fullart:['🖼️','Full art',100],first:['①','1st edition',150],reverse:['🔁','Reverse holo',25],promo:['🎖️','Promo',50]};
function autoSp(c){const r=(c.rarity||'')+' '+(c.set||'');const s=[];
  if(/shiny/i.test(r))s.push('shiny');if(/illustration|full art|secret|hyper|rainbow/i.test(r))s.push('fullart');if(/promo/i.test(r))s.push('promo');return s}
function spOf(c){if(!c)return [];if(!c.spSet){c.sp=[...new Set([...(c.sp||[]),...autoSp(c)])];c.spSet=1}return c.sp||[]}
function spXP(){const seen=new Set();let x=0;for(const n in own)own[n].forEach(c=>{if(seen.has(c.id))return;seen.add(c.id);spOf(c).forEach(k=>x+=SPECIAL[k]?SPECIAL[k][2]:0)});return x}
const _xpS=xpOf;xpOf=function(A){return _xpS(A)+spXP()};
const spBadge=sp=>sp.length?`<span class="sp-tag" aria-label="${sp.map(k=>SPECIAL[k][1]).join(', ')}">${sp.map(k=>SPECIAL[k][0]).join('')}</span>`:'';
const spCls=sp=>sp.map(k=>'sp-'+k).join(' ');

// tiles, the big card, and the Hall of Fame all show it
const _tileS=tileHTML;tileHTML=function(p){const h=_tileS(p),o=topCard(p.no),sp=spOf(o);if(!sp.length)return h;
  return h.replace('class="tile ',`class="tile ${spCls(sp)} `).replace(/<\/button>\s*$/,`<i class="sp-fx"></i>${spBadge(sp)}</button>`)};
const _frontS=frontHTML;frontHTML=function(p,o){const h=_frontS(p,o),sp=spOf(o);return sp.length?h+`<i class="sp-fx ${spCls(sp)}"></i>${spBadge(sp)}`:h};
if(typeof hofCard==='function'){const _hcS=hofCard;hofCard=function(c,i,pin){const sp=spOf((own[c.no]||[]).find(x=>x.id===c.id)||c);const h=_hcS(c,i,pin);
  return sp.length?h.replace('<i class="hf-shine"></i>',`<i class="hf-shine"></i><i class="sp-fx ${spCls(sp)}"></i>${spBadge(sp)}`):h}}

// on the back of a card he owns: "Is this card special?"
const _backS=backHTML;backHTML=function(p){const h=_backS(p),list=own[p.no]||[];if(!list.length)return h;
  const f=Math.min(fav[p.no]||0,list.length-1),sp=spOf(list[f]);
  const row=`<div class="sp-row"><div class="mch">Is this card special?</div><div class="sp-chips">${Object.entries(SPECIAL).map(([k,[ic,l,xp]])=>`<button class="sp-chip" data-sp="${k}" data-no="${p.no}" aria-pressed="${sp.includes(k)}"><span>${ic}</span>${l}<em>+${xp}</em></button>`).join('')}</div></div>`;
  return h.includes('<label class="ghost act-photo">')?h.replace('<label class="ghost act-photo">',row+'<label class="ghost act-photo">'):h+row};
$('#stage').addEventListener('click',e=>{const b=e.target.closest('[data-sp]');if(!b)return;e.stopPropagation();
  const no=+b.dataset.no,k=b.dataset.sp,list=own[no];if(!list||!list.length)return;const f=Math.min(fav[no]||0,list.length-1),c=list[f];
  const lb=Math.floor(xpOf(albums())/LV)+1;const sp=spOf(c),on=!sp.includes(k);
  const next=on?[...sp,k]:sp.filter(x=>x!==k);
  for(const n in own)own[n].forEach(x=>{if(x.id===c.id){x.sp=next;x.spSet=1}});save();
  b.setAttribute('aria-pressed',on);b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');
  if(on){if(typeof sfx==='function')sfx('bingo');if(typeof buzz==='function')buzz(15);toast(`${SPECIAL[k][0]} ${SPECIAL[k][1]}! +${SPECIAL[k][2]} XP`)}
  // refresh the front face and the tile without turning the card
  const fr=$('#front'),p=byNo(no),o=topCard(no);fr.innerHTML=frontHTML(p,o);refreshTile(no);renderHome();
  const la=Math.floor(xpOf(albums())/LV)+1;if(la>lb&&typeof celebrateAfter==='function')setTimeout(()=>celebrateAfter(lb,la),300)},true);

/* ================= duplicates helper ================= */
const TIER_V={c:1,r:2,u:3};
const cardVal=c=>(TIER_V[c.tier]||1)+(spOf(c).length?1:0);
const stars=v=>'★'.repeat(v);
function wantVal(p){return p.leg||p.myth?3:STARTERS.includes(p.no)||(p.from&&byNo(p.from)?.from)?2:1}
function tradePlan(){const S=spares().map(c=>({...c,v:cardVal(c)})).sort((a,b)=>a.v-b.v),W=Object.keys(wish).map(Number).filter(n=>!has(n)).map(byNo).filter(Boolean);
  const used=new Set(),pairs=[];
  W.sort((a,b)=>wantVal(a)-wantVal(b)).forEach(p=>{const need=wantVal(p);const s=S.find(c=>!used.has(c.id)&&c.v>=need&&c.v<=need+1)||null;if(s){used.add(s.id);pairs.push({p,s,need})}else pairs.push({p,s:null,need,over:S.some(c=>!used.has(c.id)&&c.v>need+1)})});
  return {S,W,pairs}}
function betterSpares(){const out=[];for(const n in own){const L=own[n];if(L.length<2)continue;const k=Math.min(fav[n]||0,L.length-1),kv=cardVal(L[k]);
  L.forEach((c,i)=>{if(i!==k&&cardVal(c)>kv)out.push({no:+n,i,c})})}return out}
const thumb=(c,no)=>c.photo||c.img?`<img src="${c.photo||esc(c.img)}" alt="">`:`<img class="partart" src="${ART(no)}" alt="">`;
openSpares=function(){openSheet('Trade helper',body=>{const {S,W,pairs}=tradePlan(),B=betterSpares();
  const g=typeof goalOf==='function'?goalOf():null,ideas=g&&!g.a.isSet?g.a.all.filter(p=>!has(p.no)&&!wish[p.no]).slice(0,4):[];
  body.innerHTML=`<div class="dp-sum"><b>${S.length}</b><span>spare card${S.length===1?'':'s'} to trade</span><b>${W.length}</b><span>on my wish list</span></div>
   ${B.length?`<div class="sec">Swap which one you show</div>${B.map(x=>`<div class="dp-better"><div class="dp-th">${thumb(x.c,x.no)}</div><div class="dp-tx"><b>Your spare ${esc(byNo(x.no).name)} is rarer!</b><span>It's ${stars(cardVal(x.c))}. Show it in your Pokédex and trade the other one.</span></div><button class="ghost dp-keep" data-keep="${x.no}:${x.i}">Show this one</button></div>`).join('')}`:''}
   <div class="sec">Fair swaps for my wish list</div>
   ${pairs.length?pairs.map(({p,s,need,over})=>`<div class="dp-pair ${s?'':'dp-none'}"><div class="dp-th">${s?thumb(s,s.no):'<span class="dp-q">?</span>'}<small>${s?esc(s.name):'Need a spare'}</small></div>
     <div class="dp-arrow"><span>${s?stars(s.v):stars(need)}</span><i>⇄</i></div>
     <div class="dp-th want"><img src="${ART(p.no)}" alt="" class="sil"><small>${esc(p.name)}</small></div>
     ${s?`<button class="cta dp-go" data-give="${s.no}:${esc(s.id)}">Trade</button>`:`<span class="dp-hint">${over?'Your spares are worth more than this. Keep them for a rarer swap.':need>1?'Worth '+stars(need)+'. Save a rare spare for this one.':'Get a spare first.'}</span>`}</div>`).join('')
     :`<p class="hint">Your wish list is empty. Add Pokémon you want, then come back to see fair swaps.</p>${ideas.length?`<div class="dp-ideas">${ideas.map(p=>`<button class="partner" data-wishadd="${p.no}"><img class="sil" src="${ART(p.no)}" alt="">${esc(p.name)}</button>`).join('')}</div><p class="hint">These would get you closer to your next trophy. Tap to add them.</p>`:''}`}
   <div class="sec">All my spares</div>${S.length?`<div class="cgrid">${S.map(c=>`<button class="cthumb" data-give="${c.no}:${esc(c.id)}">${thumb(c,c.no)}<span>${stars(c.v)} ${esc(c.name)}</span></button>`).join('')}</div>`:'<p class="hint">No spares yet. When you get a second card of a Pokémon, it shows up here.</p>'}
   <p class="hint">★ common · ★★ rare · ★★★ ultra rare · special cards get an extra ★. Trade cards with the same stars to keep it fair.</p>`;
  body.addEventListener('click',e=>{const gv=e.target.closest('[data-give]');if(gv){const [no,id]=gv.dataset.give.split(/:(.*)/s);if(typeof showGiveCode==='function')showGiveCode(+no,id);return}
    const kp=e.target.closest('[data-keep]');if(kp){const [no,i]=kp.dataset.keep.split(':').map(Number);fav[no]=i;save();refreshTile(no);renderHome();toast('Done! Your rarest one is on show');refreshSheet();return}
    const wa=e.target.closest('[data-wishadd]');if(wa){wish[+wa.dataset.wishadd]=1;save();renderHome();refreshSheet()}})})};
