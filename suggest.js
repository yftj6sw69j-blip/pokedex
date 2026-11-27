/* suggest.js: the Add search helps young spellers. As he types, a ghost finishes the
   name inside the box and picture chips offer the best matches, even when it's misspelt
   ("pikahcu", "charzard"). Tap a chip, or press Find, to search the top match.
   Motion (MeFit): chips rise behind a mask in a 3-frame stagger; nothing fades. */
const normName=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]/g,'');
function editDist(a,b){const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let prev=Array.from({length:n+1},(_,j)=>j),pp=null;
  for(let i=1;i<=m;i++){const cur=[i];for(let j=1;j<=n;j++){let v=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
      if(pp&&i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])v=Math.min(v,pp[j-2]+1);cur.push(v)}pp=prev;prev=cur}return prev[n]}
function suggestFor(q,max=6){q=normName(q);if(q.length<1||!DEX.length)return [];const out=[];
  DEX.forEach(p=>{const n=p._n||(p._n=normName(p.name));let s=null;
    if(n.startsWith(q))s=0+n.length/100;
    else if(q.length>=2&&n.includes(q))s=2+n.indexOf(q)/50;
    else if(q.length>=3){const tol=q.length>=6?2:1,d=Math.min(editDist(q,n.slice(0,q.length)),editDist(q,n.slice(0,q.length+1)),editDist(q,n.slice(0,Math.max(1,q.length-1))));
      if(d<=tol)s=3+d;else if(q.length>=5&&editDist(q,n)<=2)s=5}
    if(s!==null)out.push([s,p])});
  return out.sort((a,b)=>a[0]-b[0]||a[1].no-b[1].no).slice(0,max).map(x=>x[1])}
(function(){const inp=$('#search'),form=$('#findForm');if(!inp||!form)return;
  const box=document.createElement('div');box.className='sg-box';inp.parentNode.insertBefore(box,inp);box.appendChild(inp);
  const ghost=document.createElement('div');ghost.className='sg-ghost';ghost.setAttribute('aria-hidden','true');box.appendChild(ghost);
  const chips=document.createElement('div');chips.className='sg-chips';chips.setAttribute('role','listbox');chips.setAttribute('aria-label','Suggestions');form.after(chips);
  let top=null;
  const draw=()=>{const v=inp.value;top=null;
    if(!v.trim()||/\d/.test(v)){ghost.innerHTML='';chips.innerHTML='';return}
    const L=suggestFor(v);top=L[0]||null;const n=top?top.name:'';
    ghost.innerHTML=top&&normName(n).startsWith(normName(v))&&n.toLowerCase().startsWith(v.toLowerCase())?`<span>${esc(v)}</span>${esc(n.slice(v.length))}`:'';
    chips.innerHTML=L.length?L.map((p,i)=>`<button type="button" class="sg-chip" role="option" data-sg="${p.no}" style="--i:${i};--c:${tc(p.types[0])[0]}"><img src="${ART(p.no)}" alt="" loading="lazy">${esc(p.name)}${has(p.no)?'<em>✓</em>':''}</button>`).join(''):`<p class="sg-none">Hmm, no Pokémon like that. Try the first few letters.</p>`;
    chips.classList.remove('rise');void chips.offsetWidth;chips.classList.add('rise')};
  inp.addEventListener('input',draw);inp.addEventListener('focus',draw);
  // accept the ghost with Tab or the right arrow (keyboards), or with Find
  inp.addEventListener('keydown',e=>{if((e.key==='Tab'||e.key==='ArrowRight')&&ghost.textContent&&inp.selectionStart===inp.value.length&&top){e.preventDefault();inp.value=top.name;draw()}});
  addEventListener('submit',e=>{if(e.target!==form)return;const v=inp.value.trim();if(!v||/\d/.test(v)||!top)return;
    if(normName(v)!==normName(top.name)&&!DEX.some(p=>normName(p.name)===normName(v)))inp.value=top.name;ghost.innerHTML='';chips.innerHTML=''},true);
  chips.addEventListener('click',e=>{const b=e.target.closest('[data-sg]');if(!b)return;const p=byNo(+b.dataset.sg);inp.value=p.name;ghost.innerHTML='';chips.innerHTML='';
    if(typeof sfx==='function')sfx('tap');inp.blur();find(p.name)});
  // results replace the chips once a search runs
  const _find=find;find=function(q){chips.innerHTML='';ghost.innerHTML='';return _find(q)}})();
