/* dexui.js: swipeable pages and the new Pokédex selectors.
   Motion (MeFit): nothing fades. Pages follow the finger, then leave on Exit and
   arrive on LIFT behind a mask. Region cards and type orbs settle on springs,
   the status thumb slides on SNAP. Reduced motion jumps straight to the end state. */

/* ---------- state: status (filt) and type (typeF) now combine ---------- */
let typeF='';
const TYPE_IC={fire:'🔥',water:'💧',grass:'🌿',electric:'⚡',psychic:'🔮',ghost:'👻',fighting:'🥊',rock:'🪨',normal:'⭐',
  fairy:'✨',dragon:'🐉',poison:'🧪',flying:'🪶',ground:'⛰️',bug:'🐛',steel:'⚙️',dark:'🌙',ice:'❄️'};
const GEN_STARTERS={1:[1,4,7],2:[152,155,158],3:[252,255,258],4:[387,390,393],5:[495,498,501],6:[650,653,656],7:[722,725,728],8:[810,813,816],9:[906,909,912]};
const GEN_ORDER=[1,2,3,4,5,6,7,8,9,0];
const STATUS=[['all','All','<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></svg>'],
  ['caught','Caught','<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M4 12h5m6 0h5"/><circle cx="12" cy="12" r="2.6"/></svg>'],
  ['missing','Missing','<svg viewBox="0 0 24 24"><path d="M9.2 9a3 3 0 1 1 4.2 2.8c-.9.4-1.4 1.1-1.4 2v.7"/><circle cx="12" cy="17.6" r=".6"/></svg>'],
  ['wish','Wish list','<svg viewBox="0 0 24 24"><path d="M12 4.5l2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2L4.5 10l5.2-.8z"/></svg>']];

/* legacy callers may still put a type into filt: split it out */
function normFilt(){if(T[filt]){typeF=filt;filt='all'}if(!STATUS.some(s=>s[0]===filt))filt='all'}
const statusOk=p=>filt==='all'||(filt==='caught'?has(p.no):filt==='missing'?!has(p.no):!!wish[p.no]);
listFor=function(){normFilt();
  let L=DEX.filter(p=>(!gen||p.gen===gen)&&(!typeF||p.types.includes(typeF))&&statusOk(p));
  const last=n=>(own[n]||[]).reduce((m,c)=>c.date>m?c.date:m,'');
  const s={no:(a,b)=>a.no-b.no,atk:(a,b)=>b.atk-a.atk,hp:(a,b)=>b.hp-a.hp,az:(a,b)=>a.name.localeCompare(b.name),new:(a,b)=>last(b.no).localeCompare(last(a.no))||a.no-b.no}[sortBy];
  return L.sort(s)};
const _renderCount=renderCount;
renderCount=function(L){_renderCount(L);syncSeg()};

/* ---------- region cards ---------- */
function regionCard(g){const all=!g,list=all?DEX:DEX.filter(p=>p.gen===g),h=list.filter(p=>has(p.no)).length,pr=list.length?h/list.length:0;
  const name=all?'Every region':GENS[g-1][1],c=all?['#ff4656','#3a0b12']:tc(GENKEY[g-1]);
  const arts=all?[25,6,150]:GEN_STARTERS[g];
  return `<button class="rcard" data-rg="${g}" aria-pressed="${gen===g}" aria-label="${all?'All 1,025 Pokémon':'Generation '+g+', '+name}" style="--c:${c[0]};--d:${c[1]};--p:${pr}">
    <span class="rc-bg"></span><span class="rc-gen">${all?'ALL':'GEN '+g}</span><span class="rc-name">${name}</span>
    <span class="rc-arts">${arts.map((n,i)=>`<img src="${ART(n)}" alt="" loading="lazy" style="--k:${i}" class="${has(n)?'':'sil'}">`).join('')}</span>
    <span class="rc-prog"><span class="rc-bar"><i></i></span><b>${h}</b>/${list.length}</span></button>`}
renderGens=function(){const el=$('#gens');el.classList.add('regions');el.classList.remove('filters');
  el.innerHTML=GEN_ORDER.map(regionCard).join('');requestAnimationFrame(()=>centreIn(el,el.querySelector('[aria-pressed="true"]'),false))};
function syncGens(){document.querySelectorAll('#gens .rcard').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.rg===gen));
  centreIn($('#gens'),$('#gens [aria-pressed="true"]'),!RM)}
function centreIn(sc,el,smooth){if(!sc||!el)return;const x=el.offsetLeft-(sc.clientWidth-el.offsetWidth)/2;sc.scrollTo({left:Math.max(0,x),behavior:smooth?'smooth':'auto'})}

