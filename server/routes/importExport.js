const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Papa = require('papaparse');
const { getDb } = require('../db/database');
const { parseDocument } = require('../services/documentParser');
const { generateFlashcardsFromText } = require('../services/aiGenerator');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.csv', '.pdf'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and PDF files are allowed'));
    }
  }
});

// POST import CSV
router.post('/csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const result = await parseDocument(req.file.buffer, 'text/csv', '.csv');
    const db = getDb();
    
    // Register file in database
    const fileResult = db.prepare('INSERT INTO files (name, type, content) VALUES (?, ?, ?)')
      .run(req.file.originalname, 'csv', result.rawContent);

    res.json({
      fileId: fileResult.lastInsertRowid,
      filename: req.file.originalname,
      candidateCount: result.candidates.length,
      candidates: result.candidates
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST import PDF
router.post('/pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const result = await parseDocument(req.file.buffer, 'application/pdf', '.pdf');
    const db = getDb();

    // Register file in database
    const fileResult = db.prepare('INSERT INTO files (name, type, content) VALUES (?, ?, ?)')
      .run(req.file.originalname, 'pdf', result.rawContent);

    res.json({
      fileId: fileResult.lastInsertRowid,
      filename: req.file.originalname,
      candidateCount: result.candidates.length,
      candidates: result.candidates
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST generate from raw text (e.g. from Notes app)
router.post('/generate', async (req, res) => {
  try {
    const { text, filename } = req.body;
    if (!text) return res.status(400).json({ error: 'Text content is required' });

    const candidates = await generateFlashcardsFromText(text);

    res.json({
      filename: filename || 'Generated from Notes',
      candidateCount: candidates.length,
      candidates
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST save imported cards (after user reviews them)
router.post('/save', (req, res) => {
  try {
    const { setId, folderId, title, cards } = req.body;

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ error: 'Cards array is required' });
    }

    const db = getDb();

    const saveCards = db.transaction(() => {
      let targetSetId = setId;

      // Create new set if no setId
      if (!targetSetId) {
        if (!folderId || !title) {
          throw new Error('Either setId or both folderId and title are required');
        }
        const result = db.prepare('INSERT INTO sets (folderId, title, description) VALUES (?, ?, ?)')
          .run(folderId, title, 'Imported set');
        targetSetId = result.lastInsertRowid;
      }

      const insertCard = db.prepare('INSERT INTO cards (setId, term, definition, source) VALUES (?, ?, ?, ?)');
      const insertAlias = db.prepare('INSERT INTO card_aliases (cardId, alias) VALUES (?, ?)');
      const insertSR = db.prepare('INSERT INTO spaced_repetition (cardId) VALUES (?)');
      let count = 0;

      for (const card of cards) {
        if (card.term && card.definition) {
          const result = insertCard.run(targetSetId, card.term.trim(), card.definition.trim(), card.source || 'import');
          const cardId = result.lastInsertRowid;
          insertSR.run(cardId);

          if (card.aliases && Array.isArray(card.aliases)) {
            for (const alias of card.aliases) {
              if (alias.trim()) insertAlias.run(cardId, alias.trim());
            }
          }
          count++;
        }
      }

      return { setId: targetSetId, cardsAdded: count };
    });

    const result = saveCards();
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET export set as CSV
router.get('/export/csv/:setId', (req, res) => {
  try {
    const db = getDb();
    const set = db.prepare('SELECT * FROM sets WHERE id = ?').get(req.params.setId);
    if (!set) return res.status(404).json({ error: 'Set not found' });

    const cards = db.prepare('SELECT * FROM cards WHERE setId = ?').all(req.params.setId);
    const aliasStmt = db.prepare('SELECT alias FROM card_aliases WHERE cardId = ?');

    const data = cards.map(card => ({
      term: card.term,
      definition: card.definition,
      source: card.source || '',
      aliases: aliasStmt.all(card.id).map(a => a.alias).join('; ')
    }));

    const csv = Papa.unparse(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${set.title.replace(/[^a-z0-9]/gi, '_')}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET export set as JSON
router.get('/export/json/:setId', (req, res) => {
  try {
    const db = getDb();
    const set = db.prepare('SELECT * FROM sets WHERE id = ?').get(req.params.setId);
    if (!set) return res.status(404).json({ error: 'Set not found' });

    const cards = db.prepare('SELECT * FROM cards WHERE setId = ?').all(req.params.setId);
    const aliasStmt = db.prepare('SELECT alias FROM card_aliases WHERE cardId = ?');

    const cardsWithAliases = cards.map(card => ({
      ...card,
      aliases: aliasStmt.all(card.id).map(a => a.alias)
    }));

    const exportData = {
      set: { title: set.title, description: set.description },
      cards: cardsWithAliases,
      exportedAt: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${set.title.replace(/[^a-z0-9]/gi, '_')}.json"`);
    res.json(exportData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
