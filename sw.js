const CACHE = 'fitcore-v5';
const ASSETS = ['/','/index.html','/manifest.json','/icon-192.png','/icon-512.png','tatirex-logotip.png','tatirex-chocolate.jpg','tatirex-strawberry.jpg','tatirex-milk.jpg','tatirex-cookie.jpg','tatirex-raspberry.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Network-first для index.html — всегда пробуем получить свежую версию
  if (e.request.url.includes('index.html') || e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache-first для остальных ресурсов
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

// Сообщение от клиента — принудительное обновление
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
