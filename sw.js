importScripts('./queue.js');

const CACHE = 'gestion-bidones-v3';
const APP_SHELL = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './queue.js',
    './manifest.webmanifest',
    './assets/img/3d-agua-ai-generar.jpg',
    './assets/img/Generated Image November 08, 2025 - 9_08PM.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then(cache => Promise.allSettled(APP_SHELL.map(url => cache.add(url))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return; // Apps Script y externos: red directa

    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req).catch(() => caches.match('./index.html'))
        );
        return;
    }

    // Cache-first con revalidación en segundo plano.
    event.respondWith(
        caches.match(req).then(cached => {
            const red = fetch(req).then(res => {
                if (res && res.ok) {
                    const copia = res.clone();
                    caches.open(CACHE).then(c => c.put(req, copia));
                }
                return res;
            }).catch(() => cached);
            return cached || red;
        })
    );
});

// Background Sync: el navegador reintenta solo al recuperar la conexión.
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-reportes') {
        event.waitUntil(self.ReportQueue.flush().then(avisar));
    }
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'flush') {
        event.waitUntil(self.ReportQueue.flush().then(avisar));
    }
});

async function avisar(resultado) {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    clients.forEach(c => c.postMessage({ type: 'queue-updated', ...resultado }));
}
