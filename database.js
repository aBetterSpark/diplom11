const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'avrora.db'));

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT CHECK(role IN ('driver','agronomist','transport_manager','admin')) DEFAULT 'driver',
            full_name TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS machinery (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT CHECK(type IN ('tractor','combine','truck')) NOT NULL,
            status TEXT CHECK(status IN ('working','idle','repair')) DEFAULT 'idle',
            field TEXT,
            driver TEXT,
            driver_phone TEXT,
            fuel INTEGER DEFAULT 100,
            efficiency INTEGER DEFAULT 80,
            last_update DATETIME,
            work TEXT,
            speed TEXT,
            maintenance DATE,
            online INTEGER DEFAULT 1,
            lat REAL,
            lng REAL,
            assigned_driver_id INTEGER,
            FOREIGN KEY (assigned_driver_id) REFERENCES users(id) ON DELETE SET NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS fields (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            crop TEXT,
            area_ha REAL,
            status TEXT,
            coordinates TEXT
        )
    `);

    console.log('✅ Таблицы созданы');
});

module.exports = db;