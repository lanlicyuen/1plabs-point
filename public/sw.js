const CACHE_NAME = "point-app-shell-v1";
const STATIC_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const HTML_MAX_AGE = 24 * 60 * 60; // 1 day

// App Shell resources to pre-cache on install
const APP_SHELL = [
  "/",
  "/login",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-192.png",
  "/icons/maskable-512.png",
];

// Install: cache App Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Helper: check if a response is fresh enough
function isFresh(response, maxAge) {
  if (!response || !response.headers) return false;
  const date = response.headers.get("date");
  if (!date) return true; // no date header, assume fresh
  const age = (Date.now() - new Date(date).getTime()) / 1000;
  return age < maxAge;
}

// Fetch handler
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ─── SECURITY RULES ────────────────────────────────────────
  // A. Non-http(s) requests: let the browser handle them.
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }

  // B. Non-GET requests: let the browser handle them, never cache
  if (request.method !== "GET") {
    return;
  }

  // C. /api/* paths: let the browser handle them, never cache
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // D. /admin paths: let the browser handle them, never cache
  if (url.pathname.includes("/admin")) {
    return;
  }

  // E. Requests with Authorization header: let the browser handle them, never cache
  if (request.headers.get("Authorization")) {
    return;
  }

  // ─── STRATEGIES ─────────────────────────────────────────────

  // G. Static assets (/_next/static/, /icons/): cache-first
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached && isFresh(cached, STATIC_MAX_AGE)) {
            return cached;
          }
          return fetch(request).then((response) => {
            if (response.ok) {
              // E. Don't cache responses with Set-Cookie
              if (response.headers.get("Set-Cookie")) {
                return response;
              }
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => cached || new Response("Offline", { status: 503 }));
        })
      )
    );
    return;
  }

  // F. HTML pages (accept contains text/html): network-first, fallback to cached /
  if (request.headers.get("Accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !response.headers.get("Set-Cookie")) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, cloned);
            });
          }
          return response;
        })
        .catch(() =>
          caches.open(CACHE_NAME).then((cache) =>
            cache.match(request).then((cached) => {
              if (cached && isFresh(cached, HTML_MAX_AGE)) {
                return cached;
              }
              // Ultimate fallback: cached root
              return cache.match("/");
            })
          )
        )
    );
    return;
  }

  // H. Everything else: network-first, cache successful responses
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && !response.headers.get("Set-Cookie")) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cloned);
          });
        }
        return response;
      })
      .catch(() =>
        caches.open(CACHE_NAME).then((cache) => cache.match(request))
      )
  );
});
