/* vault.js: the Treasure vault (the 100 most valuable Pokémon cards ever, plus a search across
   every card ranked by value) and the Type wheel (who beats who).
   Motion (MeFit): podium cards rise in behind masks, the wheel turns on a spring so the chosen
   type rides to the top, beat-lines draw on along their length. Nothing fades. */

/* ================= Treasure vault ================= */
const VAULT_KEY='pokedex.vault.v1';
async function tcgTry(url,tries=5){for(let a=0;a<tries;a++){try{const r=await fetch(url);if(r.ok)return await r.json()}catch(e){}await new Promise(r=>setTimeout(r,900*(a+1)))}return null}
const vaultMap=c=>({id:c.id,name:c.name,set:c.set?.name||'',year:(c.set?.releaseDate||'').slice(0,4),rarity:c.rarity||'',img:c.images?.small||'',big:c.images?.large||c.images?.small||'',no:(c.nationalPokedexNumbers||[])[0],gbp:gbpOf(c)});
async function vaultTop(){try{const c=JSON.parse(localStorage.getItem(VAULT_KEY)||'null');if(c&&Date.now()-c.t<864e5*3)return c.L}catch(e){}
  const j=await tcgTry(`${TCG}?pageSize=100&q=supertype:pokemon&orderBy=-cardmarket.prices.trendPrice&select=id,name,rarity,set,images,cardmarket,nationalPokedexNumbers`);
  if(!j)return null;const L=j.data.map(vaultMap).filter(x=>x.gbp!=null);try{localStorage.setItem(VAULT_KEY,JSON.stringify({t:Date.now(),L}))}catch(e){}return L}
