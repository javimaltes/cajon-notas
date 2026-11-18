/* Cajón de sastre (app web): works without connection. The app's files are kept here; a new version is
   fetched in the background and used the next time the app opens. Notes are not here: they live in the app's own storage. */
const CACHE = 'cajon-notas-v1';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // the computer, WhatsApp…: never from here
  e.respondWith(caches.open(CACHE).then(async cache => {
    const key = url.pathname.endsWith('/') ? './' : req;
    const hit = await cache.match(key, { ignoreSearch: true });
    const fresh = fetch(req, { cache: 'no-cache' }).then(r => { if (r && r.ok) cache.put(key, r.clone()); return r; }).catch(() => null);
    return hit || (await fresh) || new Response('Sin conexión', { status: 503 });
  }));
});
