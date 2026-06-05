const CACHE = 'fitcore-v10';
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
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Supabase — только сеть
  if (url.hostname.includes('supabase.co')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  if (e.request.method !== 'GET') return;

  // index.html — кеш сразу + обновление в фоне
  if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname.endsWith('/')) {
    e.respondWith(
      caches.open(CACHE).then(cache => {
        return cache.match(e.request).then(cached => {
          // Обновляем в фоне
          const fetchPromise = fetch(e.request).then(res => {
            if (res.ok) {
              cache.put(e.request, res.clone());
              // Сообщаем всем вкладкам что есть обновление
              self.clients.matchAll().then(clients => {
                clients.forEach(client => client.postMessage({ type: 'UPDATE_AVAILABLE' }));
              });
            }
            return res;
          }).catch(() => cached);

          // Отдаём кеш мгновенно если есть, иначе ждём сеть
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // Остальное — кеш первый
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      });
      return cached || fetchPromise;
    })
  );
});
