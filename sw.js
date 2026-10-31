// Guarda a app em cache para funcionar sem rede (a taxa é fixa, não há nada para atualizar).
const CACHE = "escudo-v3";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon.svg", "icon-180.png", "icon-512.png"];
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const cacheable = url.origin === location.origin || FONT_HOSTS.includes(url.hostname);
  e.respondWith(
    caches.match(e.request, { ignoreSearch: e.request.mode === "navigate" }).then((hit) => hit || fetch(e.request).then((res) => {
      // As fontes do Google chegam como respostas opacas (status 0); também servem offline
      if (cacheable && (res.ok || res.type === "opaque")) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => (e.request.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
