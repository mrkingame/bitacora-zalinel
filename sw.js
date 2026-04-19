// ════════════════════════════════════════
// ZALINEL · Bitácora de Terreno
// Service Worker v1.0
// ════════════════════════════════════════

const CACHE_NAME = 'zalinel-bitacora-v3.9';
const ASSETS = [
  '/bitacora-zalinel/',
  '/bitacora-zalinel/index.html',
  '/bitacora-zalinel/manifest.json',
  '/bitacora-zalinel/icons/icon-192.png',
  '/bitacora-zalinel/icons/icon-512.png',
];

// INSTALAR — cachear recursos base
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()) // activar inmediatamente
  );
});

// ACTIVAR — limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim()) // tomar control de todas las pestañas
  );
});

// FETCH — estrategia: network first, cache como fallback
// Así siempre recibe actualizaciones cuando hay internet,
// y funciona offline cuando no hay conexión
self.addEventListener('fetch', event => {
  // Solo manejar requests del mismo origen
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Guardar copia fresca en cache
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Sin internet — usar cache
        return caches.match(event.request)
          .then(cached => cached || caches.match('/bitacora-zalinel/'));
      })
  );
});

// MENSAJE — forzar actualización desde la app
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
