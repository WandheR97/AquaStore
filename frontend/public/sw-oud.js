const CACHE_NAME = "pdv-cache-v2";
const urlsToCache = ["/", "/index.html", "/manifest.json"];

// Instala o Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Intercepta requisições (mas ignora chamadas à API)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 🔸 Se for uma requisição à API, não intercepta — deixa ir direto ao backend
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // 🔸 Somente GETs são armazenadas em cache
  if (event.request.method !== "GET") {
    return;
  }

  // 🔸 Busca do cache primeiro, depois da rede se necessário
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).then((networkResponse) => {
          // Armazena a resposta nova no cache para uso futuro
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
      );
    })
  );
});

// Atualiza o cache quando há uma nova versão
self.addEventListener("activate", (event) => {
  const whitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => {
          if (!whitelist.includes(name)) return caches.delete(name);
        })
      )
    )
  );
});
