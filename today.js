/* today.js: a calmer home. Goal, weekly challenges and Pokémon of the day live in one
   swipeable "Today" stack; spare / wish / packs and "Nearly there" move to the Trainer page.
   Motion (MeFit): slides snap on the scroller, the active dot stretches on SNAP, no fades. */
(function(){const home=$('#v-home'),hb=$('#homeBody'),cta=home.querySelector('.cta');
  const wrap=document.createElement('section');wrap.className='today';wrap.setAttribute('aria-label','Today');
  wrap.innerHTML='<div class="sec">Today <span class="td-hint">swipe ›</span></div><div class="td-track" id="tdTrack"></div><div class="td-dots" id="tdDots"></div>';
  cta.after(wrap);const tr=wrap.querySelector('.td-track');
  [['goalCard','Your next goal'],['weekBox','This week'],['potd','Pokémon of the day']].forEach(([id,l])=>{const el=$('#'+id);if(!el)return;
    const sl=document.createElement('div');sl.className='td-slide';sl.dataset.for=id;sl.setAttribute('aria-label',l);
    if(el.previousElementSibling&&el.previousElementSibling.classList.contains('sec')&&el.parentElement===hb)el.previousElementSibling.remove();
    sl.appendChild(el);tr.appendChild(sl)});
  // tidy: trade counters and "Nearly there" now live on the Trainer page
  home.querySelector('.trade')?.classList.add('gone');const nr=$('#near');if(nr){nr.previousElementSibling?.classList.contains('sec')&&nr.previousElementSibling.classList.add('gone');nr.classList.add('gone')}
  tr.addEventListener('scroll',()=>{cancelAnimationFrame(tr._r);tr._r=requestAnimationFrame(tdDots)},{passive:true});
  $('#tdDots').addEventListener('click',e=>{const d=e.target.closest('[data-di]');if(!d)return;const s=[...tr.querySelectorAll('.td-slide:not(.empty)')][+d.dataset.di];if(s)tr.scrollTo({left:s.offsetLeft-tr.offsetLeft-0,behavior:RM?'auto':'smooth'})})})();
function tdSync(){const tr=$('#tdTrack');if(!tr)return;tr.querySelectorAll('.td-slide').forEach(s=>{const el=s.firstElementChild;s.classList.toggle('empty',!el||!el.innerHTML.trim())});
  const n=tr.querySelectorAll('.td-slide:not(.empty)').length;$('.today').hidden=n===0;$('#tdDots').innerHTML=n>1?Array.from({length:n},(_,i)=>`<button data-di="${i}" aria-label="Card ${i+1} of ${n}"></button>`).join(''):'';
  $('.today .td-hint').hidden=n<2;tdDots()}
function tdDots(){const tr=$('#tdTrack');if(!tr)return;const S=[...tr.querySelectorAll('.td-slide:not(.empty)')];let k=0,best=1e9;
  S.forEach((s,i)=>{const d=Math.abs(s.offsetLeft-tr.offsetLeft-tr.scrollLeft);if(d<best){best=d;k=i}});
  document.querySelectorAll('#tdDots button').forEach((b,i)=>b.classList.toggle('on',i===k))}
const _rhT=renderHomeExtra;renderHomeExtra=function(A,xp,lv){_rhT(A,xp,lv);tdSync()};
if(typeof renderTrainer==='function'){const _rtT=renderTrainer;renderTrainer=function(){_rtT();const d=$('#trainerBody .doors');if(!d||$('#trainerBody .nearT'))return;
  const A=albums(),all=[...A.gen,...A.type,...A.mini,...A.set],near=all.filter(a=>a.p<1&&a.have>0).sort((a,b)=>(a.tot-a.have)-(b.tot-b.have)||b.p-a.p).slice(0,3);
  if(near.length)d.insertAdjacentHTML('afterend',`<div class="sec nearT">Nearly there</div><div class="near">${near.map(albumRow).join('')}</div>`)}}
