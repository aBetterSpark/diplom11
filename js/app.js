// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let token = localStorage.getItem('token');
let currentUser = null;
let machineryDataFromServer = [];

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function getStatusText(status) {
    const map = { working: 'В работе', idle: 'Простой', repair: 'Ремонт' };
    return map[status] || status;
}

function getTypeText(type) {
    const map = { tractor: 'Трактор', combine: 'Комбайн', truck: 'Грузовик' };
    return map[type] || type;
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function animateProgressBar(id, percent) {
    const bar = document.getElementById(id);
    if (bar) {
        bar.style.width = '0%';
        setTimeout(() => bar.style.width = percent + '%', 50);
    }
}

function getCurrentShortTime() {
    return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// ==================== ЗАГРУЗКА ДАННЫХ С СЕРВЕРА ====================
async function loadMachinery() {
    if (!token) return;
    // Если пользователь агроном – не загружаем технику
    const role = currentUser ? currentUser.role : null;
    if (role === 'agronomist') return;
    try {
        const typeFilter = document.getElementById('type-filter');
        const statusFilter = document.getElementById('status-filter');
        const filters = {
            type: typeFilter ? typeFilter.value : 'all',
            status: statusFilter ? statusFilter.value : 'all'
        };
        const params = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/machinery?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Ошибка загрузки техники');
        machineryDataFromServer = await response.json();
        
        renderTechList(machineryDataFromServer);
        updateStatistics();
        if (typeof updateMapMarkers === 'function') {
            updateMapMarkers(machineryDataFromServer);
        }
    } catch (err) {
        console.error('Ошибка загрузки техники:', err);
    }
}

// ==================== ОТРИСОВКА КАРТОЧЕК ТЕХНИКИ ====================
function renderTechList(data) {
    const container = document.getElementById('tech-list');
    if (!container) return;
    container.innerHTML = '';
    if (!data.length) {
        container.innerHTML = '<div class="loading-state">Нет техники</div>';
        return;
    }
    data.forEach(tech => container.appendChild(createTechCard(tech)));
}

function createTechCard(tech) {
    const card = document.createElement('div');
    card.className = `tech-card ${tech.status}`;
    card.dataset.id = tech.id;

    const onlineIndicator = tech.online 
        ? '<span class="online-indicator active" title="Онлайн"></span>'
        : '<span class="online-indicator inactive" title="Оффлайн"></span>';

    let typeIcon = 'fa-tractor';
    if (tech.type === 'combine') typeIcon = 'fa-wheat-alt';
    if (tech.type === 'truck') typeIcon = 'fa-truck';

    let fuelClass = 'fuel-high';
    if (tech.fuel < 30) fuelClass = 'fuel-low';
    else if (tech.fuel < 60) fuelClass = 'fuel-medium';

    card.innerHTML = `
        <div class="tech-header">
            <div class="tech-title">
                <i class="fas ${typeIcon}"></i> ${tech.name} ${onlineIndicator}
            </div>
            <div class="tech-status status-${tech.status}">${getStatusText(tech.status)}</div>
        </div>
        <div class="tech-details">
            <div class="detail-row"><span class="detail-label">Тип:</span><span>${getTypeText(tech.type)}</span></div>
            <div class="detail-row"><span class="detail-label">Поле:</span><span>${tech.field || '—'}</span></div>
            <div class="detail-row"><span class="detail-label">Машинист:</span><span>${tech.driver || '—'}</span></div>
            <div class="detail-row"><span class="detail-label">Работа:</span><span>${tech.work || '—'}</span></div>
            <div class="detail-row"><span class="detail-label">Скорость:</span><span>${tech.speed || '—'}</span></div>
            <div class="detail-row"><span class="detail-label">Эффективность:</span><span>${tech.efficiency || '—'}%</span></div>
            <div class="detail-row"><span class="detail-label">Обновлено:</span><span>${tech.lastUpdate || '—'}</span></div>
        </div>
        <div class="fuel-indicator">
            <div class="fuel-label"><span>Топливо</span><span>${tech.fuel}%</span></div>
            <div class="fuel-bar"><div class="fuel-level ${fuelClass}" style="width:${tech.fuel}%"></div></div>
        </div>
    `;

    card.addEventListener('click', () => {
        document.querySelectorAll('.tech-card').forEach(c => c.classList.remove('highlighted'));
        card.classList.add('highlighted');
        if (typeof map !== 'undefined' && map && tech.lat && tech.lng) {
            map.setView([tech.lat, tech.lng], 15);
            if (typeof markers !== 'undefined') {
                const marker = markers.find(m => 
                    Math.abs(m.getLatLng().lat - tech.lat) < 0.0001 &&
                    Math.abs(m.getLatLng().lng - tech.lng) < 0.0001
                );
                if (marker) marker.openPopup();
            }
        }
    });
    return card;
}

// ==================== СТАТИСТИКА ====================
function updateStatistics() {
    const total = machineryDataFromServer.length;
    const working = machineryDataFromServer.filter(t => t.status === 'working').length;
    const idle = machineryDataFromServer.filter(t => t.status === 'idle').length;
    const repair = machineryDataFromServer.filter(t => t.status === 'repair').length;
    const online = machineryDataFromServer.filter(t => t.online === 1).length;
    const avgFuel = total ? Math.round(machineryDataFromServer.reduce((s, t) => s + t.fuel, 0) / total) : 0;
    const avgEfficiency = total ? Math.round(machineryDataFromServer.reduce((s, t) => s + t.efficiency, 0) / total) : 0;
    const planPercent = total ? Math.min(100, Math.round((working / total) * 100 + 20)) : 0;

    setText('online-count', online);
    setText('working-count', working);
    setText('update-time', getCurrentShortTime());
    setText('total-count', total);
    setText('working-badge', working);
    setText('idle-badge', idle);
    setText('repair-badge', repair);
    setText('avg-fuel', avgFuel + '%');
    setText('avg-efficiency', avgEfficiency + '%');
    setText('plan-percent', planPercent + '%');

    animateProgressBar('fuel-progress', avgFuel);
    animateProgressBar('efficiency-progress', avgEfficiency);
    animateProgressBar('plan-progress', planPercent);
}

// ==================== ФИЛЬТРЫ И ОБНОВЛЕНИЕ ====================
function applyFilters() {
    const typeFilter = document.getElementById('type-filter');
    const statusFilter = document.getElementById('status-filter');
    if (!typeFilter || !statusFilter) return;
    const typeValue = typeFilter.value;
    const statusValue = statusFilter.value;
    const filtered = machineryDataFromServer.filter(tech => {
        const typeMatch = typeValue === 'all' || tech.type === typeValue;
        const statusMatch = statusValue === 'all' || tech.status === statusValue;
        return typeMatch && statusMatch;
    });
    renderTechList(filtered);
    if (typeof updateMapWithFilter === 'function') updateMapWithFilter(filtered);
    setText('total-count', filtered.length);
    showNotification(`Найдено ${filtered.length} единиц техники`, 'info');
}

async function refreshData() {
    const btn = document.getElementById('refresh-data');
    if (!btn) return;
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обновление...';
    btn.disabled = true;
    await loadMachinery();
    btn.innerHTML = original;
    btn.disabled = false;
    showNotification('Данные обновлены', 'success');
}

function showNotification(msg, type = 'info') {
    const div = document.createElement('div');
    div.className = `notification notification-${type}`;
    div.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i><span>${msg}</span>`;
    document.body.appendChild(div);
    setTimeout(() => {
        div.classList.add('fade-out');
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

function setupEventListeners() {
    const typeFilter = document.getElementById('type-filter');
    const statusFilter = document.getElementById('status-filter');
    const resetBtn = document.getElementById('reset-filters');
    const refreshBtn = document.getElementById('refresh-data');
    if (typeFilter) typeFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (resetBtn) resetBtn.addEventListener('click', () => {
        if (typeFilter) typeFilter.value = 'all';
        if (statusFilter) statusFilter.value = 'all';
        applyFilters();
    });
    if (refreshBtn) refreshBtn.addEventListener('click', refreshData);
}

// ==================== АДАПТАЦИЯ ИНТЕРФЕЙСА ПОД РОЛЬ ====================
function adaptInterfaceForRole(role) {
    if (role === 'agronomist') {
        // Скрываем все блоки, кроме карты
        const elementsToHide = [
            '.control-panel',       // панель фильтров
            '.technique-section',   // блок списка техники
            '.stats-section',       // блок статистики эффективности
            '#logout-btn'           // кнопку выхода (можно оставить, но скроем для агронома)
        ];
        elementsToHide.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) el.style.display = 'none';
        });
        // Скрываем статистику в шапке
        const headerStats = document.querySelector('.header-stats');
        if (headerStats) headerStats.style.display = 'none';
        // Убираем отступы у карты
        const mapSection = document.querySelector('.map-section');
        if (mapSection) mapSection.style.marginTop = '0';
    }
}

// ==================== ЛОГИН ====================
async function doLogin() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        localStorage.setItem('token', data.token);
        token = data.token;
        currentUser = { role: data.role, full_name: data.full_name };
        // Скрываем форму, показываем основное приложение
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        // Адаптируем интерфейс под роль
        adaptInterfaceForRole(currentUser.role);
        // Инициализируем карту и загружаем данные в зависимости от роли
        if (typeof initMap === 'function') initMap();
        if (currentUser.role === 'agronomist') {
            // Агроном: загружаем только поля (техника не нужна)
            try {
                const fieldsRes = await fetch('/api/fields', { headers: { 'Authorization': `Bearer ${token}` } });
                const fields = await fieldsRes.json();
                if (typeof addFieldsToMap === 'function') addFieldsToMap(fields);
            } catch(e) { console.warn('Ошибка загрузки полей', e); }
            // Не вызываем loadMachinery, она всё равно вернёт пустой массив из-за роли
        } else {
            // Остальные роли: загружаем технику и поля (если нужно)
            await loadMachinery();
            if (currentUser.role === 'admin') {
                try {
                    const fieldsRes = await fetch('/api/fields', { headers: { 'Authorization': `Bearer ${token}` } });
                    const fields = await fieldsRes.json();
                    if (typeof addFieldsToMap === 'function') addFieldsToMap(fields);
                } catch(e) { console.warn('Ошибка загрузки полей', e); }
            }
        }
        // Автообновление только если не агроном (агроному не нужно обновлять технику)
        if (currentUser.role !== 'agronomist') {
            setInterval(loadMachinery, 30000);
        }
    } catch (err) {
        errorDiv.innerText = err.message;
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ ====================
function initApp() {
    if (typeof initMap === 'function') initMap();
    const footer = document.querySelector('.footer-bottom p');
    if (footer) footer.innerHTML = '© 2025 АО АПО "Аврора". Все права защищены.';
    setupEventListeners();
}

document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        // При загрузке страницы с токеном нужно определить роль
        // Попробуем декодировать токен, чтобы получить роль
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUser = { role: payload.role, full_name: payload.full_name };
        } catch(e) {
            currentUser = null;
        }
        if (currentUser) {
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('main-app').style.display = 'block';
            adaptInterfaceForRole(currentUser.role);
            initApp();
            if (currentUser.role === 'agronomist') {
                // Загружаем только поля
                fetch('/api/fields', { headers: { 'Authorization': `Bearer ${token}` } })
                    .then(res => res.json())
                    .then(fields => { if (typeof addFieldsToMap === 'function') addFieldsToMap(fields); })
                    .catch(e => console.warn(e));
            } else {
                loadMachinery();
                setInterval(loadMachinery, 30000);
                // Администратору тоже нужны поля, если нужно
                if (currentUser.role === 'admin') {
                    fetch('/api/fields', { headers: { 'Authorization': `Bearer ${token}` } })
                        .then(res => res.json())
                        .then(fields => { if (typeof addFieldsToMap === 'function') addFieldsToMap(fields); })
                        .catch(e => console.warn(e));
                }
            }
        } else {
            // Если не удалось декодировать токен, удаляем его и показываем форму
            localStorage.removeItem('token');
            document.getElementById('login-container').style.display = 'flex';
            document.getElementById('main-app').style.display = 'none';
        }
    } else {
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
    }
});