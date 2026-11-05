// Deník údržby – service worker webové verze: aplikace se otevře i bez signálu.
// Ukládá jen soubory aplikace (stránka, ikony). Data a fotky sem nepatří – ty má aplikace ve svém úložišti; spojení na server se nechává být.
const CACHE = 'denik-v59';
const SOUBORY = ['./', './index.html', './manifest.webmanifest', './ikona-192.png', './ikona-512.png', './ikona-maskable-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SOUBORY)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((L) => Promise.all(L.filter((k) => k.startsWith('denik-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
// nejdřív síť (nová verze se načte sama), při výpadku nebo pomalé síti uložená kopie
const zSite = (url, ms) => new Promise((ok, ko) => { const t = setTimeout(() => ko(new Error('pomalá síť')), ms);
  fetch(url, { cache: 'no-cache', credentials: 'same-origin' }).then((r) => { clearTimeout(t); ok(r); }, (e) => { clearTimeout(t); ko(e); }); });
self.addEventListener('fetch', (e) => { const r = e.request; if (r.method !== 'GET') return; const u = new URL(r.url); if (u.origin !== self.location.origin) return;
  const stranka = r.mode === 'navigate'; const klic = stranka ? './index.html' : u.pathname;
  e.respondWith((async () => { const c = await caches.open(CACHE);
    try { const res = await zSite(r.url, stranka ? 4000 : 8000); if (res.ok) await c.put(klic, res.clone()); return res; }
    catch (er) { const m = await c.match(klic, { ignoreSearch: true }); if (m) return m; return new Response('Deník: bez spojení a v zařízení zatím není uložený.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); } })()); });
