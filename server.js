const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'codealpha_secret_key',
    resave: false,
    saveUninitialized: false
}));

let db;

// Initialize SQLite Database
(async () => {
    db = await open({
        filename: './database.db',
        driver: sqlite3.Database
    });

    // Create Tables
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            price REAL,
            description TEXT,
            image TEXT
        );

        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            total REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Seed Initial Products if empty
    const productCount = await db.get('SELECT COUNT(*) as count FROM products');
    if (productCount.count === 0) {
        await db.run(`INSERT INTO products (name, price, description, image) VALUES 
            ('Wireless Headphones', 99.99, 'High quality sound with active noise cancellation.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'),
            ('Smart Watch', 149.99, 'Track your daily fitness and notifications.', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'),
            ('Ergonomic Chair', 199.99, 'Comfortable chair for work and gaming.', 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=500')
        `);
    }
})();

// API Endpoints

// 1. Get Products
app.get('/api/products', async (req, res) => {
    const products = await db.all('SELECT * FROM products');
    res.json(products);
});

// 2. User Registration
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(400).json({ error: 'Username already exists' });
    }
});

// 3. User Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user.id;
        req.session.username = user.username;
        res.json({ message: 'Login successful', username: user.username });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// 4. Submit Order
app.post('/api/orders', async (req, res) => {
    const { total } = req.body;
    const userId = req.session.userId || 1; // Default guest user if not logged in
    const result = await db.run('INSERT INTO orders (user_id, total) VALUES (?, ?)', [userId, total]);
    res.status(201).json({ message: 'Order placed successfully', orderId: result.lastID });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});