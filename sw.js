const CACHE_NAME = 'yawnism-admin-v3'; // Ganti versi jika ada update file
const ASSETS = [
  './',
  './index.html',
  './dashboard.html',
  './products.html',
  './stock.html',
  './finance.html',
  './hpp.html',
  './suppliers.html',
  './collections.html',
  './brand-guidelines.html',
  './orders.html',
  './settings.html',
  './style.css',
  './app.js',
  'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap'
];

// 1. Install Service Worker & Cache Semua File
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets...');
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Fetch (Gunakan Cache dulu, kalau gak ada baru ambil internet)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});

// 3. Hapus Cache Lama jika versi naik (Optional, biar user dapat update)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('Hapus cache lama:', key);
          return caches.delete(key);
        }
      }));
    })
  );
});