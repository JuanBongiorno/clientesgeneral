/* Cola de reportes persistente en IndexedDB.
   Se comparte entre la página y el Service Worker (importScripts). */
(function (scope) {
    const DB_NAME = 'reportes-db';
    const STORE = 'pendientes';
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyFEQtywM_pXIcX-GT-K3pnztvB4_jIcKPtUR9WdghpHbLi157MC6sAFsVEUjYH0ZjKpA/exec';

    let dbPromise = null;

    function openDB() {
        if (dbPromise) return dbPromise;
        dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE)) {
                    db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        return dbPromise;
    }

    function tx(mode, fn) {
        return openDB().then(db => new Promise((resolve, reject) => {
            const t = db.transaction(STORE, mode);
            const req = fn(t.objectStore(STORE));
            t.oncomplete = () => resolve(req && req.result);
            t.onerror = () => reject(t.error);
            t.onabort = () => reject(t.error);
        }));
    }

    const enqueue = (data) => tx('readwrite', s => s.add({ data, creado: Date.now() }));
    const getAll = () => tx('readonly', s => s.getAll());
    const remove = (id) => tx('readwrite', s => s.delete(id));
    const count = () => tx('readonly', s => s.count());

    async function enviar(data) {
        // Apps Script no expone CORS: usamos no-cors y confiamos en el status opaco.
        const res = await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            keepalive: true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data).toString()
        });
        // En modo no-cors la respuesta es opaca (type === 'opaque'); si no hubo
        // excepción de red, la petición salió del dispositivo.
        return res.type === 'opaque' || res.ok;
    }

    let vaciando = false;

    async function flush() {
        if (vaciando) return { enviados: 0, pendientes: await count() };
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            return { enviados: 0, pendientes: await count() };
        }
        vaciando = true;
        let enviados = 0;
        try {
            const items = await getAll();
            for (const item of items) {
                try {
                    await enviar(item.data);
                    await remove(item.id);
                    enviados++;
                } catch (e) {
                    break; // sin red: se reintenta más tarde
                }
            }
        } finally {
            vaciando = false;
        }
        return { enviados, pendientes: await count() };
    }

    scope.ReportQueue = { enqueue, getAll, remove, count, flush, enviar, WEB_APP_URL };
})(self);
