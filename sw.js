/* Offline support: network first so updates arrive, cache as the fallback. */
const CACHE = 'library-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'src/app.js', 'src/ui.js', 'src/base.css', 'src/app.css', 'icons/icon-192.png', 'icons/icon-512.png', 'content/manifest.json'];
const CHART = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
self.addEventListener('install', e => e.waitUntil((async () => {
  const c = await caches.open(CACHE);
  await c.addAll(CORE);
  try {
    const m = await (await fetch('content/manifest.json', { cache: 'no-cache' })).json();
    await c.addAll([...m.guides.map(g => `content/${g.id}.html`), ...m.visuals.map(v => `visuals/${v.id}.html`)]);
  } catch (err) { /* offline install: guides cache as they are opened */ }
  try { await c.put(CHART, await fetch(CHART, { mode: 'no-cors' })); } catch (err) {}
  self.skipWaiting();
})()));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
