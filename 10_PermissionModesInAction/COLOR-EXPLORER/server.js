const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const colors = require('./data/colors');

const app = express();
const PORT = process.env.PORT || 3000;
const RECENT_FILE = path.join(__dirname, 'data', 'recent.json');
const MAX_STORED = 50;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function readRecent() {
  try {
    const raw = await fs.readFile(RECENT_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeRecent(entries) {
  await fs.writeFile(RECENT_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

app.get('/api/colors', (req, res) => {
  res.json(colors);
});

app.get('/api/colors/recent', async (req, res) => {
  const entries = await readRecent();
  res.json(entries.slice(0, 5));
});

app.post('/api/colors/click', async (req, res) => {
  const { name, hex, rgb, hsl } = req.body;
  if (!name || !hex) {
    return res.status(400).json({ error: 'name and hex are required' });
  }

  const entry = { name, hex, rgb, hsl, timestamp: new Date().toISOString() };
  const entries = await readRecent();
  entries.unshift(entry);
  await writeRecent(entries.slice(0, MAX_STORED));

  res.json({ recent: entries.slice(0, 5) });
});

app.listen(PORT, () => {
  console.log(`Color Palette Explorer running at http://localhost:${PORT}`);
});
