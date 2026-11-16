const CACHE = 'umniki-v21';
const FILES = ['./', 'index.html', 'styles.css', 'theme.css', 'skills.js', 'glossary.js', 'speech.js', 'gens.js', 'gens_ext.js', 'gens_more.js', 'chess_engine.js', 'chess_data.js', 'chess.js', 'app.js', 'avatar.js', 'vendor/three.min.js', 'fonts/nunito-cyrillic-wght-normal.woff2', 'fonts/nunito-latin-wght-normal.woff2', 'fonts/nunito-latin-ext-wght-normal.woff2', 'fonts/unbounded-cyrillic-wght-normal.woff2', 'fonts/unbounded-latin-wght-normal.woff2', 'fonts/unbounded-latin-ext-wght-normal.woff2', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== location.origin) return;   // Firebase/Google — напрямую, без кэша
  // сеть в приоритете (чтобы обновления доезжали), кэш — запасной вариант для офлайна
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => {   // no-cache: каждый раз сверяемся с сервером (иначе браузер держит старые файлы до 10 минут)
    const copy = r.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy));
    return r;
  }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
