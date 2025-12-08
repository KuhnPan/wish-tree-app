const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allows your Vercel frontend to talk to this backend
app.use(express.json());

// --- 🧠 AI PROXY ROUTE ---
// This hides the API Key from the frontend
app.post('/api/ai-proxy', async (req, res) => {
    const { prompt } = req.body;
    
    // We get the key from the server's environment variables (Secure!)
    const API_KEY = process.env.GEMINI_API_KEY; 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "The Oracle is silent.";
        
        res.json({ result: resultText });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Failed to fetch AI response" });
    }
});

// Health Check
app.get('/', (req, res) => {
    res.send('🌳 Wish Tree Backend is Rooted and Growing.');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});