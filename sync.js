'use strict';
/* Family sync: one secret code links every device in the family to the same collection.
   The code never leaves the device in plain form on the server side (the database stores a sha256 of it)
   and the app can only reach two functions, never the table. Photos stay on the device that took them. */
const SYNC_URL='',SYNC_KEY=''; // Supabase project URL and publishable (anon) key, both safe to ship in a web app
const SKEY='pokedex.sync.v1';
let sync={code:'',at:''},syncTimer=0,syncBusy=false;
try{sync={...sync,...JSON.parse(localStorage.getItem(SKEY)||'{}')}}catch(e){}
const syncOn=()=>!!(SYNC_URL&&SYNC_KEY);
function saveSync(){try{localStorage.setItem(SKEY,JSON.stringify(sync))}catch(e){}}
async function rpc(fn,body){const r=await fetch(`${SYNC_URL}/rest/v1/rpc/${fn}`,{method:'POST',headers:{'content-type':'application/json',apikey:SYNC_KEY,authorization:'Bearer '+SYNC_KEY},body:JSON.stringify(body)});
  if(!r.ok)throw new Error('sync '+r.status);return r.json()}
const WORDS=['pika','char','bulba','squirt','eevee','snor','gengar','lucario','mew','onix','abra','jolt','vapor','flare','umbre','espeon','togepi','psy','geo','zubat','oddish','ditto','lapras','dratini'];
function newCode(){const a=new Uint32Array(4);crypto.getRandomValues(a);return `${WORDS[a[0]%WORDS.length]}-${WORDS[a[1]%WORDS.length]}-${WORDS[a[2]%WORDS.length]}-${String(a[3]%10000).padStart(4,'0')}`}
function snapshot(){const strip=o=>{const r={};for(const n in o)r[n]=o[n].map(c=>{const {photo,...rest}=c;return rest});return r};
  return {own:strip(own),fav,wish,extra:{prof,packs,seenTiers,celebrated}}}
// merge: every card from both sides (matched by id, keeping a local photo), wish/fav from both, packs from both, newest profile
function mergeIn(d){if(!d||!d.own)return;for(const n in d.own){const mine=own[n]||[];d.own[n].forEach(c=>{if(!mine.some(m=>m.id===c.id))mine.push(c)});own[n]=mine}
  fav={...(d.fav||{}),...fav};wish={...(d.wish||{}),...wish};
  const ex=d.extra||{};const seen=new Set(packs.map(p=>p.date));(ex.packs||[]).forEach(p=>{if(!seen.has(p.date))packs.push(p)});packs.sort((a,b)=>b.date.localeCompare(a.date));
  if(ex.prof&&ex.prof.name&&(!prof.name||prof.name==='Trainer'))prof={...prof,...ex.prof,onboarded:true};
  save0();save2()}
let save0=null;
async function syncNow(quiet){if(!syncOn()||!sync.code||syncBusy)return;syncBusy=true;
  try{const got=await rpc('pokedex_get',{p_code:sync.code});if(got&&got.data)mergeIn(got.data);
    const at=await rpc('pokedex_put',{p_code:sync.code,p_data:snapshot()});sync.at=at||new Date().toISOString();saveSync();
    applyProfile();renderHome();if(!$('#v-dex').hidden)renderGrid();if(!quiet)toast('Synced with the family')}
  catch(e){if(!quiet)toast('Couldn\'t sync. Check the internet and try again')}finally{syncBusy=false}}
function queueSync(){if(!syncOn()||!sync.code)return;clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncNow(true),2500)}
function syncSection(){if(!syncOn())return '';
  return `<div class="sec">Family sync</div>${sync.code?
   `<p class="hint">This device is linked. Type the same code on another phone or tablet to share the collection.${sync.at?' Last synced '+new Date(sync.at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+'.':''}</p>
    <div class="code">${esc(sync.code)}</div><div class="backup"><button class="photo-btn" id="syNow">Sync now</button><button class="ghost" id="syOff">Unlink this device</button></div>`:
   `<p class="hint">Keep the collection the same on every family device. Make a secret code here, then type it on the other device. Anyone with the code can see and change the collection, so keep it in the family. Photos you take stay on the device that took them.</p>
    <div class="backup"><button class="photo-btn" id="syNew">Make a family code</button></div>
    <form class="find" id="syForm" style="margin-top:8px"><input class="search" id="syCode" placeholder="Already have a code? Type it" autocapitalize="off" autocomplete="off" spellcheck="false"><button class="go" type="submit">Link</button></form>`}`}
document.addEventListener('click',async e=>{
  if(e.target.closest('#syNew')){sync.code=newCode();saveSync();await syncNow();refreshSheet()}
  if(e.target.closest('#syNow')){await syncNow();refreshSheet()}
  if(e.target.closest('#syOff')){const b=e.target.closest('#syOff');if(!b.classList.contains('sure')){b.classList.add('sure');b.textContent='Tap again to unlink';return}sync={code:'',at:''};saveSync();refreshSheet();toast('This device is unlinked')}});
document.addEventListener('submit',async e=>{if(e.target.id!=='syForm')return;e.preventDefault();const c=$('#syCode').value.trim().toLowerCase();
  if(c.length<12){toast('That code looks too short');return}sync.code=c;saveSync();await syncNow();refreshSheet()});
function initSync(){if(!syncOn())return;save0=save;save=function(){save0();queueSync()};const s2=save2;save2=function(){s2();queueSync()};
  addEventListener('online',()=>syncNow(true));document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncNow(true)});
  if(sync.code)syncNow(true)}
