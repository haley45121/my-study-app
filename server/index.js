const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { initDb, closeDb } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use('/api/folders', require('./routes/folders'));
app.use('/api/sets', require('./routes/sets'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/cornell-notes', require('./routes/cornellNotes'));
app.use('/api/study', require('./routes/study'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/import-export', require('./routes/importExport'));
app.use('/api/learn', require('./routes/learn'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Graceful shutdown
process.on('SIGINT', () => {
  closeDb();
  process.exit(0);
});

// Initialize database (async for sql.js WASM loading), then start server
async function start() {
  try {
    await initDb();
    console.log('Database ready.');
    app.listen(PORT, () => {
      console.log(`MISBA server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
