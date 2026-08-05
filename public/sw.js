// Service worker mínimo do FitTracker: cacheia o app shell e serve páginas
// já visitadas quando offline. Estratégia network-first com fallback de cache
// para navegação e para os demais requests; cache-first só para assets
// estáticos próprios (covers, ícones, manifest). Requests para /_next/ e
// payloads RSC (?_rsc=) nunca são cacheados: em dev esses arquivos não têm
// hash de conteúdo estável, e servir uma versão antiga trava a navegação
// (a tela fica presa em "rendering...").
const CACHE_NAME = "fittracker-v2";
const APP_SHELL = ["/", "/login", "/manifest.webmanifest"];
const CACHE_FIRST_PATHS = ["/covers/", "/icons/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Nunca interceptar chunks do Next.js nem payloads RSC — sempre rede,
  // sem cache. Servir uma versão velha desses arquivos é o que faz a
  // navegação travar indefinidamente.
  if (url.pathname.startsWith("/_next/") || url.searchParams.has("_rsc")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  const isStaticAsset = CACHE_FIRST_PATHS.some((p) => url.pathname.startsWith(p));
  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  // Network-first para o restante, com fallback pro cache quando offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
