document.addEventListener('DOMContentLoaded', () => {
    // ¡IMPORTANTE! Reemplaza con la URL de la aplicación web que obtuviste de Google Apps Script
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzVjcoUGcJHpZUu2ZcXSPHNEmyrUKwkuBQDXcEveKEoPy4Gh94VEvmSx1lmo6jajlm7fg/exec';

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

    // Enviar datos de reposición de bidones
    formReposicion.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(formReposicion);
        const data = {
            sheet: 'ReposicionBidones',
            bidonesLlenos: formData.get('bidonesLlenos'),
            bidonesRetirados: formData.get('bidonesRetirados'),
            observaciones: formData.get('observaciones')
        };

        try {
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors', // Importante para Google Apps Script
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(data).toString(),
            });
            // Google Apps Script en modo no-cors no permite leer la respuesta,
            // pero si la petición es exitosa, se asume que funcionó.
            // Para una verificación más robusta, se necesitaría un proxy o CORS configurado en Apps Script.
            reposicionMessage.textContent = 'Datos de reposición guardados con éxito.';
            reposicionMessage.style.color = '#28a745';
            formReposicion.reset();
        } catch (error) {
            console.error('Error al enviar datos de reposición:', error);
            reposicionMessage.textContent = 'Error al guardar los datos de reposición.';
            reposicionMessage.style.color = '#dc3545';
        }
    });

    // Enviar datos de servicio técnico
    formServicioTecnico.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(formServicioTecnico);
        const data = {
            sheet: 'ServicioTecnico',
            cliente: formData.get('cliente'),
            idDispenser: formData.get('idDispenser'),
            lugar: formData.get('lugar'),
            sector: formData.get('sector'),
            tecnico: formData.get('tecnico'),
            observaciones: formData.get('observaciones')
        };

        try {
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors', // Importante para Google Apps Script
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(data).toString(),
            });
            servicioMessage.textContent = 'Datos de servicio técnico guardados con éxito.';
            servicioMessage.style.color = '#28a745';
            formServicioTecnico.reset();
        } catch (error) {
            console.error('Error al enviar datos de servicio técnico:', error);
            servicioMessage.textContent = 'Error al guardar los datos de servicio técnico.';
            servicioMessage.style.color = '#dc3545';
        }
    });
});