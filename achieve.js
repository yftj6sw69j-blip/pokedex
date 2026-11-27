/* achieve.js: special one-off trophies in a cabinet at the top of the Trophy room.
   Each is worth +50 XP. New ones are celebrated once with a toast and sound.
   Motion (MeFit): won trophies stamp in on SNAP, the info panel rises behind a mask. */

const ACH_XP=50;
const cardsAll=()=>Object.values(own).flat();
const ownedNos=()=>Object.keys(own).filter(k=>own[k].length).map(Number);
function giftStreak(){const D=(prof.giftLog||[]).slice().sort();let s=0,d=new Date();for(;;){const k=d.toISOString().slice(0,10);if(D.includes(k)){s++;d.setDate(d.getDate()-1)}else if(s===0&&k===today()){d.setDate(d.getDate()-1)}else break}return s}
const ACH=[
  ['first','🃏','First card','Add your very first card',()=>cardsAll().length>=1],
  ['c10','📚','Card stack','Have 10 cards',()=>cardsAll().length>=10],
  ['c50','🗃️','Card pile','Have 50 cards',()=>cardsAll().length>=50],
  ['c100','🏰','Card castle','Have 100 cards',()=>cardsAll().length>=100],
  ['c250','🗻','Card mountain','Have 250 cards',()=>cardsAll().length>=250],
  ['c500','🌌','Card galaxy','Have 500 cards',()=>cardsAll().length>=500],
  ['p25','🔎','Explorer','Catch 25 different Pokémon',()=>ownedNos().length>=25],
  ['p100','🧭','Adventurer','Catch 100 different Pokémon',()=>ownedNos().length>=100],
  ['p250','🗺️','Pokémon Professor','Catch 250 different Pokémon',()=>ownedNos().length>=250],
  ['rare','💎','Shiny find','Get your first rare card',()=>cardsAll().some(c=>c.tier!=='c')],
  ['ultra','🌟','Ultra find','Get your first ultra rare card',()=>cardsAll().some(c=>c.tier==='u')],
  ['u10','👑','Ultra collector','Have 10 ultra rare cards',()=>cardsAll().filter(c=>c.tier==='u').length>=10],
  ['special','✨','Something special','Mark a card as shiny, full art or another special',()=>typeof spOf==='function'&&cardsAll().some(c=>spOf(c).length)],
  ['legend','🐉','Legend hunter','Catch a legendary or mythical Pokémon',()=>ownedNos().some(n=>{const p=byNo(n);return p&&(p.leg||p.myth)})],
  ['legend5','🏛️','Myth master','Catch 5 legendary or mythical Pokémon',()=>ownedNos().filter(n=>{const p=byNo(n);return p&&(p.leg||p.myth)}).length>=5],
  ['starters','🔥','Starter squad','Catch Bulbasaur, Charmander and Squirtle',()=>[1,4,7].every(has)],
  ['types','🌈','Type master','Catch a Pokémon of every one of the 18 types',()=>new Set(ownedNos().flatMap(n=>byNo(n)?.types||[])).size>=18],
  ['regions','🌍','World traveller','Catch a Pokémon from all 9 regions',()=>new Set(ownedNos().map(n=>byNo(n)?.gen)).size>=9],
  ['family','🧬','Family reunion','Complete a whole evolution family',()=>typeof families==='function'&&families().some(f=>f.done&&f.tot>1)],
  ['pack1','🎁','Pack opener','Finish your first pack',()=>packs.length>=1],
  ['pack10','📦','Pack pro','Finish 10 packs',()=>packs.length>=10],
  ['bingo','🎯','Full house!','Get a Pack Bingo full house',()=>packs.some(p=>p.full)],
  ['quiz','❓','Quiz whiz','Get 10 right in one round of Who\'s that Pokémon?',()=>typeof PLAY!=='undefined'&&(PLAY.game.best||0)>=10],
  ['battle','⚔️','First victory','Win a card battle',()=>typeof BT!=='undefined'&&BT.wins>=1],
  ['champ','🏆','Champion','Beat Champion Lance',()=>typeof BT!=='undefined'&&!!BT.champ],
  ['week10','📅','Challenge champ','Finish 10 weekly challenges',()=>typeof PLAY!=='undefined'&&Object.values(PLAY.claimed).reduce((s,w)=>s+w.length,0)>=10],
  ['hof','🖼️','Hall of Famer','Put 3 cards in your Hall of Fame',()=>(prof.hof||[]).length>=3],
  ['photo','📸','Photographer','Use your own photo for a card',()=>cardsAll().some(c=>c.photo)],
  ['streak','🔥','Daily habit','Spin the daily gift 7 days in a row',()=>giftStreak()>=7],
  ['vers','🥉','Super collector','Win a version badge (5 versions of one Pokémon)',()=>typeof verAllCounts==='function'&&Object.values(verAllCounts()).some(v=>v>=5)],
  ['worth10','💰','Treasure!','Own a card worth £10 or more',()=>typeof PRICES!=='undefined'&&cardsAll().some(c=>(PRICES[c.id]?.g||0)>=10)],
  ['worth100','🏦','Treasure chest','Collection worth £100 or more',()=>typeof worthNow==='function'&&worthNow().s>=100]];
