const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// GET all sets (optional filter by folderId)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { folderId } = req.query;
    let sets;
    if (folderId) {
      sets = db.prepare(`
        SELECT s.*, f.name as folderName,
          (SELECT COUNT(*) FROM cards WHERE setId = s.id) as cardCount
        FROM sets s
        LEFT JOIN folders f ON s.folderId = f.id
        WHERE s.folderId = ?
        ORDER BY s.updatedAt DESC
      `).all(folderId);
    } else {
      sets = db.prepare(`
        SELECT s.*, f.name as folderName,
          (SELECT COUNT(*) FROM cards WHERE setId = s.id) as cardCount
        FROM sets s
        LEFT JOIN folders f ON s.folderId = f.id
        ORDER BY s.updatedAt DESC
      `).all();
    }
    res.json(sets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single set with cards
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const set = db.prepare(`
      SELECT s.*, f.name as folderName
      FROM sets s
      LEFT JOIN folders f ON s.folderId = f.id
      WHERE s.id = ?
    `).get(req.params.id);
    if (!set) return res.status(404).json({ error: 'Set not found' });

    const cards = db.prepare('SELECT * FROM cards WHERE setId = ? ORDER BY id').all(req.params.id);

    // Get aliases for each card
    const aliasStmt = db.prepare('SELECT * FROM card_aliases WHERE cardId = ?');
    const cardsWithAliases = cards.map(card => ({
      ...card,
      aliases: aliasStmt.all(card.id).map(a => a.alias)
    }));

    // Get spaced repetition data for each card
    const srStmt = db.prepare('SELECT * FROM spaced_repetition WHERE cardId = ?');
    const cardsWithSR = cardsWithAliases.map(card => ({
      ...card,
      sr: srStmt.get(card.id) || null
    }));

    res.json({ ...set, cards: cardsWithSR });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create set
router.post('/', (req, res) => {
  try {
    const { folderId, title, description, cards } = req.body;
    if (!folderId) return res.status(400).json({ error: 'folderId is required' });
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

    const db = getDb();

    // Verify folder exists
    const folder = db.prepare('SELECT id FROM folders WHERE id = ?').get(folderId);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    const createSet = db.transaction(() => {
      const result = db.prepare('INSERT INTO sets (folderId, title, description) VALUES (?, ?, ?)')
        .run(folderId, title.trim(), description || '');
      const setId = result.lastInsertRowid;

      // Bulk insert cards if provided
      if (cards && Array.isArray(cards)) {
        const insertCard = db.prepare('INSERT INTO cards (setId, term, definition, source) VALUES (?, ?, ?, ?)');
        const insertAlias = db.prepare('INSERT INTO card_aliases (cardId, alias) VALUES (?, ?)');
        const insertSR = db.prepare('INSERT INTO spaced_repetition (cardId) VALUES (?)');

        for (const card of cards) {
          if (card.term && card.definition) {
            const cardResult = insertCard.run(setId, card.term.trim(), card.definition.trim(), card.source || '');
            const cardId = cardResult.lastInsertRowid;
            insertSR.run(cardId);

            if (card.aliases && Array.isArray(card.aliases)) {
              for (const alias of card.aliases) {
                if (alias.trim()) insertAlias.run(cardId, alias.trim());
              }
            }
          }
        }
      }

      return setId;
    });

    const setId = createSet();
    const newSet = db.prepare('SELECT * FROM sets WHERE id = ?').get(setId);
    res.status(201).json(newSet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update set
router.put('/:id', (req, res) => {
  try {
    const { title, description } = req.body;
    const db = getDb();
    db.prepare("UPDATE sets SET title = COALESCE(?, title), description = COALESCE(?, description), updatedAt = datetime('now') WHERE id = ?")
      .run(title || null, description !== undefined ? description : null, req.params.id);
    const set = db.prepare('SELECT * FROM sets WHERE id = ?').get(req.params.id);
    if (!set) return res.status(404).json({ error: 'Set not found' });
    res.json(set);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT move set to another folder
router.put('/:id/move', (req, res) => {
  try {
    const { folderId } = req.body;
    if (!folderId) return res.status(400).json({ error: 'folderId is required' });

    const db = getDb();
    const folder = db.prepare('SELECT id FROM folders WHERE id = ?').get(folderId);
    if (!folder) return res.status(404).json({ error: 'Target folder not found' });

    db.prepare("UPDATE sets SET folderId = ?, updatedAt = datetime('now') WHERE id = ?")
      .run(folderId, req.params.id);
    const set = db.prepare('SELECT * FROM sets WHERE id = ?').get(req.params.id);
    if (!set) return res.status(404).json({ error: 'Set not found' });
    res.json(set);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE set
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const set = db.prepare('SELECT * FROM sets WHERE id = ?').get(req.params.id);
    if (!set) return res.status(404).json({ error: 'Set not found' });

    db.prepare('DELETE FROM sets WHERE id = ?').run(req.params.id);
    res.json({ message: 'Set deleted', id: Number(req.params.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST bulk add cards to set
router.post('/:setId/cards', (req, res) => {
  try {
    const { cards } = req.body;
    if (!cards || !Array.isArray(cards)) return res.status(400).json({ error: 'cards array is required' });

    const db = getDb();
    const set = db.prepare('SELECT id FROM sets WHERE id = ?').get(req.params.setId);
    if (!set) return res.status(404).json({ error: 'Set not found' });

    const insertCards = db.transaction(() => {
      const insertCard = db.prepare('INSERT INTO cards (setId, term, definition, source) VALUES (?, ?, ?, ?)');
      const insertAlias = db.prepare('INSERT INTO card_aliases (cardId, alias) VALUES (?, ?)');
      const insertSR = db.prepare('INSERT INTO spaced_repetition (cardId) VALUES (?)');
      const added = [];

      for (const card of cards) {
        if (card.term && card.definition) {
          const result = insertCard.run(req.params.setId, card.term.trim(), card.definition.trim(), card.source || '');
          const cardId = result.lastInsertRowid;
          insertSR.run(cardId);

          if (card.aliases && Array.isArray(card.aliases)) {
            for (const alias of card.aliases) {
              if (alias.trim()) insertAlias.run(cardId, alias.trim());
            }
          }
          added.push(cardId);
        }
      }
      return added;
    });

    const addedIds = insertCards();
    db.prepare("UPDATE sets SET updatedAt = datetime('now') WHERE id = ?").run(req.params.setId);
    res.status(201).json({ added: addedIds.length, cardIds: addedIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
