/* sw.js — 10年日記 Service Worker */
const CACHE_NAME = 'diary10-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@400;700&family=Noto+Sans+JP:wght@300;400&display=swap'
];

/* インストール：静的アセットをキャッシュ */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

/* アクティベート：古いキャッシュを削除 */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

/* フェッチ：GASへのリクエストはキャッシュしない */
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  /* GAS / Google API は常にネットワークから */
  if (url.includes('script.google.com') ||
      url.includes('googleapis.com') ||
      url.includes('googleusercontent.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  /* 静的アセット：キャッシュ優先、なければネットワーク */
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        /* 正常なレスポンスのみキャッシュに追加 */
        if (response && response.status === 200 && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      });
    })
  );
});
