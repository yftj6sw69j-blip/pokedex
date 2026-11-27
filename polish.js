'use strict';
/* Premium layer: set colours from each set's own artwork, binder covers unlocked by level,
   a synthesised sound pack, haptic taps, and cards that tilt with the phone. */

/* ---------- set colours ---------- */
const SETCOL_KEY='pokedex.setcol.v1';let setCol={};try{setCol=JSON.parse(localStorage.getItem(SETCOL_KEY)||'{}')}catch(e){}
function hsl(h,s,l){s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));return '#'+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('')}
const FX=['stars','sparks','ripples','embers','leaves','mist','rings','scales'];
function setKey(sid){const key='set:'+sid;let h=setCol[sid];
  if(h==null){h=[...sid].reduce((a,c)=>(a*31+c.charCodeAt(0))%360,7);sampleSet(sid)}
  XT[key]=[hsl(h,78,58),hsl(h,60,14),FX[Math.abs(Math.round(h/45))%FX.length],sid];return key}
const sampling=new Set();
function sampleSet(sid){if(sampling.has(sid))return;sampling.add(sid);const im=new Image();im.crossOrigin='anonymous';
  im.onload=()=>{try{const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d');g.drawImage(im,0,0,32,32);const d=g.getImageData(0,0,32,32).data;
    let x=0,y=0,w=0;for(let i=0;i<d.length;i+=4){const r=d[i]/255,gg=d[i+1]/255,b=d[i+2]/255,al=d[i+3]/255,mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),sat=mx-mn;if(al<.5||sat<.18)continue;
      let h=mx===r?((gg-b)/sat)%6:mx===gg?(b-r)/sat+2:(r-gg)/sat+4;h*=60;const wt=sat*al;x+=Math.cos(h*Math.PI/180)*wt;y+=Math.sin(h*Math.PI/180)*wt;w+=wt}
    if(w>0){setCol[sid]=Math.round((Math.atan2(y,x)*180/Math.PI+360)%360);localStorage.setItem(SETCOL_KEY,JSON.stringify(setCol))}}catch(e){}};
  im.src=`https://images.pokemontcg.io/${sid}/logo.png`}

/* ---------- binder covers, unlocked by level ---------- */
const COVERS=[['classic',1,'Classic'],['leather',3,'Leather'],['holo',6,'Holo'],['type',10,'My type'],['gold',15,'Gold']];
function levelNow(){return Math.floor(xpOf(albums())/LV)+1}
function coverPicker(){const lv=levelNow(),cur=prof.cover||'classic';
  return `<div class="covers" role="radiogroup" aria-label="Binder cover">${COVERS.map(([k,need,l])=>`<button class="cover cv-${k} ${cur===k?'on':''}" data-cover="${k}" ${lv<need?'disabled':''} role="radio" aria-checked="${cur===k}"><i></i><span>${lv<need?'🔒 Level '+need:l}</span></button>`).join('')}</div>`}
function applyCover(root){const b=root.querySelector('.binder');if(!b)return;b.className='binder bc-'+(prof.cover||'classic');if(prof.fav)b.style.setProperty('--tc',tc(prof.fav)[0])}
document.addEventListener('click',e=>{const c=e.target.closest('[data-cover]');if(!c||c.disabled)return;prof.cover=c.dataset.cover;save2();
  const root=c.closest('.al-body');root.querySelectorAll('.cover').forEach(x=>{x.classList.toggle('on',x===c);x.setAttribute('aria-checked',x===c)});applyCover(root);sfx('pop');buzz(8)});

/* ---------- sound pack (synthesised, no files) ---------- */
let AC=null;const SND_KEY='pokedex.sound';let soundOn=true;try{soundOn=localStorage.getItem(SND_KEY)!=='off'}catch(e){}
function tone(f,t0,dur,type='sine',vol=.08,slide=0){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,AC.currentTime+t0);
  if(slide)o.frequency.exponentialRampToValueAtTime(f*slide,AC.currentTime+t0+dur);g.gain.setValueAtTime(0,AC.currentTime+t0);g.gain.linearRampToValueAtTime(vol,AC.currentTime+t0+.008);
  g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+t0+dur);o.connect(g).connect(AC.destination);o.start(AC.currentTime+t0);o.stop(AC.currentTime+t0+dur+.02)}
function sfx(kind){if(!soundOn||RM&&kind!=='catch')return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();
  if(kind==='tap')tone(880,0,.05,'triangle',.04);
  if(kind==='pop')tone(520,0,.09,'sine',.07,1.6);
  if(kind==='ball')tone(300,0,.18,'triangle',.07,2.4);
  if(kind==='catch'){[523,659,784,1047].forEach((f,i)=>tone(f,i*.08,.22,'triangle',.07));tone(2093,.34,.35,'sine',.03)}
  if(kind==='level'){[392,523,659,784,659,784,1047].forEach((f,i)=>tone(f,i*.09,i===6?.5:.16,'square',.035))}
  if(kind==='bingo'){[1319,1568,2093].forEach((f,i)=>tone(f,i*.06,.25,'sine',.05))}
  if(kind==='flip')tone(1200,0,.06,'sine',.03,.5)}catch(e){}}
