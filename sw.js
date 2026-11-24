// FindMyMate : service worker simple.
// Change le numéro de VERSION à chaque nouvelle publication du site : l'ancien cache est alors supprimé.
var VERSION = "v24";
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

// Cache d'abord (rapide, marche hors ligne). En même temps, on va chercher la version à jour
// et on la range dans le cache : elle s'affichera à la visite suivante.
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
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
