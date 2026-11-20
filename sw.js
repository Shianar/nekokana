// Офлайн-кэш Нэко-каны. При обновлении файлов увеличь номер версии.
const VERSION = 'nekokana-v1';
const ASSETS = [
  './', 'index.html', 'app.css', 'app.js', 'manifest.webmanifest', 'data/kana.json', 'img/cat.svg',
  'img/ganbare.webp', 'img/bed.webp', 'img/reading.webp', 'img/fire.webp', 'img/ramen.webp', 'img/goukaku.webp',
  'img/slime-pink.webp', 'img/slime-green.webp', 'img/slime-pink2.webp', 'img/sakura.webp',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'fonts/cormorant-garamond-cyrillic-500-normal.woff2', 'fonts/cormorant-garamond-cyrillic-600-normal.woff2', 'fonts/cormorant-garamond-cyrillic-700-normal.woff2',
  'fonts/cormorant-garamond-latin-500-normal.woff2', 'fonts/cormorant-garamond-latin-600-normal.woff2', 'fonts/cormorant-garamond-latin-700-normal.woff2',
];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('index.html'))));
});
