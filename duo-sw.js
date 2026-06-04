const DUO_CACHE = "duo-update-app-v1";
const DUO_ASSETS = [
  "./index.html",
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

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "./index.html";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(openClients => {
      for(const client of openClients){
        if("focus" in client){
          client.navigate(targetUrl).catch(() => null);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener("push", event => {
  let payload = {};
  try{ payload = event.data ? event.data.json() : {}; }catch{
    payload = { title: "Duo Update", body: event.data ? event.data.text() : "Nouvelle notification" };
  }
  const title = payload.title || "Duo Update";
  const options = {
    body: payload.body || "Nouvelle notification",
    icon: "./duo-icon.svg",
    badge: "./duo-icon.svg",
    tag: payload.tag || "duo-update",
    data: { url: payload.url || "./index.html" },
    renotify: true
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