const achWon=()=>prof.ach||{};
const _xpA=xpOf;xpOf=function(A){return _xpA(A)+Object.keys(achWon()).length*ACH_XP};
function achCheck(silent){if(!DEX.length)return;if(!cardsAll().length&&prof.ach&&Object.keys(prof.ach).length){prof.ach={};save2();return} // a fresh start (Grown-ups: delete everything) clears trophies too
  const W=achWon(),first=prof.ach===undefined,neu=[];
  ACH.forEach(([id,,name,,t])=>{if(W[id])return;let ok=false;try{ok=t()}catch(e){}if(ok){W[id]=today();neu.push(name)}});
  if(prof.giftDay===today()){prof.giftLog=prof.giftLog||[];if(!prof.giftLog.includes(today())){prof.giftLog.push(today());prof.giftLog=prof.giftLog.slice(-30);neu.length||save2()}}
  if(!neu.length&&!first)return;prof.ach=W;save2();
  if(!first&&!silent){neu.forEach((n,i)=>setTimeout(()=>{toast(`🏆 New trophy: ${n}! +${ACH_XP} XP`);if(typeof sfx==='function')sfx('bingo');if(typeof buzz==='function')buzz([20,30,20])},i*1800))}}
let _acT=0;const _rhA=renderHomeExtra;renderHomeExtra=function(A,xp,lv){_rhA(A,xp,lv);clearTimeout(_acT);_acT=setTimeout(()=>achCheck(),1200)};

function achCabinet(){const W=achWon(),n=Object.keys(W).length;
  return `<div class="sec">Special trophies (${n} of ${ACH.length})</div>
    <div class="ac-grid">${ACH.map(([id,ic,name],i)=>`<button class="ac ${W[id]?'got':''}" data-ach="${id}" style="--i:${i}" aria-label="${esc(name)}${W[id]?', won':', locked'}"><span class="ac-m">${ic}${W[id]?'':'<i class="ac-lk">🔒</i>'}</span><small>${esc(name)}</small></button>`).join('')}</div>
    <div class="ac-info" hidden></div>`}
function achShelf(){const b=$('#sheet .sh-body');if(!b||b.querySelector('.ac-grid'))return;b.insertAdjacentHTML('afterbegin',achCabinet())}
const _otA=openTrophies;openTrophies=function(){achCheck(true);_otA();[90,330,600].forEach(t=>setTimeout(()=>{if($('#sheet .sh-title')?.textContent==='Trophy room')achShelf()},t))};
document.addEventListener('click',e=>{const b=e.target.closest('[data-ach]');if(!b)return;const a=ACH.find(x=>x[0]===b.dataset.ach),info=b.closest('.sh-body')?.querySelector('.ac-info');if(!a||!info)return;
  const w=achWon()[a[0]];document.querySelectorAll('.ac.sel').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');info.hidden=false;
  info.innerHTML=`<span class="ac-big">${w?a[1]:'🔒'}</span><span><b>${esc(a[2])}</b><small>${esc(a[3])}</small><em>${w?'Won on '+new Date(w).toLocaleDateString('en-GB',{day:'numeric',month:'long'})+' · +'+ACH_XP+' XP':'Not won yet · worth +'+ACH_XP+' XP'}</em></span>`;
  if(!RM){info.classList.remove('in');void info.offsetWidth;info.classList.add('in')}info.scrollIntoView({block:'nearest',behavior:RM?'auto':'smooth'})});
