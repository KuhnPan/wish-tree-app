const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send(`
        <div style="text-align: center; margin-top: 50px;">
            <h1>🌳 Startup Zero: Monorepo Active</h1>
            <p style="color: green;">Status: ONLINE</p>
            <p>Structure: Backend + Frontend</p>
        </div>
    `);
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));