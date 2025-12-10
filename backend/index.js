const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Good practice even for monoliths

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'wishes.json');

app.use(express.json());
app.use(cors());

// 1. Helper: Load Wishes
function loadWishes() {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// 2. Helper: Save Wishes
function saveWishes(wishes) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(wishes, null, 2));
}

// --- API ENDPOINTS (Matching Yesterday's Logic) ---

// GET /api/wishes - Retrieve all wishes
app.get('/api/wishes', (req, res) => {
    const wishes = loadWishes();
    res.json(wishes.reverse()); // Newest first
});

// POST /api/wishes - Create a new wish
app.post('/api/wishes', (req, res) => {
    const { content, anonymousId } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: "Content required" });
    }

    const wishes = loadWishes();
    const newWish = {
        id: Date.now(),
        content,
        anonymousId: anonymousId || "anon",
        createdAt: new Date().toISOString(),
        status: "PENDING" // As per the Canvas demo logic
    };

    wishes.push(newWish);
    saveWishes(wishes);

    console.log(`[New Wish] ${content}`);
    res.status(201).json(newWish);
});

// Health Check
app.get('/health', (req, res) => res.send('Wish Tree Backend: OK'));

app.listen(PORT, () => {
    console.log(`🌳 Wish Tree Backend running on port ${PORT}`);
});