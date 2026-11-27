/* cardup.js: the trainer card gets a new design at every rank, and he picks the
   colour behind his partner Pokémon. Motion (MeFit): foil sweeps run on the --L master
   clock, the holo frame turns slowly, nothing fades. */

const CARD_TIERS=[[1,'rookie','Rookie card'],[3,'trainer','Trainer card'],[6,'bronze','Bronze card'],[10,'silver','Silver card'],
  [15,'gold','Gold card'],[22,'holo','Holo card'],[30,'champion','Champion card'],[45,'master','Master card']];
const cardTier=lv=>[...CARD_TIERS].reverse().find(t=>lv>=t[0]);
const nextTier=lv=>CARD_TIERS.find(t=>t[0]>lv);
const AV_COLOURS=[['auto','My type'],...Object.keys(T).map(k=>[k,T[k][3]]),['gold','Gold'],['night','Night'],['rainbow','Rainbow']];
function avColour(){const k=prof.bg||'auto';if(k==='gold')return '#ffcf3a';if(k==='night')return '#3a3f7a';if(k==='rainbow')return 'rainbow';
  return T[k]?T[k][0]:(prof.fav?tc(prof.fav)[0]:'#ff4656')}
function levelNow(){const A=albums();return Math.floor(xpOf(A)/LV)+1}
function paintAvatars(){const c=avColour();document.querySelectorAll('.avatar').forEach(a=>{a.classList.add('avc');a.classList.toggle('av-rainbow',c==='rainbow');if(c!=='rainbow')a.style.setProperty('--av',c)})}
function paintCards(lv){lv=lv||levelNow();const t=cardTier(lv),cls='cf-'+t[1];
  document.querySelectorAll('.trainer,#trainerBody .tcard').forEach(el=>{el.className=el.className.replace(/\bcf-\w+/g,'').trim()+' '+cls;
    let b=el.querySelector(':scope>.cf-badge');if(!b){b=document.createElement('span');b.className='cf-badge';el.appendChild(b)}b.textContent=t[2];
    if(!el.querySelector(':scope>.cf-fx')){const f=document.createElement('span');f.className='cf-fx';f.setAttribute('aria-hidden','true');el.prepend(f)}});
  paintAvatars()}
const _rhC=renderHomeExtra;renderHomeExtra=function(A,xp,lv){_rhC(A,xp,lv);paintCards(lv)};
if(typeof renderTrainer==='function'){const _rtC=renderTrainer;renderTrainer=function(){_rtC();const lv=levelNow(),nt=nextTier(lv),tc0=$('#trainerBody .tcard');
  if(tc0&&nt)tc0.insertAdjacentHTML('beforeend',`<div class="cf-next">✨ New card design at level ${nt[0]}</div>`);paintCards(lv)}}
const _apC=applyProfile;applyProfile=function(){_apC();paintAvatars()};

/* the profile page gains a colour picker (and shows every card design he can unlock) */
openProfile=function(){openSheet('My trainer card',body=>{const A=albums(),xp=xpOf(A),lv=Math.floor(xp/LV)+1,cur0=prof.bg||'auto';
  body.innerHTML=`<div class="pf-card"><div class="avatar big">${partnerArt()}</div><div class="mask"><span class="pf-name">${esc(prof.name||'Trainer')}</span></div><div class="mask"><span class="muted">${rankOf(lv)} · ${titleOf(A)}</span></div></div>
   <label class="fl">My name<input id="pfName" maxlength="20" value="${esc(prof.name||'')}" placeholder="Type your name"></label>
   <div class="sec">Colour behind my partner</div><div class="avcols">${AV_COLOURS.map(([k,l])=>{const c=k==='auto'?(prof.fav?tc(prof.fav)[0]:'#ff4656'):k==='gold'?'#ffcf3a':k==='night'?'#3a3f7a':k==='rainbow'?'':T[k][0];
     return `<button class="avcol ${k==='rainbow'?'rb':''}" data-bg="${k}" aria-pressed="${cur0===k}" aria-label="${l}" style="--c:${c}"><i></i><span>${l}</span></button>`}).join('')}</div>
   <div class="sec">My partner Pokémon</div><div class="partners">${PARTNERS.map(n=>`<button class="partner ${prof.partner===n?'on':''}" data-pn="${n}"><img src="${ART(n)}" alt="">${esc(byNo(n).name)}</button>`).join('')}</div>
   <div class="sec">My favourite type</div><div class="filters wrap">${Object.keys(T).map(k=>`<button class="chip" data-ft="${k}" aria-pressed="${prof.fav===k}" style="--c:${T[k][0]}"><span class="dot"></span>${T[k][3]}</button>`).join('')}</div>
   <div class="sec">Card designs</div><div class="cf-list">${CARD_TIERS.map(t=>`<div class="cf-mini cf-${t[1]} ${lv>=t[0]?'got':''}"><span class="cf-fx"></span><b>${t[2]}</b><span>${lv>=t[0]?'Unlocked':'Level '+t[0]}</span></div>`).join('')}</div>`;
  paintAvatars();
  body.querySelector('#pfName').addEventListener('change',e=>{prof.name=e.target.value.trim().slice(0,20)||'Trainer';save2();applyProfile()});
  body.addEventListener('click',e=>{const bg=e.target.closest('[data-bg]');if(bg){prof.bg=bg.dataset.bg;save2();body.querySelectorAll('[data-bg]').forEach(b=>b.setAttribute('aria-pressed',b===bg));paintAvatars();
      const av=body.querySelector('.avatar.big');if(av&&!RM){av.classList.remove('avpop');void av.offsetWidth;av.classList.add('avpop')}if(typeof sfx==='function')sfx('tap');return}
    const pn=e.target.closest('[data-pn]');if(pn){prof.partner=+pn.dataset.pn;save2();applyProfile();refreshSheet()}
    const ft=e.target.closest('[data-ft]');if(ft){prof.fav=ft.dataset.ft;save2();applyProfile();refreshSheet()}})})};
