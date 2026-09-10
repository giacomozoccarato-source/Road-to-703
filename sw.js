importScripts("./version.js?v=68.6");
const APP_VERSION=self.ROAD703_CONFIG.APP_VERSION;
const CACHE=`road703-${APP_VERSION}-monthly-sync`;
const ASSETS=["./","./version.js","./index.html","./styles.css","./data.js","./strength.js","./app.js","./monthly-sync-v686.js","./firebase-sync.js","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;const u=new URL(e.request.url);const live=["/version.js","/app.js","/data.js","/strength.js","/styles.css","/monthly-sync-v686.js","/firebase-sync.js","/sw.js","/manifest.webmanifest"];const nf=e.request.mode==="navigate"||live.some(n=>u.pathname.endsWith(n));if(nf){e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(h=>h||caches.match("./index.html"))));return}e.respondWith(caches.match(e.request).then(h=>h||fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}))) });
