const CACHE_NAME = 'pratham-blog-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/post.html',
  '/create.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  '/images/icon-192.png',
  '/images/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
     return;
   }

   if (event.request.url.includes('tiny')) {
      return;
    }


  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          response => {

            if(!response || response.status !== 200 || response.type !== 'basic' && !event.request.url.startsWith('https://fonts.gstatic.com')) {
               return response;
             }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                 if (!event.request.url.includes('?id=') && !event.request.url.includes('?editId=')) {
                    cache.put(event.request, responseToCache);
                 }
              });
            return response;
          }
        ).catch(() => {
              if (event.request.mode === 'navigate' && event.request.url.endsWith('.html')) {
                    return caches.match('/index.html');
              }
        });
      })
    );
});