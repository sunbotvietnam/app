const CACHE='sunbot-school-os-pwa-20260823-02';
const SHELL=['./v3-runtime.html','./v3.html','./manifest.webmanifest','./icon.svg','./icon-maskable.svg','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k.startsWith('sunbot-school-os-pwa-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
function cacheKey(req){const u=new URL(req.url);return new Request(u.origin+u.pathname,{method:'GET'});}
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  if(!url.pathname.includes('/school-os/'))return;
  event.respondWith((async()=>{
    const key=cacheKey(req);
    try{
      const fresh=await fetch(req);
      if(fresh&&fresh.ok){
        const c=await caches.open(CACHE);
        c.put(key,fresh.clone()).catch(()=>{});
      }
      return fresh;
    }catch(err){
      const cached=await caches.match(key);
      if(cached)return cached;
      if(req.mode==='navigate'){
        const shell=await caches.match(new Request(new URL('./v3-runtime.html',self.location.href).href));
        if(shell)return shell;
      }
      throw err;
    }
  })());
});
self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();
});
