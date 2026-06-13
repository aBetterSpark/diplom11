// js/app.js – полный рабочий код для авторизации и загрузки техники
(function() {
    const loginContainer = document.getElementById('login-container');
    const mainApp = document.getElementById('main-app');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const errorSpan = document.getElementById('login-error');

    // Функция загрузки техники и отображения в списке
    async function loadAndShowMachinery() {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('/api/machinery', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) {
                localStorage.removeItem('token');
                location.reload();
                return;
            }
            const machinery = await res.json();
            const container = document.getElementById('tech-list');
            if (container) {
                if (machinery.length === 0) {
                    container.innerHTML = '<p>Нет техники</p>';
                } else {
                    container.innerHTML = machinery.map(tech => `
                        <div class="tech-card">
                            <h3>${tech.name}</h3>
                            <p>Статус: ${tech.status}</p>
                            <p>Топливо: ${tech.fuel}%</p>
                            <p>Поле: ${tech.field || '—'}</p>
                            <p>Скорость: ${tech.speed || '—'}</p>
                            <p>Эффективность: ${tech.efficiency || '—'}%</p>
                        </div>
                    `).join('');
                }
            }
            // Если есть карта – обновим маркеры (если функция существует)
            if (typeof updateMapMarkers === 'function') updateMapMarkers(machinery);
            // Обновим статистику (если есть)
            if (typeof updateStatistics === 'function') updateStatistics(machinery);
            console.log(`✅ Загружено ${machinery.length} единиц техники`);
        } catch (err) {
            console.error('Ошибка загрузки техники:', err);
            const container = document.getElementById('tech-list');
            if (container) container.innerHTML = '<p>Ошибка загрузки данных</p>';
        }
    }

    // Проверка токена при загрузке
    if (localStorage.getItem('token')) {
        loginContainer.style.display = 'none';
        mainApp.style.display = 'block';
        loadAndShowMachinery();
    } else {
        loginContainer.style.display = 'flex';
        mainApp.style.display = 'none';
    }

    // Логин
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            errorSpan.innerText = '';
            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Ошибка входа');
                localStorage.setItem('token', data.token);
                loginContainer.style.display = 'none';
                mainApp.style.display = 'block';
                loadAndShowMachinery();
                // Если карта инициализируется отдельно
                if (typeof initMap === 'function') initMap();
            } catch (err) {
                errorSpan.innerText = err.message;
            }
        });
    }

    // Выход
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            location.reload();
        });
    }
})();