const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 3000;
const SECRET = 'avrora_secret_key_2025';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const db = new sqlite3.Database(path.join(__dirname, 'avrora.db'));

// Middleware проверки токена
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ error: 'Токен отсутствует' });
    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Неверный токен' });
        req.user = decoded;
        next();
    });
}

// Логин
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT id, username, password, role, full_name FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Пользователь не найден' });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Неверный пароль' });
        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username, full_name: user.full_name },
            SECRET,
            { expiresIn: '24h' }
        );
        res.json({ token, role: user.role, full_name: user.full_name });
    });
});

// Получение техники (агроном получает пустой массив, водитель — свою, админ/менеджер — всю)
app.get('/api/machinery', verifyToken, (req, res) => {
    // Если агроном – сразу возвращаем пустой массив (техника ему не нужна)
    if (req.user.role === 'agronomist') {
        return res.json([]);
    }

    let sql = `SELECT * FROM machinery`;
    const params = [];
    const conditions = [];

    // Водитель видит только свою технику
    if (req.user.role === 'driver') {
        conditions.push(`assigned_driver_id = ?`);
        params.push(req.user.id);
    }
    // Для transport_manager и admin – без дополнительных условий

    const { type, status } = req.query;
    if (type && type !== 'all') { conditions.push(`type = ?`); params.push(type); }
    if (status && status !== 'all') { conditions.push(`status = ?`); params.push(status); }

    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Получение полей (только агроном и админ)
app.get('/api/fields', verifyToken, (req, res) => {
    if (!['agronomist', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Недостаточно прав' });
    }
    db.all(`SELECT * FROM fields`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Обновление статуса техники
app.put('/api/machinery/:id/status', verifyToken, (req, res) => {
    const machineId = req.params.id;
    const { status, field, work, fuel } = req.body;

    if (req.user.role === 'driver') {
        db.get(`SELECT assigned_driver_id FROM machinery WHERE id = ?`, [machineId], (err, row) => {
            if (err || !row) return res.status(404).json({ error: 'Техника не найдена' });
            if (row.assigned_driver_id !== req.user.id) {
                return res.status(403).json({ error: 'Вы можете управлять только своей техникой' });
            }
            db.run(
                `UPDATE machinery SET status = ?, field = ?, work = ?, fuel = ?, last_update = datetime('now') WHERE id = ?`,
                [status, field, work, fuel, machineId],
                function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ success: true });
                }
            );
        });
    } else if (['transport_manager', 'admin'].includes(req.user.role)) {
        db.run(
            `UPDATE machinery SET status = ?, field = ?, work = ?, fuel = ?, last_update = datetime('now') WHERE id = ?`,
            [status, field, work, fuel, machineId],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            }
        );
    } else {
        res.status(403).json({ error: 'Недостаточно прав' });
    }
});

app.listen(PORT, '192.168.0.97', () => {
    console.log(`Сервер запущен на http://192.168.0.97:${PORT}`);
});