/* Versioned, same-origin PWA cache. Do not cache Firebase writes or cross-origin requests. */
'use strict';
const CACHE_NAME = 'medical-secret-files-shell-v3';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon.svg',
  './assets/all.min.css',
  './assets/tailwindcss.js',
  './assets/data.js',
  './assets/exam-engine.js',
  './assets/app-sync.js',
  './assets/custom-mcq.js',
  './assets/pwa.js',
  './assets/science-formatter.js',
  './assets/firebase-app-compat.js',
  './assets/firebase-auth-compat.js',
  './assets/firebase-firestore-compat.js',
  './assets/firebase-config.js'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy)).catch(() => {});
      return response;
    }).catch(() => caches.match(request).then(cached => cached || caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(request).then(cached => {
    const network = fetch(request).then(response => {
      if (response && response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone())).catch(() => {});
      return response;
    });
    return cached || network;
  }));
});