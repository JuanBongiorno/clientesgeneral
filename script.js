document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const mainMenu = document.getElementById('main-menu');
    const reposicionForm = document.getElementById('reposicion-bidones-form');
    const servicioTecnicoForm = document.getElementById('servicio-tecnico-form');

    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    const btnReposicion = document.getElementById('btn-reposicion');
    const btnServicio = document.getElementById('btn-servicio');
    const btnLogout = document.getElementById('btn-logout');

    const formReposicion = document.getElementById('form-reposicion');
    const reposicionMessage = document.getElementById('reposicion-message');

    const formServicioTecnico = document.getElementById('form-servicio-tecnico');
    const servicioMessage = document.getElementById('servicio-message');

    const backButtons = document.querySelectorAll('.back-button');

    const statusConexion = document.getElementById('status-conexion');
    const statusPendientes = document.getElementById('status-pendientes');

    function showSection(sectionId) {
        [loginContainer, mainMenu, reposicionForm, servicioTecnicoForm].forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(sectionId).classList.remove('hidden');
    }

    // Inicialmente mostrar el login
    showSection('login-container');

    // Manejar el login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === '1234' && password === '1234') {
            showSection('main-menu');
            loginError.textContent = '';
        } else {
            loginError.textContent = 'Usuario o contraseña incorrectos.';
        }
    });

    // Manejar botones del menú principal
    btnReposicion.addEventListener('click', () => {
        showSection('reposicion-bidones-form');
        formReposicion.reset(); // Limpiar formulario al mostrar
        reposicionMessage.textContent = '';
    });

    btnServicio.addEventListener('click', () => {
        showSection('servicio-tecnico-form');
        formServicioTecnico.reset(); // Limpiar formulario al mostrar
        servicioMessage.textContent = '';
    });

    btnLogout.addEventListener('click', () => {
        showSection('login-container');
        loginForm.reset();
        loginError.textContent = '';
    });

    // Botones de Volver
    backButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetSectionId = button.dataset.target;
            showSection(targetSectionId);
        });
    });

    /* ---------- Estado de conexión y cola de envíos ---------- */

    function pintarConexion() {
        const online = navigator.onLine;
        statusConexion.textContent = online ? 'En línea' : 'Sin conexión';
        statusConexion.classList.toggle('online', online);
        statusConexion.classList.toggle('offline', !online);
    }

    async function pintarPendientes() {
        const n = await ReportQueue.count().catch(() => 0);
        statusPendientes.textContent = n === 1 ? '1 reporte pendiente' : `${n} reportes pendientes`;
        statusPendientes.classList.toggle('hidden', n === 0);
        return n;
    }

    function mostrarMensaje(el, texto, tipo) {
        el.textContent = texto;
        el.style.color = tipo === 'error' ? '#dc3545' : (tipo === 'pendiente' ? '#e67e22' : '#28a745');
    }

    // Pide al Service Worker que vacíe la cola; si no está disponible lo hace la página.
    async function dispararEnvio() {
        const reg = 'serviceWorker' in navigator
            ? await navigator.serviceWorker.ready.catch(() => null)
            : null;
        if (reg) {
            if ('sync' in reg) {
                try {
                    await reg.sync.register('sync-reportes');
                } catch (e) { /* sin Background Sync: seguimos con el vaciado manual */ }
            }
            if (reg.active) {
                reg.active.postMessage({ type: 'flush' });
                return;
            }
        }
        ReportQueue.flush().then(pintarPendientes);
    }

    // Guarda el reporte al instante y lo envía en segundo plano.
    async function encolarYResponder(data, mensajeEl) {
        await ReportQueue.enqueue(data);
        if (navigator.onLine) {
            mostrarMensaje(mensajeEl, 'Reporte guardado. Enviándose en segundo plano...', 'ok');
        } else {
            mostrarMensaje(mensajeEl, 'Sin conexión: guardado en el dispositivo, se enviará solo al volver la señal.', 'pendiente');
        }
        pintarPendientes();
        dispararEnvio();
    }

    formReposicion.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(formReposicion);
        const data = {
            sheet: 'ReposicionBidones',
            bidonesLlenos: formData.get('bidonesLlenos'),
            bidonesRetirados: formData.get('bidonesRetirados'),
            observaciones: formData.get('observaciones'),
            fecha: new Date().toISOString()
        };
        formReposicion.reset();
        encolarYResponder(data, reposicionMessage);
    });

    formServicioTecnico.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(formServicioTecnico);
        const data = {
            sheet: 'ServicioTecnico',
            cliente: formData.get('cliente'),
            idDispenser: formData.get('idDispenser'),
            lugar: formData.get('lugar'),
            sector: formData.get('sector'),
            tecnico: formData.get('tecnico'),
            observaciones: formData.get('observaciones'),
            fecha: new Date().toISOString()
        };
        formServicioTecnico.reset();
        encolarYResponder(data, servicioMessage);
    });

    window.addEventListener('online', () => { pintarConexion(); dispararEnvio(); });
    window.addEventListener('offline', pintarConexion);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine) dispararEnvio();
    });

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'queue-updated') pintarPendientes();
        });
        navigator.serviceWorker.register('sw.js')
            .then(() => dispararEnvio())
            .catch(err => console.error('No se pudo registrar el Service Worker:', err));
    }

    pintarConexion();
    pintarPendientes();
});