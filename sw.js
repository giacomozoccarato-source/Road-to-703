importScripts("./version.js?v=69");
const APP_VERSION=self.ROAD703_CONFIG.APP_VERSION;
const CACHE=`road703-${APP_VERSION}-safe-month1`;
const ASSETS=["./","./version.js","./index.html","./styles.css","./data.js","./strength.js","./app.js","./firebase-sync.js","./intervals-month.js","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;const u=new URL(e.request.url),live=["/version.js","/app.js","/data.js","/strength.js","/styles.css","/firebase-sync.js","/intervals-month.js","/sw.js","/manifest.webmanifest"],nf=e.request.mode==="navigate"||live.some(n=>u.pathname.endsWith(n));if(nf){e.respondWith(fetch(e.request).then(r=>{const x=r.clone();caches.open(CACHE).then(c=>c.put(e.request,x));return r}).catch(()=>caches.match(e.request).then(h=>h||caches.match("./index.html"))));return}e.respondWith(caches.match(e.request).then(h=>h||fetch(e.request).then(r=>{const x=r.clone();caches.open(CACHE).then(c=>c.put(e.request,x));return r}))) });