async function vaultSearch(q){q=q.trim().replace(/["*]/g,'');if(q.length<2)return [];
  const j=await tcgTry(`${TCG}?pageSize=30&q=${encodeURIComponent(`supertype:pokemon name:"*${q}*"`)}&orderBy=-cardmarket.prices.trendPrice&select=id,name,rarity,set,images,cardmarket,nationalPokedexNumbers`,4);
  return j?j.data.map(vaultMap).filter(x=>x.gbp!=null):null}
const ownsId=id=>Object.values(own).some(L=>L.some(c=>c.id===id));
function vaultRow(x,i){const mine=ownsId(x.id),dexHas=x.no&&has(x.no);
  return `<div class="vt-row ${mine?'mine':''}"><span class="vt-rank">${i+1}</span><button class="vt-th" data-vbig="${esc(x.big)}" aria-label="See ${esc(x.name)} big"><img src="${esc(x.img)}" alt="" loading="lazy"></button>
    <span class="vt-tx"><b>${esc(x.name)}</b><small>${esc(x.set)}${x.year?' · '+x.year:''}</small>${valueHTML(x.rarity,x.id,x.gbp)}${mine?'<em class="vt-mine">★ You have this card!</em>':dexHas?'<em class="vt-dex">You have a '+esc(byNo(x.no)?.name||'')+' card</em>':''}</span></div>`}
function vaultPodium(L){const P=[L[1],L[0],L[2]].filter(Boolean),cls=['p2','p1','p3'];
  return `<div class="vt-pod">${P.map((x,k)=>`<button class="vt-pc ${cls[k]}" data-vbig="${esc(x.big)}"><span class="vt-crown">${cls[k]==='p1'?'👑':cls[k]==='p2'?'🥈':'🥉'}</span><span class="vt-img"><img src="${esc(x.img)}" alt=""></span><b>${esc(x.name)}</b><small>${showGBP()?fmtGBP(x.gbp):'🪙🪙🪙🪙🪙'}</small><i class="vt-step">${cls[k].slice(1)}</i></button>`).join('')}</div>`}
function openVault(){openSheet('Treasure vault',async body=>{
  body.innerHTML=`<div class="vt-wrap"><div class="vt-hero"><span class="vt-door" aria-hidden="true"></span><div><b>The most valuable Pokémon cards ever</b><small>Ranked by what collectors pay for them today</small></div></div>
    <form class="vt-q" id="vtForm"><input id="vtQ" class="search" placeholder="Search any Pokémon, like Charizard" autocomplete="off" enterkeyhint="search"><button class="go" type="submit">Find</button></form>
    <div id="vtBody"><p class="hint vt-load">Opening the vault…</p></div></div>`;
  const W=body.firstElementChild,out=W.querySelector('#vtBody');let top=null;
  const showTop=()=>{if(!top){out.innerHTML='<p class="hint">The vault is stuck shut right now. Check you\'re online, then try again. <button class="sec-link" id="vtRetry">Try again</button></p>';return}
    out.innerHTML=vaultPodium(top)+`<div class="sec">Top 100</div><div class="vt-list">${top.slice(0,100).map(vaultRow).join('')}</div><p class="hint">Values are rough guides for perfect copies. Most cards in packs are worth much less, so keep collecting the ones you love!</p>`};
  W.addEventListener('click',e=>{const b=e.target.closest('[data-vbig]');if(b){vaultZoom(b.dataset.vbig);return}if(e.target.closest('#vtRetry')){localStorage.removeItem(VAULT_KEY);refreshSheet()}});
  W.querySelector('#vtForm').addEventListener('submit',async e=>{e.preventDefault();const q=W.querySelector('#vtQ').value;W.querySelector('#vtQ').blur();if(!q.trim()){showTop();return}
    out.innerHTML='<p class="hint vt-load">Searching every card…</p>';const R=await vaultSearch(q);if(!out.isConnected)return;
    out.innerHTML=R===null?'<p class="hint">Couldn\'t search right now. Try again in a moment.</p>':!R.length?`<p class="hint">No cards found for "${esc(q)}". Check the spelling?</p>`:
      `<div class="sec">Most valuable ${esc(q)} cards <button class="sec-link" id="vtBack">Top 100 ›</button></div><div class="vt-list">${R.map(vaultRow).join('')}</div>`;
    out.querySelector('#vtBack')?.addEventListener('click',showTop)});
  W.querySelector('#vtQ').addEventListener('input',e=>{if(!e.target.value.trim()&&top)showTop()});
  top=await vaultTop();if(out.isConnected)showTop()})}
function vaultZoom(src){const ov=document.createElement('div');ov.className='vt-zoom';ov.innerHTML=`<img src="${esc(src)}" alt=""><span>Tap to close</span>`;
  document.body.appendChild(ov);void ov.offsetWidth;ov.classList.add('on');ov.addEventListener('click',()=>{ov.classList.remove('on');ov.classList.add('off');setTimeout(()=>ov.remove(),RM?0:260)})}

/* ================= Type wheel ================= */
const NOHIT={normal:['ghost'],fighting:['ghost'],poison:['steel'],ground:['flying'],ghost:['normal'],electric:['ground'],psychic:['dark'],dragon:['fairy']};
const TW_ORDER=['fire','grass','water','electric','ground','rock','ice','flying','bug','poison','fairy','dragon','steel','fighting','normal','ghost','psychic','dark'];
let twSel='fire',twRot=0;
const weakTo=t=>TW_ORDER.filter(k=>(STRONG[k]||[]).includes(t));
function openTypeWheel(start){twSel=start||prof.fav||twSel;openSheet('Type wheel',body=>{const R=128,cx=160,cy=160;
  body.innerHTML=`<div class="tw-wrap"><p class="sub">Tap a type to see who it beats. Use it to win card battles!</p>
    <div class="tw-stage"><svg class="tw-lines" viewBox="0 0 320 320" aria-hidden="true"></svg><div class="tw-ring">${TW_ORDER.map((k,i)=>{const a=i/TW_ORDER.length*Math.PI*2-Math.PI/2;
      return `<button class="tw-orb" data-tw="${k}" style="--c:${T[k][0]};--d:${T[k][1]};left:${cx+R*Math.cos(a)}px;top:${cy+R*Math.sin(a)}px" aria-label="${T[k][3]}"><span>${TYPE_IC[k]||'•'}</span></button>`}).join('')}</div>
      <div class="tw-core"><span class="tw-big"></span><b class="tw-name"></b></div></div>
    <div class="tw-legend"><span class="lg-win">Beats</span><span class="lg-lose">Beaten by</span></div>
    <div class="tw-facts"></div></div>`;
  const W=body.firstElementChild;W.addEventListener('click',e=>{const o=e.target.closest('[data-tw]');if(!o)return;twSel=o.dataset.tw;if(typeof sfx==='function')sfx('tap');twPaint(W,true)});
  twPaint(W,false)})}
function twPaint(W,anim){const k=twSel,i=TW_ORDER.indexOf(k),R=128,cx=160,cy=160,n=TW_ORDER.length;
  // turn the wheel the short way so the chosen type rides to the top
  const want=-i*360/n;let d=((want-twRot)%360+540)%360-180;twRot+=d;const ring=W.querySelector('.tw-ring');ring.style.setProperty('--rot',twRot+'deg');ring.classList.toggle('still',!anim||RM);
  const beat=STRONG[k]||[],lose=weakTo(k),none=NOHIT[k]||[];
  W.querySelectorAll('.tw-orb').forEach(o=>{const t=o.dataset.tw;o.classList.toggle('on',t===k);o.classList.toggle('win',beat.includes(t));o.classList.toggle('lose',lose.includes(t));o.setAttribute('aria-pressed',t===k)});
  const pos=t=>{const j=TW_ORDER.indexOf(t),a=(j-i)/n*Math.PI*2-Math.PI/2;return [cx+R*Math.cos(a),cy+R*Math.sin(a)]};
  const line=(t,cls,idx)=>{const [x,y]=pos(t),ux=(x-cx),uy=(y-cy),L=Math.hypot(ux,uy),s=(L-26)/L,e=48/L;
    const x1=cx+ux*e,y1=cy+uy*e,x2=cx+ux*s,y2=cy+uy*s;return `<line class="${cls}" x1="${cls==='lose'?x2:x1}" y1="${cls==='lose'?y2:y1}" x2="${cls==='lose'?x1:x2}" y2="${cls==='lose'?y1:y2}" style="--i:${idx}" pathLength="1" marker-end="url(#ar-${cls})"/>`};
  W.querySelector('.tw-lines').innerHTML=`<defs><marker id="ar-win" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#3ddc84"/></marker><marker id="ar-lose" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#ff5a6a"/></marker></defs>`+
    beat.map((t,j)=>line(t,'win',j)).join('')+lose.map((t,j)=>line(t,'lose',j+beat.length)).join('');
  const lines=W.querySelector('.tw-lines');lines.classList.remove('draw');if(!RM){void lines.getBoundingClientRect();lines.classList.add('draw')}else lines.classList.add('drawn');
  const core=W.querySelector('.tw-core');core.style.setProperty('--c',T[k][0]);core.style.setProperty('--d',T[k][1]);W.querySelector('.tw-big').textContent=TYPE_IC[k]||'';W.querySelector('.tw-name').textContent=T[k][3];
  if(anim&&!RM){core.classList.remove('pop');void core.offsetWidth;core.classList.add('pop')}
  const chips=L=>L.map(t=>`<button class="tw-chip" data-tw="${t}" style="--c:${T[t][0]}"><span>${TYPE_IC[t]||''}</span>${T[t][3]}</button>`).join('');
  W.querySelector('.tw-facts').innerHTML=`<div class="tw-f win"><b>💪 ${T[k][3]} is strong against</b><div>${beat.length?chips(beat):'<span class="hint">Nothing! Normal types are good all-rounders.</span>'}</div></div>
    <div class="tw-f lose"><b>⚠️ Watch out for</b><div>${lose.length?chips(lose):'<span class="hint">Nothing beats it easily.</span>'}</div></div>
    ${none.length?`<div class="tw-f none"><b>🛡️ Can't hurt at all</b><div>${chips(none)}</div></div>`:''}
    <p class="hint">Example: a ${T[k][3]} card ${beat.length?`beats a ${T[beat[0]][3]} card`:'has no easy wins'}${lose.length?`, but a ${T[lose[0]][3]} card beats it`:''}.</p>`}

/* doors: Trainer page tiles, plus a link from Card battles */
if(typeof renderTrainer==='function'){const _rtVt=renderTrainer;renderTrainer=function(){_rtVt();const g=$('#trainerBody .play-grid');if(g&&!g.querySelector('.pc-vault')){
  g.insertAdjacentHTML('beforeend',`<button class="pcard pc-vault" data-fn="openVault"><b>Treasure vault</b><span>The most valuable cards ever</span></button><button class="pcard pc-wheel" data-fn="openTypeWheel"><b>Type wheel</b><span>Who beats who?</span></button>`)}}}
if(typeof openBattles==='function'){const _obT=openBattles;openBattles=function(){_obT();setTimeout(()=>{const b=$('#sheet .sh-body');if(b&&$('#sheet .sh-title')?.textContent==='Card battles'&&!b.querySelector('.tw-link'))
  b.insertAdjacentHTML('beforeend','<button class="vr-door tw-link" data-fn="openTypeWheel"><span class="vr-di">🎡</span><span><b>Type wheel</b><small>See which types beat which</small></span><span class="chev">›</span></button>')},80)}}
