const CACHE_NAME = "otl-trading-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];


/* ================= INSTALL ================= */

self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())

  );

});


/* ================= ACTIVATE ================= */

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys().then(keys =>

      Promise.all(

        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))

      )

    ).then(() => self.clients.claim())

  );

});


/* ================= FETCH ================= */

self.addEventListener("fetch", event => {

  const request = event.request;

  /*
   * TradingView / external live resources
   * should go directly to the internet.
   */

  if (
    request.url.includes("tradingview.com") ||
    request.url.includes("s3.tradingview.com")
  ) {
    return;
  }


  /*
   * App files:
   * network first, cache fallback.
   */

  event.respondWith(

    fetch(request)
      .then(response => {

        if (
          response &&
          response.status === 200 &&
          request.method === "GET"
        ) {

          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, copy);
            });

        }

        return response;

      })
      .catch(() => {

        return caches.match(request);

      })

  );

});


/* ================= MESSAGE ================= */

self.addEventListener("message", event => {

  if (event.data === "SKIP_WAITING") {

    self.skipWaiting();

  }

});
