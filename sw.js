const CACHE_NAME = 'iedash-v3';
const ASSETS = ['./index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Only handle same-origin GET requests; skip external/dynamic scripts
  if (e.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  // Skip Netlify-injected scripts and anything not in our cache list
  if (url.pathname.includes('email-decode') || url.pathname.includes('netlify')) return;

  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});

// Push notification handler
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'いえダッシュ', body: 'お知らせがあります' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '🏠',
      badge: '/icon-badge.png',
      tag: data.tag || 'iedash',
      data: data,
      actions: data.actions || []
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});

// Alarm check - triggered by main app via postMessage
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body } = e.data;
    self.registration.showNotification(title, {
      body,
      icon: '🏠',
      tag: 'schedule-' + Date.now()
    });
  }
});
