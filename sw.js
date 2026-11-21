// Офлайн-кэш Нэко-каны.
// Стратегия «сначала сеть»: если интернет есть — берём свежие файлы с GitHub
// и обновляем кэш; если нет — открываем то, что сохранено. Поэтому обновления
// появляются сами, номер версии можно не трогать (он только чистит старый кэш).
const VERSION = 'nekokana-v2';
const ASSETS = [
  './', 'index.html', 'app.css', 'app.js', 'manifest.webmanifest',
  'data/kana.json', 'data/kanji.json', 'data/kanji-lessons.js', 'img/cat.svg',
  'img/ganbare.webp', 'img/bed.webp', 'img/reading.webp', 'img/fire.webp', 'img/ramen.webp', 'img/goukaku.webp',
  'img/slime-pink.webp', 'img/slime-green.webp', 'img/slime-pink2.webp', 'img/sakura.webp',
  'img/prof-point.webp', 'img/prof-book.webp', 'img/prof-glasses.webp', 'img/prof-sleep.webp', 'img/prof-wrong.webp', 'img/prof-brush.webp',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'fonts/cormorant-garamond-cyrillic-500-normal.woff2', 'fonts/cormorant-garamond-cyrillic-600-normal.woff2', 'fonts/cormorant-garamond-cyrillic-700-normal.woff2',
  'fonts/cormorant-garamond-latin-500-normal.woff2', 'fonts/cormorant-garamond-latin-600-normal.woff2', 'fonts/cormorant-garamond-latin-700-normal.woff2',
];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  const fromNet = fetch(e.request, { cache: 'no-cache' }).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
    return res;
  });
  const timeout = new Promise((_, rej) => setTimeout(() => rej('slow'), 3000));
  e.respondWith(Promise.race([fromNet, timeout]).catch(() =>
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fromNet).catch(() => caches.match('index.html'))));
});
