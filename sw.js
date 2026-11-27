// Offline support: app files network-first (so updates arrive), pictures cache-first.
const APP='pokedex-app-v7',IMG='pokedex-img-v1';
const SHELL=['./','index.html','style.css?v=7','app.js?v=7','features.js?v=7','sync.js?v=5','toolbar.js?v=6','polish.js?v=6','dex.txt?v=1','flavor.txt?v=1','icon.svg','manifest.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(APP).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>![APP,IMG].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET')return;
  if(u.hostname==='raw.githubusercontent.com'||u.hostname==='images.pokemontcg.io'){
    e.respondWith(caches.open(IMG).then(async c=>{const hit=await c.match(e.request);if(hit)return hit;const r=await fetch(e.request);if(r.ok||r.type==='opaque')c.put(e.request,r.clone());return r}));return}
  if(u.origin===location.origin){e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(APP).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request)))}});
