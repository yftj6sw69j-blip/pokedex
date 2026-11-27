/* value.js: how rare is this print, and roughly what is it worth?
   Rarity is a coloured strip; value is coins (🪙 1 to 5) plus "about £X" (Matt: he sees both;
   grown-ups can hide the £ in the Grown-ups corner). Prices: Cardmarket trend price (EUR) converted to £,
   falling back to TCGplayer market (USD). Guides only, near-mint copies.
   Motion (MeFit): the value row rises in behind a mask when the price arrives; nothing fades. */

const EUR_GBP=.85,USD_GBP=.79,PRICE_KEY='pokedex.price.v1';
let PRICES={};try{PRICES=JSON.parse(localStorage.getItem(PRICE_KEY)||'{}')}catch(e){}
function gbpOf(c){const cm=c.cardmarket?.prices,tp=c.tcgplayer?.prices;
  const e=cm&&(cm.trendPrice||cm.averageSellPrice||cm.avg7);if(e)return Math.round(e*EUR_GBP*100)/100;
  if(tp){const v=Object.values(tp).map(x=>x&&(x.market||x.mid)).filter(Boolean);if(v.length)return Math.round(Math.max(...v)*USD_GBP*100)/100}
  return null}
let _psT=0;function priceSet(id,g){PRICES[id]={g:g==null?null:g,t:Date.now()};clearTimeout(_psT);_psT=setTimeout(()=>{try{localStorage.setItem(PRICE_KEY,JSON.stringify(PRICES))}catch(e){}},400)}
const priceFresh=id=>PRICES[id]&&Date.now()-PRICES[id].t<6048e5;

// rarity colour bands
const RAR_BANDS=[['gold',/illustration|secret|hyper|rainbow|shiny|gold|crown|ace spec/i,'Super rare'],['purple',/ultra|double|holo v|vmax|vstar|\bex\b|\bgx\b|amazing|radiant|legend|break|prime|star/i,'Ultra rare'],
  ['teal',/promo/i,'Promo'],['blue',/holo|rare/i,'Rare'],['green',/uncommon/i,'Uncommon'],['grey',/common/i,'Common']];
function rarBand(r){r=r||'';const b=RAR_BANDS.find(x=>x[1].test(r));return b?{k:b[0],l:b[2]}:{k:'grey',l:r?r:'Unknown'}}
const coinsOf=g=>g==null?0:g<.5?1:g<2?2:g<10?3:g<40?4:5;
const showGBP=()=>prof.showPrice!==false;
const fmtGBP=g=>g==null?'no price yet':g<1?Math.round(g*100)+'p':'£'+(g<100?g.toFixed(2):Math.round(g).toLocaleString('en-GB'));
function valueHTML(rarity,id,g){const b=rarBand(rarity);if(g===undefined)g=PRICES[id]?.g;const known=PRICES[id]||g!=null,n=coinsOf(g);
  const val=!known?'<em class="vl-wait">checking value…</em>':g==null?'<em>Value: not known yet</em>':
    `<span class="vl-coins" aria-label="Value ${n} of 5">${'🪙'.repeat(n)}<i>${'🪙'.repeat(5-n)}</i></span>${showGBP()?`<b class="vl-gbp">about ${fmtGBP(g)}</b>`:''}`;
  return `<span class="vl rb-${b.k}" data-pv="${esc(id||'')}"><span class="vl-r"><i></i>${esc(b.l)}</span><span class="vl-v">${val}</span></span>`}

// batch-fetch prices for cards he owns (20 at a time), then patch any value rows on screen
let priceBusy=false;
async function fetchPrices(ids){ids=[...new Set(ids)].filter(id=>id&&!/^t\d|^x\d/.test(id)&&!priceFresh(id));if(!ids.length||priceBusy)return;priceBusy=true;
  try{for(let i=0;i<ids.length;i+=20){const part=ids.slice(i,i+20),q=part.map(id=>`id:"${id}"`).join(' OR ');
      const url=`${TCG}?q=${encodeURIComponent(q)}&pageSize=50&select=id,rarity,cardmarket,tcgplayer`;let j=null;
      for(let a=0;a<3&&!j;a++){try{const r=await fetch(url);if(!r.ok)throw 0;j=await r.json()}catch(e){await new Promise(r=>setTimeout(r,900*(a+1)))}}
      if(!j)break;const got=new Set();(j.data||[]).forEach(c=>{got.add(c.id);priceSet(c.id,gbpOf(c))});part.forEach(id=>{if(!got.has(id))priceSet(id,null)});patchValues()}}
  finally{priceBusy=false}}
function patchValues(){document.querySelectorAll('.vl[data-pv]').forEach(el=>{const id=el.dataset.pv;if(!PRICES[id]||!el.querySelector('.vl-wait'))return;
  const r=el.querySelector('.vl-r').textContent;const tmp=document.createElement('div');
  const own1=Object.values(own).flat().find(c=>c.id===id);tmp.innerHTML=valueHTML(own1?.rarity||r,id);const nv=tmp.firstElementChild.querySelector('.vl-v');
  el.querySelector('.vl-v').replaceWith(nv);if(!RM){nv.classList.add('vl-in')}})}
const ownedIds=()=>Object.values(own).flat().map(c=>c.id);

// on the back of every card he owns
const _backVal=backHTML;backHTML=function(p){const h=_backVal(p),list=own[p.no]||[];if(!list.length)return h;
  const f=Math.min(fav[p.no]||0,list.length-1),o=list[f];setTimeout(()=>fetchPrices(list.map(c=>c.id)),50);
  const row=`<div class="vl-row"><div class="mch">This card</div>${valueHTML(o.rarity,o.id)}</div>`;
  return h.includes('<button class="vr-door"')?h.replace('<button class="vr-door"',row+'<button class="vr-door"'):h.includes('<div class="sp-row">')?h.replace('<div class="sp-row">',row+'<div class="sp-row">'):h+row};

// on every version tile
const _vtV=verTile;verTile=function(x,got){const h=_vtV(x,got);const g=x.gbp!==undefined?x.gbp:undefined;return h.replace(/<\/div>$/,`${valueHTML(x.rarity,x.id,g)}</div>`)};
const _ovV=openVersions;openVersions=function(no){_ovV(no);setTimeout(()=>fetchPrices([...verOwned(no).keys()]),200)};

// Grown-ups corner: switch £ on, see the whole collection's guide value
const _pbV=parentBody;parentBody=function(body){_pbV(body);
  const tot=()=>{let s=0,n=0,miss=0;const seen=new Set();for(const k in own)own[k].forEach(c=>{const p=PRICES[c.id];if(p&&p.g!=null){s+=p.g;n++}else miss++});return {s,n,miss}};
  const t=tot();body.insertAdjacentHTML('afterbegin',`<div class="sec">Card values</div><label class="vl-sw"><input type="checkbox" id="pPrice" ${prof.showPrice!==false?'checked':''}><span><b>Show £ prices on cards</b><small>On: cards show a 1 to 5 coin value and "about £X". Off: coins only.</small></span></label>
    <p class="hint" id="pTot">Collection guide value: <b>about ${fmtGBP(t.s)}</b> from ${t.n} priced card${t.n===1?'':'s'}${t.miss?` (${t.miss} still checking or without a price)`:''}. Prices are Cardmarket averages for near-mint cards, converted to pounds, so treat them as a rough guide.</p>`);
  body.querySelector('#pPrice').addEventListener('change',e=>{prof.showPrice=e.target.checked;save2();toast(prof.showPrice?'£ prices are on':'£ prices are off')});
  fetchPrices(ownedIds())};
