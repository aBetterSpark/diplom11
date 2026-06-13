let map;
let markers = [];

function initMap() {
    if (typeof L === 'undefined') {
        console.error('Leaflet не загружен');
        return;
    }
    map = L.map('map').setView([52.384, 38.920], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
    console.log('Карта инициализирована');
}

function updateMapMarkers(machinery) {
    if (!map) {
        console.warn('Карта не инициализирована');
        return;
    }
    // Очищаем старые маркеры
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    if (!machinery || machinery.length === 0) {
        console.log('Нет данных о технике для отображения');
        return;
    }

    machinery.forEach(tech => {
        if (!tech.lat || !tech.lng) {
            console.warn(`У техники ${tech.name} нет координат`);
            return;
        }
        let color = '#4CAF50';
        if (tech.status === 'idle') color = '#FF9800';
        if (tech.status === 'repair') color = '#F44336';
        let iconChar = '🚜';
        if (tech.type === 'combine') iconChar = '🌾';
        if (tech.type === 'truck') iconChar = '🚚';
        const icon = L.divIcon({
            html: `<div style="background:${color}; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; font-size:16px;">${iconChar}</div>`,
            iconSize: [30,30],
            popupAnchor: [0,-15]
        });
        const marker = L.marker([tech.lat, tech.lng], { icon }).addTo(map);
        marker.bindPopup(`<b>${tech.name}</b><br>Статус: ${tech.status}<br>Топливо: ${tech.fuel}%`);
        markers.push(marker);
    });
    console.log(`Добавлено маркеров: ${markers.length}`);
}

function addFieldsToMap(fields) {
    if (!map) return;
    fields.forEach(field => {
        if (!field.coordinates) return;
        const coords = JSON.parse(field.coordinates);
        L.polygon(coords, { color: '#FFD700', fillOpacity: 0.2 }).addTo(map)
            .bindPopup(`<b>${field.name}</b><br>${field.crop}<br>${field.area_ha} га`);
    });
}

window.updateMapWithFilter = updateMapMarkers;