/* ---------- status switch + type orbs ---------- */
renderFilters=function(){normFilt();const el=$('#filters');el.classList.remove('filters');el.classList.add('dexctl');
  el.innerHTML=`<div class="dseg" role="radiogroup" aria-label="Show"><span class="seg-thumb"></span>${STATUS.map(([k,l,ic])=>`<button class="seg-b" role="radio" data-st="${k}" aria-checked="${filt===k}">${ic}<span>${l}</span><em></em></button>`).join('')}</div>
   <div class="torbs" role="toolbar" aria-label="Type">${Object.keys(T).map(k=>`<button class="torb" data-ty="${k}" aria-pressed="${typeF===k}" style="--c:${T[k][0]};--d:${T[k][1]}"><span class="to-orb">${TYPE_IC[k]||'•'}</span><span class="to-l">${T[k][3]}</span></button>`).join('')}</div>`;
  el.classList.toggle('typed',!!typeF);syncSeg(true)};
function syncSeg(instant){const seg=$('#filters .dseg');if(!seg)return;normFilt();
  const base=DEX.filter(p=>(!gen||p.gen===gen)&&(!typeF||p.types.includes(typeF)));
  const n={all:base.length,caught:base.filter(p=>has(p.no)).length,wish:base.filter(p=>wish[p.no]).length};n.missing=n.all-n.caught;
  seg.querySelectorAll('.seg-b').forEach(b=>{b.setAttribute('aria-checked',b.dataset.st===filt);b.querySelector('em').textContent=n[b.dataset.st]});
  const on=seg.querySelector('[aria-checked="true"]'),th=seg.querySelector('.seg-thumb');
  if(on&&th){if(instant)th.style.transition='none';th.style.width=on.offsetWidth+'px';th.style.transform=`translateX(${on.offsetLeft}px)`;if(instant){void th.offsetWidth;th.style.transition=''}}
  document.querySelectorAll('#filters .torb').forEach(b=>b.setAttribute('aria-pressed',b.dataset.ty===typeF));
  $('#filters').classList.toggle('typed',!!typeF);
  const g=GENS.find(x=>x[0]===gen),tt=typeF?` · ${T[typeF][3]}`:'';$('#genTitle').textContent=(g?`Generation ${g[0]} · ${g[1]}`:'Every generation')+tt}
addEventListener('resize',()=>syncSeg(true));

/* our own listeners (the old .chip handlers in app.js find nothing and step aside) */
$('#gens').addEventListener('click',e=>{const b=e.target.closest('.rcard');if(!b)return;const g=+b.dataset.rg;if(g===gen)return;
  const dir=GEN_ORDER.indexOf(g)>GEN_ORDER.indexOf(gen)?1:-1;tap();setGen(g,dir)});
$('#filters').addEventListener('click',e=>{const s=e.target.closest('.seg-b');if(s){if(s.dataset.st===filt)return;filt=s.dataset.st;tap();syncSeg();regrid();return}
  const t=e.target.closest('.torb');if(t){typeF=typeF===t.dataset.ty?'':t.dataset.ty;tap();syncSeg();
    if(typeF){const sc=t.parentElement;centreIn(sc,t,!RM)}regrid()}});
function tap(){if(typeof sfx==='function')try{sfx('tap')}catch(e){}if(typeof buzz==='function')try{buzz(8)}catch(e){}}

/* ---------- generation paging: the grid slides like a page ---------- */
let gBusy=false;
async function setGen(g,dir,fromX){if(gBusy)return;gBusy=true;gen=g;syncGens();
  const grid=$('#grid'),head=$('#v-dex .h2');
  if(RM){renderGrid();grid.style.transform='';gBusy=false;return}
  const x0=fromX||0;
  grid.style.transition='clip-path 180ms var(--exit), transform 180ms var(--exit)';
  grid.style.clipPath=dir>0?'inset(0 100% 0 0)':'inset(0 0 0 100%)';grid.style.transform=`translateX(${x0-40*dir}px)`;
  head&&head.classList.remove('rise');
  await wait(180);renderGrid();
  grid.style.transition='none';grid.style.clipPath=dir>0?'inset(0 0 0 100%)':'inset(0 100% 0 0)';grid.style.transform=`translateX(${40*dir}px)`;void grid.offsetWidth;
  if(head){void head.offsetWidth;head.classList.add('rise')}
  grid.style.transition='clip-path var(--sp-lift-ms) var(--sp-lift), transform var(--sp-lift-ms) var(--sp-lift)';grid.style.clipPath='inset(0 0 0 0)';grid.style.transform='';
  setTimeout(()=>{grid.style.clipPath='';grid.style.transition='';gBusy=false},420)}

