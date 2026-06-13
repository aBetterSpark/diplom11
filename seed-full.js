const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'avrora.db'));

async function seed() {
    const hash123 = await bcrypt.hash('123456', 10);
    const hashAdmin = await bcrypt.hash('admin123', 10);

    // ----- ПОЛЬЗОВАТЕЛИ -----
    const users = [
        ['driver1', hash123, 'driver', 'Водитель 1'],
        ['driver2', hash123, 'driver', 'Водитель 2'],
        ['driver3', hash123, 'driver', 'Водитель 3'],
        ['driver4', hash123, 'driver', 'Водитель 4'],
        ['driver5', hash123, 'driver', 'Водитель 5'],
        ['driver6', hash123, 'driver', 'Водитель 6'],
        ['driver7', hash123, 'driver', 'Водитель 7'],
        ['driver8', hash123, 'driver', 'Водитель 8'],
        ['driver9', hash123, 'driver', 'Водитель 9'],
        ['driver10', hash123, 'driver', 'Водитель 10'],
        ['agronomist', hash123, 'agronomist', 'Главный агроном'],
        ['transport_manager', hash123, 'transport_manager', 'Диспетчер'],
        ['admin', hashAdmin, 'admin', 'Администратор']
    ];
    const insUser = db.prepare(`INSERT OR IGNORE INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)`);
    for (const u of users) insUser.run(u[0], u[1], u[2], u[3]);
    console.log('✅ Пользователи добавлены');

    // ----- ПОЛЯ (6 штук) -----
    const fields = [
        ['Поле №1 - Центральное', 'Пшеница', 150, 'Уборка', '[[52.392,38.905],[52.392,38.925],[52.382,38.925],[52.382,38.905]]'],
        ['Поле №2 - Северное', 'Кукуруза', 120, 'Вегетация', '[[52.402,38.910],[52.402,38.935],[52.392,38.935],[52.392,38.910]]'],
        ['Поле №3 - Восточное', 'Ячмень', 95, 'Созревание', '[[52.385,38.930],[52.385,38.950],[52.375,38.950],[52.375,38.930]]'],
        ['Поле №4 - Южное', 'Подсолнечник', 110, 'Цветение', '[[52.372,38.900],[52.372,38.920],[52.362,38.920],[52.362,38.900]]'],
        ['Поле №5 - Западное', 'Рапс', 85, 'Посев', '[[52.390,38.885],[52.390,38.900],[52.380,38.900],[52.380,38.885]]'],
        ['Поле №6 - Речное', 'Свёкла', 130, 'Прополка', '[[52.365,38.935],[52.365,38.960],[52.355,38.960],[52.355,38.935]]']
    ];
    const insField = db.prepare(`INSERT INTO fields (name, crop, area_ha, status, coordinates) VALUES (?, ?, ?, ?, ?)`);
    for (const f of fields) insField.run(f[0], f[1], f[2], f[3], f[4]);
    console.log('✅ Поля добавлены');

    // ----- ТЕХНИКА (10 машин, привязанных к водителям) -----
    const machines = [
        { name: "Трактор МТЗ-3522", type: "tractor", status: "working", field: "Поле №1 - Центральное", driver: "Водитель 1", driver_phone: "+7-900-123-45-67", fuel: 85, efficiency: 95, work: "Вспашка", speed: "12 км/ч", maintenance: "2025-06-15", lat: 52.387, lng: 38.915, driverUsername: "driver1" },
        { name: "Трактор Case IH Magnum", type: "tractor", status: "working", field: "Поле №2 - Северное", driver: "Водитель 2", driver_phone: "+7-900-234-56-78", fuel: 70, efficiency: 92, work: "Боронование", speed: "10 км/ч", maintenance: "2025-06-20", lat: 52.397, lng: 38.922, driverUsername: "driver2" },
        { name: "Комбайн John Deere X9", type: "combine", status: "working", field: "Поле №1 - Центральное", driver: "Водитель 3", driver_phone: "+7-900-567-89-01", fuel: 65, efficiency: 98, work: "Уборка пшеницы", speed: "9 км/ч", maintenance: "2025-06-10", lat: 52.385, lng: 38.918, driverUsername: "driver3" },
        { name: "Комбайн Claas Lexion", type: "combine", status: "idle", field: "Поле №3 - Восточное", driver: "Водитель 4", driver_phone: "+7-900-678-90-12", fuel: 55, efficiency: 85, work: "Простой (обед)", speed: "0 км/ч", maintenance: "2025-06-05", lat: 52.360, lng: 38.947, driverUsername: "driver4" },
        { name: "Грузовик КамАЗ-65201", type: "truck", status: "working", field: "Дорога к полю №1", driver: "Водитель 5", driver_phone: "+7-900-890-12-34", fuel: 75, efficiency: 93, work: "Доставка семян", speed: "60 км/ч", maintenance: "2025-06-18", lat: 52.390, lng: 38.910, driverUsername: "driver5" },
        { name: "Трактор New Holland T7.270", type: "tractor", status: "idle", field: "Поле №4 - Южное", driver: "Водитель 6", driver_phone: "+7-900-456-78-90", fuel: 45, efficiency: 87, work: "Ожидание", speed: "0 км/ч", maintenance: "2025-05-30", lat: 52.380, lng: 38.940, driverUsername: "driver6" },
        { name: "Разбрасыватель удобрений", type: "tractor", status: "repair", field: "Ремонтная база", driver: "Водитель 7", driver_phone: "+7-900-012-34-56", fuel: 20, efficiency: 76, work: "Ремонт гидравлики", speed: "0 км/ч", maintenance: "2025-07-01", lat: 52.375, lng: 38.880, driverUsername: "driver7" },
        { name: "Сеялка HORSCH Avatar", type: "tractor", status: "working", field: "Поле №5 - Западное", driver: "Водитель 8", driver_phone: "+7-900-212-34-56", fuel: 60, efficiency: 90, work: "Посев", speed: "8 км/ч", maintenance: "2025-06-22", lat: 52.367, lng: 38.910, driverUsername: "driver8" },
        { name: "Опрыскиватель Hardi", type: "truck", status: "idle", field: "Поле №6 - Речное", driver: "Водитель 9", driver_phone: "+7-900-112-34-56", fuel: 30, efficiency: 80, work: "Обработка (перерыв)", speed: "0 км/ч", maintenance: "2025-06-25", lat: 52.373, lng: 38.882, driverUsername: "driver9" },
        { name: "Грузовик ЗИЛ-5301", type: "truck", status: "working", field: "Дорога к элеватору", driver: "Водитель 10", driver_phone: "+7-900-901-23-45", fuel: 80, efficiency: 88, work: "Вывоз зерна", speed: "55 км/ч", maintenance: "2025-06-12", lat: 52.395, lng: 38.905, driverUsername: "driver10" }
    ];

    for (const m of machines) {
        const driver = await new Promise(resolve => {
            db.get(`SELECT id FROM users WHERE username = ?`, [m.driverUsername], (err, row) => resolve(row));
        });
        if (!driver) {
            console.log(`⚠️ Водитель ${m.driverUsername} не найден, пропускаем ${m.name}`);
            continue;
        }
        db.run(`
            INSERT INTO machinery (name, type, status, field, driver, driver_phone, fuel, efficiency, work, speed, maintenance, lat, lng, assigned_driver_id, online, last_update)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
        `, [
            m.name, m.type, m.status, m.field,
            m.driver, m.driver_phone, m.fuel, m.efficiency,
            m.work, m.speed, m.maintenance,
            m.lat, m.lng, driver.id
        ], (err) => {
            if (err) console.error(`Ошибка ${m.name}:`, err);
            else console.log(`✅ ${m.name} → ${m.driverUsername}`);
        });
    }

    console.log('🎉 База данных полностью заполнена!');
    db.close();
}

seed().catch(err => console.error(err));