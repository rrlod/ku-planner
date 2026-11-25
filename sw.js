/* KuPlannerV7.0: offline planner and Passport. */
const CACHE = 'ku-planner-v7-20261125-2';
const ASSETS = [
  '/', '/index.html', '/install.html', '/download.html', '/download-v7.css', '/manifest.webmanifest', '/app-runtime-v7.js', '/ui-v7.css', '/ui-v7.js', '/OpenSans-Regular.ttf', '/OpenSans-Semibold.ttf', '/OpenSans-Bold.ttf', '/KUPlanner.ico',
  '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png',
  '/KU%20Campus%20Passport.html', '/style.css',
  '/academic-calendar.js', '/app-v7.js', '/banner.js',
  '/feedback.js', '/passport-v7.js', '/photo-import-v5.js',
  '/planning.js', '/schedule-grid-v5.js', '/schedule-parser-v5.js',
  '/khalifa-university-logo.png', '/leaderboard.html', '/features-v6.css', '/syllabus-v7.js', '/week-model-v61.js', '/week-features-v61.js', '/week-features-v61.css', '/syllabus-parser-v7.js',
  '/academic-calendar-2026-2027.pdf'
];
const appRoot = new URL('.', self.location.href);
const urls = new Set(ASSETS.map(p => new URL(p.slice(1) || '.', appRoot).href));
// Cache the larger reader files only after they are requested.
for (const name of ['tesseract.min.js','tesseract-worker.min.js','tesseract-core-lstm.wasm.js','eng.traineddata','syllabus-pdf-v6.js','syllabus-worker-v6.js','syllabus-zip-v6.js']) urls.add(new URL(name,appRoot).href);
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
      if (key.startsWith('ku-planner-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('notificationclick',event=>{event.notification.close();const url=new URL('index.html',appRoot).href;event.waitUntil((async()=>{const pages=await self.clients.matchAll({type:'window',includeUncontrolled:true});const page=pages.find(p=>p.url.startsWith(appRoot.href));if(page)return page.focus();return self.clients.openWindow(url);})());});
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
    const saved = await cache.match(url.href);
    if (saved) return saved;
    const fresh = await fetch(request);
    if (fresh.ok && !fresh.redirected && fresh.type !== 'opaque') await cache.put(url.href,fresh.clone());
    return fresh;
  })());
});
