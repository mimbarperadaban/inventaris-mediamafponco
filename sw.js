// Service worker kecil: menyimpan "cangkang" aplikasi (logo, ikon) supaya cepat terbuka.
// Data inventaris tetap selalu diambil langsung dari Google Sheet (butuh internet).
var CACHE = 'inventaris-mediamaf-v1';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'favicon.png', 'apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // Apps Script & Google: langsung ke jaringan
  // Halaman: coba jaringan dulu (supaya perubahan APP_URL langsung terpakai), kalau offline pakai cache
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(function (r) {
      var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put('index.html', copy); }); return r;
    }).catch(function () { return caches.match('index.html'); }));
    return;
  }
  e.respondWith(caches.match(e.request).then(function (hit) { return hit || fetch(e.request); }));
});
