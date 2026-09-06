const express = require('express');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const PORT = process.env.PORT || 3000;
const WISHES_FILE = path.join(__dirname, 'wishes.json');

const MAX_NAME_LENGTH = 60;
const MAX_MESSAGE_LENGTH = 500;

app.use(express.json());
app.use(express.static(__dirname));

// Serializes writes so concurrent submissions don't clobber each other.
let writeQueue = Promise.resolve();

async function readWishes() {
  try {
    const raw = await fs.readFile(WISHES_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function writeWishes(wishes) {
  writeQueue = writeQueue.then(() =>
    fs.writeFile(WISHES_FILE, JSON.stringify(wishes, null, 2), 'utf8')
  );
  return writeQueue;
}

function sortLatestFirst(wishes) {
  return wishes.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

// GET all wishes, latest first
app.get('/api/wishes', async (req, res) => {
  try {
    const wishes = await readWishes();
    res.json(sortLatestFirst(wishes));
  } catch (err) {
    console.error('Failed to read wishes:', err);
    res.status(500).json({ message: 'Unable to load wishes right now.' });
  }
});

// POST a new wish
app.post('/api/wishes', async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

  if (!name || !content) {
    return res.status(400).json({ message: 'Name and message are both required.' });
  }
  if (name.length > MAX_NAME_LENGTH) {
    return res.status(400).json({ message: `Name must be ${MAX_NAME_LENGTH} characters or fewer.` });
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ message: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` });
  }

  try {
    const wishes = await readWishes();
    const newWish = { name, content, createdAt: new Date().toISOString() };
    wishes.push(newWish);
    await writeWishes(wishes);
    res.status(201).json({ wish: newWish, wishes: sortLatestFirst(wishes) });
  } catch (err) {
    console.error('Failed to save wish:', err);
    res.status(500).json({ message: 'Unable to save your wish right now. Please try again.' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Wedding website running at http://localhost:${PORT}`);
});