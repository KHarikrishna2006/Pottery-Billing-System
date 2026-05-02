/* ═══════════════════════════════════════════════
   AUTO POTTERY BILL — SERVICE WORKER
   Full offline support + background sync
   ═══════════════════════════════════════════════ */

var CACHE_NAME = 'apb-v3';
var OFFLINE_PAGE = '/offline';

var STATIC_ASSETS = [
  '/',
  '/billing',
  '/history',
  '/dashboard',
  '/products',
  '/settings',
  '/static/css/style.css',
  '/static/js/billing.js',
  '/static/js/i18n.js',
  '/static/js/icons.js',
  '/static/js/pwa.js',
  '/static/icons/icon-192.png',
  '/static/icons/icon-512.png',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

/* ── INSTALL: cache everything ── */
self.addEventListener('install', function(e) {
  console.log('[SW] Installing...');
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] Caching static assets');
      /* Cache what we can, ignore failures for CDN */
      return Promise.allSettled(
        STATIC_ASSETS.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('[SW] Failed to cache:', url, err);
          });
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ── ACTIVATE: clean old caches ── */
self.addEventListener('activate', function(e) {
  console.log('[SW] Activating...');
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── FETCH: Network first, cache fallback ── */
self.addEventListener('fetch', function(e) {
  var req = e.request;
  var url = new URL(req.url);

  /* Skip non-GET and chrome-extension requests */
  if (req.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  /* API calls — network only, queue if offline */
  if (url.pathname.startsWith('/billing/create') ||
      url.pathname.startsWith('/products/') ||
      url.pathname.startsWith('/users/')) {
    e.respondWith(
      fetch(req).catch(function() {
        return new Response(JSON.stringify({error: 'You are offline. Please reconnect.'}),
          {status: 503, headers: {'Content-Type': 'application/json'}});
      })
    );
    return;
  }

  /* Static assets — cache first */
  if (url.pathname.startsWith('/static/') ||
      url.host.includes('fonts.googleapis') ||
      url.host.includes('cdn.tailwindcss') ||
      url.host.includes('cdnjs.cloudflare')) {
    e.respondWith(
      caches.match(req).then(function(cached) {
        if (cached) return cached;
        return fetch(req).then(function(res) {
          if (!res || res.status !== 200) return res;
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(req, clone); });
          return res;
        });
      })
    );
    return;
  }

  /* Pages — network first, cache fallback */
  e.respondWith(
    fetch(req).then(function(res) {
      /* Cache successful page responses */
      if (res && res.status === 200) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(c) { c.put(req, clone); });
      }
      return res;
    }).catch(function() {
      /* Offline — serve from cache */
      return caches.match(req).then(function(cached) {
        if (cached) return cached;
        /* Try root page as fallback */
        return caches.match('/').then(function(root) {
          if (root) return root;
          /* Last resort offline page */
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline — Auto Pottery Bill</title>' +
            '<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Inter,system-ui,sans-serif;background:#F8FAFC;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;}' +
            '.card{background:white;border-radius:20px;padding:32px 28px;text-align:center;max-width:340px;box-shadow:0 4px 24px rgba(0,0,0,.08);}' +
            '.icon{width:64px;height:64px;background:#EEF2FF;border-radius:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;}' +
            'h1{font-size:1.3rem;font-weight:800;color:#0F172A;margin-bottom:8px;}' +
            'p{font-size:.88rem;color:#64748B;margin-bottom:20px;line-height:1.5;}' +
            'button{width:100%;padding:13px;background:#4F46E5;color:white;border:none;border-radius:12px;font-size:.9rem;font-weight:700;cursor:pointer;}</style></head>' +
            '<body><div class="card">' +
            '<div class="icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="1.8" stroke-linecap="round"><path d="M12 2C8 2 5 5 5 9c0 2.5 1 4.5 2.5 6L9 21h6l1.5-6C18 13.5 19 11.5 19 9c0-4-3-7-7-7z"/><line x1="9" y1="21" x2="15" y2="21"/></svg></div>' +
            '<h1>You\'re Offline</h1>' +
            '<p>Auto Pottery Bill needs internet to sync bills. Please check your connection and try again.</p>' +
            '<button onclick="location.reload()">Try Again</button>' +
            '</div></body></html>',
            {status: 200, headers: {'Content-Type': 'text/html'}}
          );
        });
      });
    })
  );
});

/* ── BACKGROUND SYNC (queue offline actions) ── */
self.addEventListener('sync', function(e) {
  if (e.tag === 'sync-bills') {
    e.waitUntil(syncPendingBills());
  }
});

function syncPendingBills() {
  /* When back online, retry any queued bill creates */
  return self.clients.matchAll().then(function(clients) {
    clients.forEach(function(client) {
      client.postMessage({type: 'SYNC_COMPLETE'});
    });
  });
}
