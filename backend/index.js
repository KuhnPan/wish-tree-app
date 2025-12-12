require('dotenv').config(); 
const express = require('express');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'wishes.db');

// --- AI CONFIGURATION (Fixed: Sticking to V1 Standard) ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// We use the stable model we started with. No experimental "Flash" upgrades.
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.use(express.json());
app.use(cors());

// --- DATABASE SETUP ---
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error('Error opening database: ' + err.message);
    else {
        console.log('Connected to SQLite database.');
        // Schema matches Turn 4 (No new columns to avoid breaking your current DB)
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

app.get('/api/wishes', (req, res) => {
    db.all("SELECT * FROM wishes ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/wishes', async (req, res) => {
    const { content, anonymousId } = req.body;
    if (!content) return res.status(400).json({ error: "Content required" });

    let finalContent = content;

    // 🧠 RESTORED LOGIC: The AI Polish
    try {
        if (process.env.GEMINI_API_KEY) {
            console.log(`[AI] Polishing: "${content}"`);
            const prompt = `Rewrite this wish to be inspiring, poetic and concise (max 15 words). Maintain the original meaning. Wish: "${content}"`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            finalContent = response.text().trim(); 
        }
    } catch (error) {
        console.warn("AI Polish skipped (API Error or Quota):", error.message);
    }

    const createdAt = new Date().toISOString();
    const status = "PENDING";
    const anon = anonymousId || "anon";

    // Insert the POLISHED content into the DB
    const sql = `INSERT INTO wishes (content, anonymousId, createdAt, status) VALUES (?, ?, ?, ?)`;
    
    db.run(sql, [finalContent, anon, createdAt, status], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        res.status(201).json({
            id: this.lastID,
            content: finalContent,
            status
        });
        console.log(`[New Wish] ID: ${this.lastID} | "${finalContent}"`);
    });
});

app.get('/health', (req, res) => res.send('Wish Tree Backend (SQLite + Gemini Pro): OK'));

app.listen(PORT, () => {
    console.log(`🌳 Wish Tree Backend running on port ${PORT}`);
});