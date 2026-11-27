const CACHE_NAME = 'trpg-pdf-workspace-v1.0.5';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-180.png', './icon-192.png', './icon-512.png'];
const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs',
  'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js'
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE.map(url => new Request(url, {cache: 'reload'}))); // ブラウザの古いHTTPキャッシュを避けて最新を取得
    await Promise.all(CDN.map(async url => {
      try { const response = await fetch(url, {mode:'cors'}); if (response.ok) await cache.put(url, response); }
      catch (e) { /* CDNが利用できない場合もアプリ本体の導入は続行 */ }
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request) || await cache.match(request.url);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && (new URL(request.url).origin === self.location.origin || request.mode === 'cors')) {
        cache.put(request, response.clone()).catch(()=>{});
      }
      return response;
    } catch (error) {
      if (request.mode === 'navigate') return cache.match('./index.html');
      throw error;
    }
  })());
});
