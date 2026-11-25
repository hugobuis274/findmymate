// FindMyMate : service worker simple.
// Change le numéro de VERSION à chaque nouvelle publication du site : l'ancien cache est alors supprimé.
var VERSION = "v32";
var CACHE = "findmymate-" + VERSION;
var FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "mentions-legales.html",
  "conditions.html",
  "confidentialite.html",
  "cookies.html",
  "legal.css"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Les pages HTML (accueil + pages légales) sont chargées d'abord depuis le réseau : le texte
// affiché est toujours à jour. Si le réseau échoue, on ressert la copie en cache (hors ligne).
// Le reste (images, polices du site, CSS) reste cache d'abord, avec rafraîchissement en fond.
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  var isPage = req.mode === "navigate" || /\.html$/.test(new URL(req.url).pathname);
  if (isPage) {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () { return caches.match(req).then(function (cached) { return cached || caches.match("./"); }); })
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(function (cached) {
      var refresh = fetch(req).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () { return cached; });
      return cached || refresh;
    })
  );
});
