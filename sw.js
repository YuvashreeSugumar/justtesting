const CACHE_NAME = 'pink-pals-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // card assets
  './assets/cards/crown.svg',
  './assets/cards/heart.svg',
  './assets/cards/star.svg',
  './assets/cards/butterfly.svg',
  './assets/cards/unicorn.svg',
  './assets/cards/lipstick.svg',
  './assets/cards/purse.svg',
  './assets/cards/mirror.svg',
  './assets/cards/shoe.svg',
  './assets/cards/rainbow.svg',
  './assets/cards/flower.svg',
  './assets/cards/dress.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => k !== CACHE_NAME && caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(res => res || fetch(e.request))
    );
  }
});