/* ---------- swipe engine ---------- */
const SW={on:false};
function scrollsX(el){for(let n=el;n&&n!==document.body;n=n.parentElement){
  if(n.matches&&n.matches('input,select,textarea,[data-noswipe],.binder,.covers,.fam-badges,.regions,.torbs,.dseg'))return true;
  const s=getComputedStyle(n);if((s.overflowX==='auto'||s.overflowX==='scroll')&&n.scrollWidth>n.clientWidth+2)return true}return false}
function swipeTarget(){
  if(catching||busy)return null;
  if(open)return open.side!=null?{kind:'card',el:hero}:null;
  if(document.querySelector('.stage.on,#welcome,#celeb:not([hidden]),#scanner:not([hidden]),.lvreveal'))return null;
  const sh=$('#sheet');if(sh&&!sh.hidden)return {kind:'sheet',el:sheetStack.length>1?sh.querySelector('.sh-body'):sh};
  if(cur===1)return {kind:'gen',el:$('#grid')};
  return {kind:'tab',el:$(VIEWS[cur])}}
addEventListener('touchstart',e=>{if(e.touches.length!==1){SW.on=false;return}const t=e.touches[0];
  if(t.clientX<22||t.clientX>innerWidth-22||scrollsX(e.target)){SW.on=false;return}const tg=swipeTarget();if(!tg){SW.on=false;return}
  Object.assign(SW,{on:true,lock:0,x:t.clientX,y:t.clientY,dx:0,t:performance.now(),vx:0,lx:t.clientX,lt:performance.now(),tg})},{passive:true});
addEventListener('touchmove',e=>{if(!SW.on)return;const t=e.touches[0],dx=t.clientX-SW.x,dy=t.clientY-SW.y;
  if(!SW.lock){if(Math.abs(dx)<10&&Math.abs(dy)<10)return;SW.lock=Math.abs(dx)>Math.abs(dy)*1.2?1:-1;
    if(SW.lock<0){SW.on=false;return}SW.tg.el.style.transition='none';if(SW.tg.kind==='sheet'&&SW.x>40&&dx<0){SW.on=false;return}}
  const now=performance.now();SW.vx=(t.clientX-SW.lx)/Math.max(1,now-SW.lt);SW.lx=t.clientX;SW.lt=now;SW.dx=dx;
  if(e.cancelable)e.preventDefault();
  const fx=follow(SW.tg,dx);if(SW.tg.kind==='card'){hero.style.translate=`${fx}px 0`;hero.style.rotate=`${fx/40}deg`}
  else if(SW.tg.kind==='tab'){SW.tg.el.style.translate=`${fx}px 0`;peek(dx,fx)}
  else SW.tg.el.style.transform=`translateX(${fx}px)`},{passive:false});
const pageW=()=>Math.min(innerWidth,$('#app').clientWidth);
function peek(dx,fx){const d=dx<0?1:-1,i=cur+d;
  if(SW.peek&&SW.peek.i!==i)hidePeek();
  if(!SW.peek&&i>=0&&i<VIEWS.length&&!tabEnd(dx)){const n=$(VIEWS[i]);if(i===4&&typeof renderTrainer==='function')renderTrainer();
    n.hidden=false;n.style.cssText='';n.style.transition='none';n.style.position='relative';n.style.top=scrollY+'px';n.style.pointerEvents='none';SW.peek={el:n,i,dir:d}}
  if(SW.peek)SW.peek.el.style.translate=`${SW.peek.dir*pageW()+fx}px 0`}
function hidePeek(){const p=SW.peek;if(!p)return;p.el.hidden=true;p.el.style.cssText='';SW.peek=null}
const genEnd=dx=>{const i=GEN_ORDER.indexOf(gen);return dx>0?i<=0:i>=GEN_ORDER.length-1};
const tabEnd=dx=>dx>0?cur<=0:cur>=VIEWS.length-1;
function edge(tg,dx){ // true when there is no page at all in that direction
  if(tg.kind==='card'){const L=cardList(),i=L.indexOf(open.p);return dx>0?i<=0:i<0||i>=L.length-1}
  if(tg.kind==='sheet')return dx<0;
  if(tg.kind==='gen')return genEnd(dx)&&tabEnd(dx); // past Gen 1 or All, the swipe carries on to the next tab
  return tabEnd(dx)}
function follow(tg,dx){if(edge(tg,dx))return dx*.18; // rubber band at the ends
  return tg.kind==='sheet'||tg.kind==='card'?dx:dx*.55}