function toggleSound(){soundOn=!soundOn;try{localStorage.setItem(SND_KEY,soundOn?'on':'off')}catch(e){}if(soundOn)sfx('pop');toast(soundOn?'Sounds on':'Sounds off');if(cur===4)renderTrainer()}
function buzz(p){try{navigator.vibrate?.(p)}catch(e){}}

/* hooks into existing moments */
document.addEventListener('click',e=>{const t=e.target.closest('.tab');if(t){if(t.dataset.tab==='2')sfx('ball');else sfx('pop');buzz(8);return}
  if(e.target.closest('#done')){sfx('catch');buzz([20,40,30]);return}
  if(e.target.closest('#packStart'))sfx('ball');
  if(e.target.closest('.album,.stat,.tc-btn,.trow,.chip,.seg button,.sh-back,.partner'))sfx('tap')},true);
if(typeof celebrateAfter==='function'){const _ca=celebrateAfter;celebrateAfter=function(lb,la){const before=pack?bingoHits(pack).lines:0;_ca(lb,la);
  if(celebQ.length||celebBusy){sfx('level');buzz([30,50,30,50,80])}}}
if(typeof afterCatch==='function'){const _ac=afterCatch;afterCatch=async function(p,card,lb,la){const before=pack?bingoHits(pack).lines:0;const r=await _ac(p,card,lb,la);
  if(pack&&bingoHits(pack).lines>before){setTimeout(()=>sfx('bingo'),500)}return r}}

/* ---------- cards tilt with the phone (and with a finger on desktop) ---------- */
let tiltAsked=false,tiltOn=false;
function onTilt(e){const st=$('#stage');if(!st||!st.classList.contains('on'))return;const hero=$('#hero');
  const x=Math.max(-25,Math.min(25,(e.gamma||0))),y=Math.max(-25,Math.min(25,(e.beta||0)-40));
  hero.style.setProperty('--mx',(50+x*2)+'%');hero.style.setProperty('--my',(50+y*2)+'%');hero.style.rotate=`${-y} ${x} 0 ${Math.hypot(x,y)*.35}deg`}
async function askTilt(){if(tiltAsked)return;tiltAsked=true;try{if(typeof DeviceOrientationEvent!=='undefined'&&DeviceOrientationEvent.requestPermission){const r=await DeviceOrientationEvent.requestPermission();if(r!=='granted')return}
  addEventListener('deviceorientation',onTilt);tiltOn=true}catch(e){}}
document.addEventListener('click',e=>{if(e.target.closest('.tile,.opencard'))askTilt()},true);
new MutationObserver(()=>{const st=$('#stage');if(st&&!st.classList.contains('on'))$('#hero').style.rotate=''}).observe($('#stage'),{attributes:true,attributeFilter:['class']});

/* ---------- his name in the title ("Sam's Pokédex") ---------- */
function dexTitle(){const n=(prof.name||'').trim();return n&&n!=='Trainer'?`${n}${/s$/i.test(n)?"'":"'s"} Pokédex`:'Pokédex'}
if(typeof applyProfile==='function'){const _ap=applyProfile;applyProfile=function(){_ap();const t=dexTitle();const h=$('.brand h1');if(h)h.textContent=t;document.title=t;
  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content',t)}}

/* ---------- home-screen app: install help ---------- */
let installEvt=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e});
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
function installHTML(){if(standalone())return `<div class="sec">App icon</div><p class="hint">✓ Opened from the home screen. It works offline and full screen.</p>`;
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  return `<div class="sec">Put it on the home screen</div>${installEvt?`<button class="photo-btn" id="doInstall">Add the app icon</button>`:
   ios?`<ol class="steps"><li>Open this page in <b>Safari</b>.</li><li>Tap the <b>Share</b> button (the square with an arrow).</li><li>Scroll down and tap <b>Add to Home Screen</b>, then <b>Add</b>.</li></ol>`:
   `<ol class="steps"><li>Open this page in <b>Chrome</b>.</li><li>Tap the <b>⋮</b> menu at the top right.</li><li>Tap <b>Add to Home screen</b> (or <b>Install app</b>), then <b>Install</b>.</li></ol>`}`}
document.addEventListener('click',async e=>{if(e.target.closest('#doInstall')&&installEvt){installEvt.prompt();await installEvt.userChoice;installEvt=null;refreshSheet?.()}});
if(typeof parentBody==='function'){const _pb=parentBody;parentBody=function(body){_pb(body);body.insertAdjacentHTML('afterbegin',installHTML())}}
