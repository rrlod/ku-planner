/* KU Planner V4.0: cache only the app's public, static files, never sign-in routes. */
const CACHE = 'ku-planner-v4-20261112-2';
const ASSETS = [
  '/', '/index.html', '/install.html', '/install.css', '/manifest.webmanifest', '/desktop-app.js', '/desktop-app.css', '/KUPlanner.ico',
  '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png',
  '/KU%20Campus%20Passport.html', '/style.css',
  '/academic-calendar.js', '/app.js', '/banner.js',
  '/feedback.js', '/passport.js', '/photo-import.js',
  '/planning.js', '/schedule-grid.js', '/schedule-parser.js',
  '/khalifa-university-logo.png',
  '/academic-calendar-2026-2027.pdf'
];
const appRoot = new URL('.', self.location.href);
const urls = new Set(ASSETS.map(p => new URL(p.slice(1) || '.', appRoot).href));
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const asset of ASSETS) {
      const address = new URL(asset.slice(1) || '.', appRoot).href;
      const response = await fetch(new Request(address, {cache: 'reload', credentials: 'same-origin'}));
      if (!response.ok || response.redirected || response.type === 'opaque') {
        throw new Error('Offline files could not be saved: ' + asset);
      }
      const type = response.headers.get('content-type') || '';
      const expected = /\.js$/.test(asset) ? /javascript/ : /\.css$/.test(asset) ? /text\/css/ : /\.webmanifest$/.test(asset) ? /json/ : /\.png$/.test(asset) ? /image\/png/ : /\.pdf$/.test(asset) ? /application\/pdf/ : null;
      if (expected && !expected.test(type)) throw new Error('Unexpected offline file type: ' + asset);
      await cache.put(address, response);
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('ku-planner-v4-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  url.search = ''; url.hash = '';
  if (!urls.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (request.mode === 'navigate') {
      try {
        const fresh = await fetch(request);
        // A private Site can redirect to sign-in. Never store that page as the planner.
        if (fresh.ok && !fresh.redirected && fresh.type !== 'opaque') await cache.put(url.href, fresh.clone());
        if (fresh.ok || fresh.redirected) return fresh;
      } catch {}
      return (await cache.match(url.href)) || Response.error();
    }
    return (await cache.match(url.href)) || fetch(request);
  })());
});
