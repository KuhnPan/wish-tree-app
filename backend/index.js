const express = require('express');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'wishes.db');

app.use(express.json());
app.use(cors());

// --- DATABASE CONNECT ---
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database: ' + err.message);
    } else {
        console.log('Connected to SQLite database.');
        // Create table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS wishes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            anonymousId TEXT,
            createdAt TEXT,
            status TEXT DEFAULT 'PENDING'
        )`);
    }
});

// --- API ENDPOINTS ---

// GET: Fetch all wishes
app.get('/api/wishes', (req, res) => {
    db.all("SELECT * FROM wishes ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST: Add a new wish
app.post('/api/wishes', (req, res) => {
    const { content, anonymousId } = req.body;
    if (!content) return res.status(400).json({ error: "Content required" });

    const newWish = {
        content,
        anonymousId: anonymousId || "anon",
        createdAt: new Date().toISOString(),
        status: "PENDING"
    };

    const sql = `INSERT INTO wishes (content, anonymousId, createdAt, status) VALUES (?, ?, ?, ?)`;
    
    // We use 'function' to access 'this.lastID'
    db.run(sql, [newWish.content, newWish.anonymousId, newWish.createdAt, newWish.status], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Respond with the object including the new DB ID
        res.status(201).json({ id: this.lastID, ...newWish });
        console.log(`[New Wish] ID: ${this.lastID}`);
    });
});

// Health Check
app.get('/health', (req, res) => res.send('Wish Tree Backend (SQLite): OK'));

app.listen(PORT, () => {
    console.log(`🌳 Wish Tree Backend running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close(() => {
        console.log('Database connection closed.');
        process.exit(0);
    });
});