const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// GET dashboard stats
router.get('/dashboard', (req, res) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    const totalFolders = db.prepare('SELECT COUNT(*) as count FROM folders').get()?.count || 0;
    const totalSets = db.prepare('SELECT COUNT(*) as count FROM sets').get()?.count || 0;
    const totalCards = db.prepare('SELECT COUNT(*) as count FROM cards').get()?.count || 0;
    const dueCards = db.prepare('SELECT COUNT(*) as count FROM spaced_repetition WHERE nextReviewDate <= ?').get(today)?.count || 0;
    const totalNotes = db.prepare('SELECT COUNT(*) as count FROM notes').get()?.count || 0;
    const totalCornellNotes = db.prepare('SELECT COUNT(*) as count FROM cornell_notes').get()?.count || 0;

    // Mastered cards (interval >= 21 days)
    const masteredCards = db.prepare('SELECT COUNT(*) as count FROM spaced_repetition WHERE interval >= 21').get()?.count || 0;

    // Weak cards (ease factor < 2.0 and at least 1 review)
    const weakCards = db.prepare('SELECT COUNT(*) as count FROM spaced_repetition WHERE easeFactor < 2.0 AND repetitions > 0').get()?.count || 0;

    // Total study sessions
    const totalSessions = db.prepare('SELECT COUNT(*) as count FROM study_sessions').get()?.count || 0;

    // Total reviews
    const totalReviews = db.prepare('SELECT COUNT(*) as count FROM review_history').get()?.count || 0;

    // Correct vs incorrect
    const correctReviews = db.prepare('SELECT COUNT(*) as count FROM review_history WHERE wasCorrect = 1').get()?.count || 0;
    const incorrectReviews = Math.max(0, totalReviews - correctReviews);

    // Recent sessions (last 10)
    const recentSessions = db.prepare(`
      SELECT ss.*, s.title as setTitle
      FROM study_sessions ss
      JOIN sets s ON ss.setId = s.id
      ORDER BY ss.startedAt DESC
      LIMIT 10
    `).all();

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = db.prepare(`
      SELECT date(reviewedAt) as date, COUNT(*) as reviews, SUM(wasCorrect) as correct
      FROM review_history
      WHERE reviewedAt >= ?
      GROUP BY date(reviewedAt)
      ORDER BY date DESC
    `).all(sevenDaysAgo.toISOString());

    res.json({
      totalFolders,
      totalSets,
      totalCards,
      dueCards,
      totalNotes,
      totalCornellNotes,
      masteredCards,
      weakCards,
      totalSessions,
      totalReviews,
      correctReviews,
      incorrectReviews,
      recentSessions,
      recentActivity
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET progress for a specific set
router.get('/sets/:id', (req, res) => {
  try {
    const db = getDb();
    const setId = req.params.id;
    const today = new Date().toISOString().split('T')[0];

    const set = db.prepare('SELECT * FROM sets WHERE id = ?').get(setId);
    if (!set) return res.status(404).json({ error: 'Set not found' });

    const totalCards = db.prepare('SELECT COUNT(*) as count FROM cards WHERE setId = ?').get(setId)?.count || 0;
    const dueCards = db.prepare(`
      SELECT COUNT(*) as count FROM spaced_repetition sr
      JOIN cards c ON sr.cardId = c.id
      WHERE c.setId = ? AND sr.nextReviewDate <= ?
    `).get(setId, today)?.count || 0;

    const masteredCards = db.prepare(`
      SELECT COUNT(*) as count FROM spaced_repetition sr
      JOIN cards c ON sr.cardId = c.id
      WHERE c.setId = ? AND sr.interval >= 21
    `).get(setId)?.count || 0;

    const weakCards = db.prepare(`
      SELECT COUNT(*) as count FROM spaced_repetition sr
      JOIN cards c ON sr.cardId = c.id
      WHERE c.setId = ? AND sr.easeFactor < 2.0 AND sr.repetitions > 0
    `).get(setId)?.count || 0;

    const newCards = db.prepare(`
      SELECT COUNT(*) as count FROM spaced_repetition sr
      JOIN cards c ON sr.cardId = c.id
      WHERE c.setId = ? AND sr.repetitions = 0
    `).get(setId)?.count || 0;

    // Review history for this set
    const reviews = db.prepare(`
      SELECT COUNT(*) as total, SUM(wasCorrect) as correct
      FROM review_history rh
      JOIN cards c ON rh.cardId = c.id
      WHERE c.setId = ?
    `).get(setId) || { total: 0, correct: 0 };

    // Sessions for this set
    const sessions = db.prepare(`
      SELECT * FROM study_sessions
      WHERE setId = ?
      ORDER BY startedAt DESC
      LIMIT 20
    `).all(setId);

    // Per-card progress
    const cardProgress = db.prepare(`
      SELECT c.id, c.term, c.definition,
        sr.easeFactor, sr.interval, sr.repetitions, sr.nextReviewDate, sr.lastReviewedAt,
        (SELECT COUNT(*) FROM review_history WHERE cardId = c.id) as reviewCount,
        (SELECT COUNT(*) FROM review_history WHERE cardId = c.id AND wasCorrect = 1) as correctCount
      FROM cards c
      LEFT JOIN spaced_repetition sr ON c.id = sr.cardId
      WHERE c.setId = ?
      ORDER BY c.id
    `).all(setId);

    res.json({
      set,
      totalCards,
      dueCards,
      masteredCards,
      weakCards,
      newCards,
      totalReviews: reviews.total || 0,
      correctReviews: reviews.correct || 0,
      incorrectReviews: (reviews.total || 0) - (reviews.correct || 0),
      sessions,
      cardProgress
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
