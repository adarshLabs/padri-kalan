// Offline cache so the site opens even with weak or no network.
// Bump VERSION whenever you change files, so phones fetch the new copy.
var VERSION = 'pk-v4';
var FILES = ['./', 'index.html', 'about.html', 'temple.html', 'gallery.html', 'services.html', 'notices.html', 'contribute.html', 'css/style.css', 'js/config.js', 'js/main.js',
  'data/notices.json', 'data/pride.json', 'data/gallery.json', 'data/stories.json', 'data/temple.json', 'assets/icon.svg', 'manifest.webmanifest', '404.html'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
// Network first (fresh notices), fall back to cache when offline.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function (r) {
    var copy = r.clone(); caches.open(VERSION).then(function (c) { c.put(e.request, copy); }); return r;
  }).catch(function () { return caches.match(e.request).then(function (m) { return m || caches.match('index.html'); }); }));
});
