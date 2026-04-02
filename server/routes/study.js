const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { calculateNextReview, deriveQuality } = require('../services/spacedRepetition');

// POST create study session
router.post('/sessions', (req, res) => {
  try {
    const { setId, mode } = req.body;
    if (!setId || !mode) return res.status(400).json({ error: 'setId and mode are required' });
    if (!['flashcard', 'learn'].includes(mode)) return res.status(400).json({ error: 'mode must be flashcard or learn' });

    const db = getDb();
    const result = db.prepare('INSERT INTO study_sessions (setId, mode) VALUES (?, ?)').run(setId, mode);
    const session = db.prepare('SELECT * FROM study_sessions WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT end/update study session
router.put('/sessions/:id', (req, res) => {
  try {
    const { cardsStudied, correctCount, incorrectCount } = req.body;
    const db = getDb();
    db.prepare(`
      UPDATE study_sessions SET
        endedAt = datetime('now'),
        cardsStudied = COALESCE(?, cardsStudied),
        correctCount = COALESCE(?, correctCount),
        incorrectCount = COALESCE(?, incorrectCount)
      WHERE id = ?
    `).run(cardsStudied || null, correctCount || null, incorrectCount || null, req.params.id);

    const session = db.prepare('SELECT * FROM study_sessions WHERE id = ?').get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST record a card review and update spaced repetition
router.post('/review', (req, res) => {
  try {
    const { cardId, sessionId, wasCorrect, responseText, rating, attempts, mode } = req.body;
    if (!cardId) return res.status(400).json({ error: 'cardId is required' });

    const db = getDb();

    // Determine quality rating
    let quality;
    if (rating) {
      quality = rating; // Direct rating from flashcard mode
    } else {
      quality = deriveQuality(wasCorrect, attempts || 1, mode || 'learn');
    }

    const recordReview = db.transaction(() => {
      // Insert review history
      db.prepare(`
        INSERT INTO review_history (cardId, sessionId, rating, wasCorrect, responseText)
        VALUES (?, ?, ?, ?, ?)
      `).run(cardId, sessionId || null, quality, wasCorrect ? 1 : 0, responseText || '');

      // Get or create spaced repetition record
      let sr = db.prepare('SELECT * FROM spaced_repetition WHERE cardId = ?').get(cardId);
      if (!sr) {
        db.prepare('INSERT INTO spaced_repetition (cardId) VALUES (?)').run(cardId);
        sr = db.prepare('SELECT * FROM spaced_repetition WHERE cardId = ?').get(cardId);
      }

      // Calculate next review
      const updated = calculateNextReview(sr, quality);

      db.prepare(`
        UPDATE spaced_repetition SET
          easeFactor = ?,
          interval = ?,
          repetitions = ?,
          nextReviewDate = ?,
          lastReviewedAt = ?
        WHERE cardId = ?
      `).run(updated.easeFactor, updated.interval, updated.repetitions, updated.nextReviewDate, updated.lastReviewedAt, cardId);

      return updated;
    });

    const updatedSR = recordReview();
    res.json({ cardId, quality, spacedRepetition: updatedSR });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET cards due for review
router.get('/due-cards', (req, res) => {
  try {
    const db = getDb();
    const { setId } = req.query;
    const today = new Date().toISOString().split('T')[0];

    let query, params;
    if (setId) {
      query = `
        SELECT c.*, sr.easeFactor, sr.interval, sr.repetitions, sr.nextReviewDate, sr.lastReviewedAt,
          s.title as setTitle, f.name as folderName
        FROM cards c
        JOIN spaced_repetition sr ON c.id = sr.cardId
        JOIN sets s ON c.setId = s.id
        LEFT JOIN folders f ON s.folderId = f.id
        WHERE sr.nextReviewDate <= ? AND c.setId = ?
        ORDER BY sr.nextReviewDate ASC
      `;
      params = [today, setId];
    } else {
      query = `
        SELECT c.*, sr.easeFactor, sr.interval, sr.repetitions, sr.nextReviewDate, sr.lastReviewedAt,
          s.title as setTitle, f.name as folderName
        FROM cards c
        JOIN spaced_repetition sr ON c.id = sr.cardId
        JOIN sets s ON c.setId = s.id
        LEFT JOIN folders f ON s.folderId = f.id
        WHERE sr.nextReviewDate <= ?
        ORDER BY sr.nextReviewDate ASC
      `;
      params = [today];
    }

    const dueCards = db.prepare(query).all(...params);
    res.json(dueCards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET recent sessions
router.get('/sessions', (req, res) => {
  try {
    const db = getDb();
    const { limit } = req.query;
    const sessions = db.prepare(`
      SELECT ss.*, s.title as setTitle
      FROM study_sessions ss
      JOIN sets s ON ss.setId = s.id
      ORDER BY ss.startedAt DESC
      LIMIT ?
    `).all(limit || 20);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
