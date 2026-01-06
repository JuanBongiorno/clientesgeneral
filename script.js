document.addEventListener('DOMContentLoaded', () => {
    // URL de tu aplicación web de Google Apps Script
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxwZ-VMZvFwiyNTZo4UDrP0o_ngoAs8rlDRKgGbHutIl_zlQz8ApDhaVJ1JKCJcYMdM3g/exec';

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

    // Manejar el login (Usuario: 1234 / Pass: 1234)
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
        formReposicion.reset();
        reposicionMessage.textContent = '';
    });

    btnServicio.addEventListener('click', () => {
        showSection('servicio-tecnico-form');
        formServicioTecnico.reset();
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

    // --- ENVIAR DATOS DE REPOSICIÓN DE BIDONES (ACTUALIZADO) ---
    formReposicion.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(formReposicion);
        
        // Mapeo de datos con los NUEVOS CAMPOS
        const data = {
            sheet: 'ReposicionBidones',
            cliente: formData.get('cliente'),    // NUEVO
            lugar: formData.get('lugar'),        // NUEVO
            sector: formData.get('sector'),      // NUEVO
            nroRack: formData.get('nroRack'),    // NUEVO
            bidonesLlenos: formData.get('bidonesLlenos'),
            bidonesRetirados: formData.get('bidonesRetirados'),
            observaciones: formData.get('observaciones')
        };

        try {
            reposicionMessage.textContent = 'Enviando datos...';
            reposicionMessage.style.color = '#007bff';

            await fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors', 
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(data).toString(),
            });

            reposicionMessage.textContent = 'Datos de reposición guardados con éxito.';
            reposicionMessage.style.color = '#28a745';
            formReposicion.reset();
        } catch (error) {
            console.error('Error al enviar datos de reposición:', error);
            reposicionMessage.textContent = 'Error al guardar los datos de reposición.';
            reposicionMessage.style.color = '#dc3545';
        }
    });

    // --- ENVIAR DATOS DE SERVICIO TÉCNICO ---
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
            servicioMessage.textContent = 'Enviando datos...';
            servicioMessage.style.color = '#007bff';

            await fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors',
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