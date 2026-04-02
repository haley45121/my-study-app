const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// PUT update card
router.put('/:id', (req, res) => {
  try {
    const { term, definition, source } = req.body;
    const db = getDb();
    db.prepare(`
      UPDATE cards SET 
        term = COALESCE(?, term), 
        definition = COALESCE(?, definition), 
        source = COALESCE(?, source),
        updatedAt = datetime('now') 
      WHERE id = ?
    `).run(term || null, definition || null, source !== undefined ? source : null, req.params.id);

    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });

    // Get aliases
    const aliases = db.prepare('SELECT * FROM card_aliases WHERE cardId = ?').all(req.params.id);
    res.json({ ...card, aliases: aliases.map(a => a.alias) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE card
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });

    db.prepare('DELETE FROM cards WHERE id = ?').run(req.params.id);
    // Update parent set timestamp
    db.prepare("UPDATE sets SET updatedAt = datetime('now') WHERE id = ?").run(card.setId);
    res.json({ message: 'Card deleted', id: Number(req.params.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add alias to card
router.post('/:id/aliases', (req, res) => {
  try {
    const { alias } = req.body;
    if (!alias || !alias.trim()) return res.status(400).json({ error: 'Alias is required' });

    const db = getDb();
    const card = db.prepare('SELECT id FROM cards WHERE id = ?').get(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });

    db.prepare('INSERT INTO card_aliases (cardId, alias) VALUES (?, ?)').run(req.params.id, alias.trim());
    const aliases = db.prepare('SELECT * FROM card_aliases WHERE cardId = ?').all(req.params.id);
    res.status(201).json(aliases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE alias
router.delete('/aliases/:aliasId', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM card_aliases WHERE id = ?').run(req.params.aliasId);
    res.json({ message: 'Alias deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
