require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'wishes.json');

// Init Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());
app.use(cors());

// --- HELPERS ---
function loadWishes() {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}
function saveWishes(wishes) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(wishes, null, 2));
}

// --- ENDPOINTS ---

// 1. GET Wishes
app.get('/api/wishes', (req, res) => {
    const wishes = loadWishes();
    res.json(wishes.reverse());
});

// 2. POLISH Wish (The AI Magic)
app.post('/api/polish', async (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content required" });

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash"});
        const prompt = `Rewrite the following wish to be more inspiring, poetic, and hopeful, but keep it under 20 words: "${content}"`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const polished = response.text().replace(/"/g, ''); // Remove quotes
        
        res.json({ polished });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ error: "AI is sleeping. Try again." });
    }
});

// 3. POST Wish
app.post('/api/wishes', (req, res) => {
    const { content, anonymousId } = req.body;
    if (!content) return res.status(400).json({ error: "Content required" });

    const wishes = loadWishes();
    const newWish = {
        id: Date.now(),
        content,
        anonymousId: anonymousId || "anon",
        createdAt: new Date().toISOString(),
    };

    wishes.push(newWish);
    saveWishes(wishes);
    res.status(201).json(newWish);
});

app.listen(PORT, () => console.log(`🌳 Backend + AI running on ${PORT}`));