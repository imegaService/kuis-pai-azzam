const CACHE = 'cepat-tepat-v1';
const SHELL = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png'];
const NETWORK_TIMEOUT = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL).catch(() => undefined);
    try {
      const html = await (await fetch('/', { cache: 'no-store' })).text();
      const assets = Array.from(html.matchAll(/(?:src|href)="(\/static\/[^"]+)"/g)).map((m) => m[1]);
      await cache.addAll(assets);
    } catch (e) { /* offline saat install */ }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

function cacheable(url, req) {
  if (req.method !== 'GET') return false;
  if (url.hostname === 'generativelanguage.googleapis.com') return false;
  if (url.pathname.includes('hot-update') || url.pathname.startsWith('/sockjs') || url.pathname.startsWith('/ws')) return false;
  return url.origin === self.location.origin || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

async function networkFirst(req, fallbackKey) {
  const cache = await caches.open(CACHE);
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), NETWORK_TIMEOUT)),
    ]);
    if (res && (res.ok || res.type === 'opaque')) cache.put(fallbackKey || req, res.clone());
    return res;
  } catch (e) {
    const hit = (await cache.match(fallbackKey || req)) || (await cache.match(req));
    if (hit) return hit;
    throw e;
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (!cacheable(url, req)) return;
  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req, '/'));
    return;
  }
  if (url.hostname.startsWith('fonts.') || url.pathname.startsWith('/static/')) {
    event.respondWith(caches.match(req).then((hit) => hit || networkFirst(req)));
    return;
  }
  event.respondWith(networkFirst(req));
});
