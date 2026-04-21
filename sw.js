const CACHE_NAME = 'asetdesa-v4.0.0';

// Aset yang WAJIB di-cache agar aplikasi bisa hidup 100% tanpa internet
// Ditambahkan library QR Scanner dan QR Generator sesuai versi terbaru
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  
  // Library Eksternal (Pembeli disarankan mengunduh file ini dan melokalkannya ke folder assets/js/)
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/lucide@latest',
  'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js',
  'https://unpkg.com/html5-qrcode'
];

// Event Install: Mendaftarkan cache utama
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Menyimpan App Shell ke Cache...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => console.error('[ServiceWorker] Gagal Install Cache:', err))
  );
});

// Event Activate: Membersihkan cache versi lama jika ada pembaruan aplikasi
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Menghapus cache versi lama:', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// Event Fetch: Strategi Cache-First (Sangat Cepat & 100% Offline Support)
self.addEventListener('fetch', (event) => {
  // Abaikan request selain GET (misal POST API jika kedepannya ada)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. Jika file ada di cache, langsung kembalikan (Instan/Offline)
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Jika tidak ada di cache, coba ambil dari Network (Internet)
      return fetch(event.request).then((networkResponse) => {
        // Jangan cache respons yang gagal/error
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Kloning respons jaringan ke dalam cache untuk request selanjutnya
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // 3. Jika offline total dan file tidak ada di cache, kembalikan halaman index (Fallback PWA)
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});