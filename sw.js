// Grazia Babys: cache somente da vitrine. O painel precisa carregar sempre direto da rede.
const CACHE="grazia-babys-v2";
const CORE=["./","./index.html","./assets/style.css","./catalogo.json","./grazia-hero-menina.jpg","./grazia-hero-menino.jpg","./bebe_loira_flores.jpg","./bebe_morena_casaco_coracao.jpg","./bebe_morena_vestido-1.jpg","./menino_casaco_urso.jpg"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  // NUNCA usar o index.html como fallback para o painel ou arquivos JavaScript.
  if(/(?:^|\/)admin(?:\.html|\.js|\.css)?$/.test(url.pathname)||url.pathname.endsWith(".js"))return;
  event.respondWith(
    fetch(request).then(response=>{
      if(response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});
      }
      return response;
    }).catch(async()=>{
      const cached=await caches.match(request);
      if(cached)return cached;
      if(request.mode==="navigate")return caches.match("./index.html");
      return Response.error();
    })
  );
});