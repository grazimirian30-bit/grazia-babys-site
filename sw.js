const CACHE="grazia-babys-v1";
const CORE=["./","./index.html","./assets/style.css","./catalogo.json","./grazia-hero-menina.jpg","./grazia-hero-menino.jpg","./bebe_loira_flores.jpg","./bebe_morena_casaco_coracao.jpg","./bebe_morena_vestido-1.jpg","./menino_casaco_urso.jpg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return r;}).catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html"))));
});