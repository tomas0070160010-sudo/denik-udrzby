// Deník údržby – service worker webové verze: aplikace se otevře i bez signálu.
// Ukládá jen soubory aplikace (stránka, ikony). Data a fotky sem nepatří – ty má aplikace ve svém úložišti; spojení na server se nechává být.
const CACHE = 'denik-v103';
const SOUBORY = ['./', './index.html', './manifest.webmanifest', './ikona-192.png', './ikona-512.png', './ikona-maskable-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SOUBORY)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((L) => Promise.all(L.filter((k) => k.startsWith('denik-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
// nejdřív síť (nová verze se načte sama), při výpadku nebo pomalé síti uložená kopie.
// Když síť nestihne limit, ukáže se uložená kopie, ale stahování běží dál a uloží se – příští otevření už má novou verzi.
self.addEventListener('fetch', (e) => { const r = e.request; if (r.method !== 'GET') return; const u = new URL(r.url); if (u.origin !== self.location.origin) return;
  const stranka = r.mode === 'navigate'; const klic = stranka ? './index.html' : u.pathname;
  const sit = caches.open(CACHE).then((c) => fetch(r.url, { cache: 'no-cache', credentials: 'same-origin' }).then(async (res) => { if (res.ok) await c.put(klic, res.clone()); return res; }));
  e.waitUntil(sit.catch(() => {}));
  e.respondWith((async () => { const c = await caches.open(CACHE); let t;
    const limit = new Promise((ok) => { t = setTimeout(() => ok(null), stranka ? 4000 : 8000); });
    try { const res = await Promise.race([sit, limit]); clearTimeout(t); if (res) return res.clone(); } catch (er) { clearTimeout(t); }
    const m = await c.match(klic, { ignoreSearch: true }); if (m) return m;
    try { return (await sit).clone(); } catch (er) { return new Response('Deník: bez spojení a v zařízení zatím není uložený.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); } })()); });
