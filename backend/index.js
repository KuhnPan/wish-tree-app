require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'wishes.db');

// --- AI SETUP (Corrected: Gemini 2.5 Flash) ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Using the 2025 standard model as requested
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });

app.use(express.json());
app.use(cors());

// --- DATABASE SETUP ---
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error(err.message);
    else {
        console.log('Connected to SQLite.');
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

// 1. THE BRAIN: Just Polish (Don't Save)
app.post('/api/polish', async (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content required" });

    try {
        console.log(`[AI] Polishing with Gemini 2.5: "${content}"`);
        const prompt = `Rewrite this wish to be a SINGLE, inspiring, poetic sentence (max 12 words). Do not give a list. Just the sentence. Wish: "${content}"`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const polished = response.text().trim();
        
        res.json({ original: content, polished: polished });
    } catch (error) {
        console.error("AI Error:", error.message);
        res.status(500).json({ error: "AI currently unavailable" });
    }
});

// 2. THE MEMORY: Just Save (Don't Polish)
app.post('/api/wishes', (req, res) => {
    const { content, anonymousId } = req.body;
	if (!content || !anonymousId) { // Check for both required fields now
		return res.status(400).json({ error: 'Wish content and anonymousId are required.' });
	}

    const status = "PENDING";

    const sql = `INSERT INTO wishes (content, anonymousId, createdAt, status) VALUES (?, ?, DATETIME('now'), ?)`;
    
	// PASS ONLY 3 VARIABLES: content, anonymousId, and status
    db.run(sql, [content, anonymousId, status], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, content, status });
    });
});

// GET Wishes
app.get('/api/wishes', (req, res) => {
    db.all("SELECT * FROM wishes ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(PORT, () => console.log(`🌳 Backend running on ${PORT}`));