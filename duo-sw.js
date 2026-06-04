const DUO_CACHE = "duo-update-app-v1";
const DUO_ASSETS = [
  "./index-pocketbase-v50-4-presence-online-only.html",
  "./duo-manifest.webmanifest",
  "./duo-icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(DUO_CACHE)
      .then(cache => cache.addAll(DUO_ASSETS))
      .catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== DUO_CACHE).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if(request.method !== "GET" || url.origin !== location.origin){
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        const clone = response.clone();
        caches.open(DUO_CACHE).then(cache => cache.put(request, clone)).catch(() => null);
        return response;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match("./index-pocketbase-v50-4-presence-online-only.html")))
  );
});
