const CACHE = 'fitcore-v12';
const ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({type:'window'}).then(clients => {
        clients.forEach(c => c.navigate(c.url));
      }))
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Supabase — только сеть, без перехвата
  if (url.hostname.includes('supabase.co')) return;

  if (e.request.method !== 'GET') return;

  // index.html — сеть первая, fallback кеш
  if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request.clone())
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Остальное — кеш первый
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request.clone()).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      });
    })
  );
});