addEventListener('touchend',()=>{if(!SW.on||SW.lock!==1){SW.on=false;return}SW.on=false;const {tg,dx,vx}=SW;
  const commit=!edge(tg,dx)&&(Math.abs(dx)>(tg.kind==='sheet'?110:70)||(Math.abs(vx)>.45&&Math.abs(dx)>24));
  if(!commit){if(tg.kind==='card')cardBack();else if(tg.kind==='tab')tabBack();else snapBack(tg.el);return}
  const x=follow(tg,dx),dir=dx<0?1:-1;
  if(tg.kind==='card'){nextCard(dir);return}
  if(tg.kind==='sheet'){swipeCloseSheet(tg.el,x);return}
  if(tg.kind==='gen'&&!genEnd(dx)){const g=GEN_ORDER[GEN_ORDER.indexOf(gen)+dir];tap();setGen(g,dir,x);return}
  tap();if(tg.kind==='gen'){const v=$(VIEWS[cur]);tg.el.style.transition='none';tg.el.style.transform='';v.style.translate=`${x}px 0`}
  swipeGo(cur+dir,dir,x)});
function tabBack(){const o=$(VIEWS[cur]),p=SW.peek,T='translate var(--sp-snap-ms) var(--sp-snap)';o.style.transition=T;o.style.translate='0 0';
  if(p){p.el.style.transition=T;p.el.style.translate=`${p.dir*pageW()}px 0`;const el=p.el;SW.peek=null;setTimeout(()=>{el.hidden=true;el.style.cssText=''},360)}
  setTimeout(()=>{o.style.transition='';o.style.translate=''},360)}
async function swipeGo(i,dir,x){if(RM){hidePeek();go(i);return}busy=true;const o=$(VIEWS[cur]),W=pageW();
  let n=$(VIEWS[i]);const peeked=SW.peek&&SW.peek.i===i;if(!peeked){hidePeek();n.hidden=false;n.style.cssText='';n.style.position='relative';n.style.top=scrollY+'px';n.style.transition='none';n.style.translate=`${dir*W+x}px 0`;void n.offsetWidth}
  SW.peek=null;n.style.pointerEvents='';if(typeof onTab==='function')onTab(i,cur);
  document.querySelectorAll('.tab').forEach(t=>{if(+t.dataset.tab===i)t.setAttribute('aria-current','page');else t.removeAttribute('aria-current')});
  $('#app').style.setProperty('--glow',GLOWS[i]);
  // both pages carry on together, like turning one page of a binder: same curve, same distance, no jump
  const T='translate 300ms var(--handoff)';o.style.transition=T;o.style.translate=`${-dir*W}px 0`;n.style.transition=T;n.style.translate='0 0';
  n.classList.remove('rise');void n.offsetWidth;n.classList.add('rise');
  await wait(300);o.hidden=true;o.style.cssText='';n.style.transition='none';n.style.top='';n.style.position='';n.style.translate='';scrollTo({top:0});cur=i;busy=false}
addEventListener('touchcancel',()=>{if(SW.on&&SW.lock===1){if(SW.tg.kind==='card')cardBack();else if(SW.tg.kind==='tab')tabBack();else snapBack(SW.tg.el)}SW.on=false});

/* the browser's own back (edge swipe, Android back button) becomes "back" inside the app, so he never falls out of it */
let backArmed=false;
function armBack(){if(backArmed)return;try{history.pushState({pkdx:1},'');backArmed=true}catch(e){}}
addEventListener('pointerdown',armBack,{capture:true,passive:true});
addEventListener('popstate',()=>{backArmed=false;appBack();armBack()});
function appBack(){const q=document.querySelector('.qov');if(q){q.click();return}
  if(open){if(!busy)closeTile();return}const s=$('#sheet');if(s&&!s.hidden){closeSheet();return}if(cur!==0&&!busy)go(0)}

/* ---------- swipe through Pokémon while a card is open ---------- */
function cardList(){return open&&open.el&&open.el.closest&&open.el.closest('#grid')?listFor():DEX.slice().sort((a,b)=>a.no-b.no)}
function cardBack(){hero.style.transition='translate var(--sp-snap-ms) var(--sp-snap), rotate var(--sp-snap-ms) var(--sp-snap)';hero.style.translate='0 0';hero.style.rotate='0deg';
  setTimeout(()=>{hero.style.transition='';hero.style.translate='';hero.style.rotate=''},360)}
