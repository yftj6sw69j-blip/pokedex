/* cert.js: a printable certificate for every album he completes (regions, sets, types, mini collections).
   Motion (MeFit): the certificate unrolls behind a mask and the seal stamps down on SNAP. */
function certFor(id){const a=findAlbum(id);if(!a||a.p<1)return null;const k=id.split(':');
  const what=id.startsWith('gen:')?`caught every Pokémon in the <b>${GENS[+k[1]-1][1]}</b> region`:a.isSet?`collected every card in the <b>${esc(a.name)}</b> set`:
    id.startsWith('type:')?`caught every <b>${T[k[1]][3]}</b> type Pokémon`:`completed <b>${esc(a.name)}</b>`;
  const arts=id.startsWith('gen:')?GEN_STARTERS[+k[1]]:(a.all||[]).slice(0,3).map(p=>p.no);
  return {a,what,arts}}
function certHTML(id){const c=certFor(id);if(!c)return '';const {a,what,arts}=c,col=tc(a.key);
  const when=(prof.certs&&prof.certs[id])||new Date().toISOString().slice(0,10);
  const d=new Date(when+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  return `<div class="cert" style="--c:${col[0]}"><div class="ct-in">
    <div class="ct-ball"></div><div class="ct-k">Official Pokédex</div><div class="ct-t">Certificate of Completion</div>
    <div class="ct-s">This certifies that</div><div class="ct-name">${esc(prof.name||'Trainer')}</div>
    <div class="ct-w">has ${what}</div><div class="ct-n">${a.tot} of ${a.tot} · ${rankOf(Math.floor(xpOf(albums())/LV)+1)}</div>
    <div class="ct-arts">${arts.filter(Boolean).map(n=>`<img src="${ART(n)}" alt="">`).join('')}</div>
    <div class="ct-foot"><div><span class="ct-line">${d}</span><small>Date</small></div><div class="ct-seal"><span>★</span></div><div><span class="ct-line"></span><small>Signed by a grown-up</small></div></div></div></div>`}
function openCert(id){if(!certFor(id))return;prof.certs=prof.certs||{};if(!prof.certs[id]){prof.certs[id]=new Date().toISOString().slice(0,10);save2()}
  openSheet('My certificate',body=>{body.innerHTML=`<div class="ct-wrap">${certHTML(id)}</div><button class="cta ct-print">🖨️ Print my certificate</button><p class="hint">Ask a grown-up to print it, then sign it and pin it on your wall!</p>`;
    body.querySelector('.ct-print').addEventListener('click',()=>{const p=document.createElement('div');p.className='certprint';p.innerHTML=certHTML(id);document.body.appendChild(p);
      const done=()=>{p.remove();removeEventListener('afterprint',done)};addEventListener('afterprint',done);setTimeout(()=>{try{print()}catch(e){toast('Printing isn\'t available here. Try from the browser menu.')}},120)})})}
// complete albums get a certificate button where the next-trophy text was
const _ntC=nextTierText;nextTierText=function(a){const t=_ntC(a);return a.p>=1&&a.id?`${t} <button class="ct-btn" data-cert="${a.id}">🎓 My certificate</button>`:t};
document.addEventListener('click',e=>{const b=e.target.closest('[data-cert]');if(b){e.stopPropagation();openCert(b.dataset.cert)}},true);
// the Trophy room lists every certificate he has earned
function certList(){const b=$('#sheet .sh-body');if(!b||b.querySelector('.ct-list'))return;const A=albums(),done=[...A.gen,...A.set,...A.type,...A.mini].filter(a=>a.p>=1);
  b.insertAdjacentHTML('afterbegin',`<div class="sec">My certificates (${done.length})</div><div class="ct-list">${done.length?done.map(a=>`<button class="ct-mini" data-cert="${a.id}"><span>🎓</span>${esc(a.name)}</button>`).join(''):'<p class="hint">Complete any album to earn a printable certificate.</p>'}</div>`)}
const _otC=openTrophies;openTrophies=function(){_otC();[30,260,520].forEach(t=>setTimeout(()=>{if($('#sheet .sh-title')?.textContent==='Trophy room')certList()},t))};