let cardTok=0;
async function nextCard(dir){const L=cardList(),p=L[L.indexOf(open.p)+dir];if(!p){cardBack();return}busy=true;tap();
  const C=cardRect(),flipTo=0,tok=++cardTok;
  if(RM){paint(p);setHero(C.x,C.y,C.w,C.h,14,1,0,flipTo);hero.style.translate='';hero.style.rotate=''}
  else{ // the card leaves on Exit, the next one arrives from the other side on LIFT
    hero.style.transition='translate 180ms var(--exit), rotate 180ms var(--exit)';hero.style.translate=`${-dir*innerWidth}px 0`;hero.style.rotate=`${-dir*12}deg`;await wait(180);
    paint(p);setHero(C.x,C.y,C.w,C.h,14,1,0,flipTo);
    hero.style.transition='none';hero.style.translate=`${dir*innerWidth*.9}px 0`;hero.style.rotate=`${dir*10}deg`;void hero.offsetWidth;
    hero.style.transition='translate var(--sp-lift-ms) var(--sp-lift), rotate var(--sp-lift-ms) var(--sp-lift)';hero.style.translate='0 0';hero.style.rotate='0deg';
    if(typeof sfx==='function')try{sfx('flip')}catch(e){}}
  // keep the grid in step so "put it back" lands on the right tile
  const inGrid=open.el.closest&&open.el.closest('#grid');open.p=p;open.side=flipTo;
  if(inGrid){const t=$(`#grid .tile[data-no="${p.no}"]`);if(t){open.el.style.visibility='';t.style.visibility='hidden';
    const r0=t.getBoundingClientRect();if(r0.top<80||r0.bottom>innerHeight-110)scrollBy(0,r0.top-innerHeight/2+r0.height/2);
    const r=t.getBoundingClientRect();Object.assign(open,{el:t,a:{x:r.left+r.width/2,y:r.top+r.height/2},w:r.width,h:r.height})}}
  hintFor(p);setTimeout(()=>{busy=false},RM?0:220); // ready for the next swipe straight away
  setTimeout(()=>{if(tok===cardTok&&!SW.on){hero.style.transition='';hero.style.translate='';hero.style.rotate=''}},RM?0:680)}
function hintFor(p){const h=$('#closeHint');if(!h||!open)return;h.hidden=false;h.textContent=has(p.no)?'Tap to turn it over · swipe for the next one':'Who\'s that Pokémon? Swipe for the next one'}
const _openTile=openTile;openTile=async function(el){await _openTile(el);if(open)hintFor(open.p)};
function snapBack(el){el.style.transition='transform var(--sp-snap-ms) var(--sp-snap)';el.style.transform='';setTimeout(()=>{el.style.transition=''},360)}
async function swipeCloseSheet(s,x){
  if(sheetStack.length>1){await sheetBack($('#sheet'));return}
  s.style.transition='transform 200ms var(--exit)';s.style.transform=`translateX(${innerWidth}px)`;await wait(200);
  s.style.transition='none';s.style.clipPath='inset(100% 0 0 0)';await closeSheet();s.style.transform=''}

/* going back inside a sheet moves backwards: the page leaves to the right, the previous one returns from the left */
async function sheetBack(s){const prev=sheetStack[sheetStack.length-2],body=s.querySelector('.sh-body'),W=innerWidth;
  const swap=()=>{sheetStack.pop();s.querySelector('.sh-title').textContent=prev.title;body.innerHTML='';prev.render(body);s.scrollTop=0};
  if(RM){swap();body.style.cssText='';return}
  body.style.transition='transform 200ms var(--exit), clip-path 200ms var(--exit)';body.style.transform=`translateX(${W*.6}px)`;body.style.clipPath='inset(0 0 0 100%)';await wait(200);
  swap();body.style.transition='none';body.style.clipPath='inset(0 100% 0 0)';body.style.transform='translateX(-28px)';void body.offsetWidth;
  body.style.transition='clip-path var(--sp-lift-ms) var(--sp-lift), transform var(--sp-lift-ms) var(--sp-lift)';body.style.clipPath='inset(0 0 0 0)';body.style.transform='none';riseIn(body);
  setTimeout(()=>{body.style.transition='';body.style.clipPath=''},640)}
{const _csB=closeSheet;closeSheet=async function(all){const s=$('#sheet');if(!all&&s&&!s.hidden&&sheetStack.length>1)return sheetBack(s);return _csB(all)}}

/* the Pokédex hint now teaches the swipe */
(function(){const s=$('#v-dex .sub .mask>span');if(s)s.textContent='Swipe for the next region. Tap a Pokémon to flip its card.';
  renderGens();renderFilters();if(!$('#v-dex').hidden)renderGrid()})();
