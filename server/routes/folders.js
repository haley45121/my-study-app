const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// GET all folders
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const folders = db.prepare(`
      SELECT f.*, 
        (SELECT COUNT(*) FROM sets WHERE folderId = f.id) as setCount
      FROM folders f 
      ORDER BY f.updatedAt DESC
    `).all();
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single folder with its sets
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(req.params.id);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    const sets = db.prepare(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM cards WHERE setId = s.id) as cardCount
      FROM sets s 
      WHERE s.folderId = ? 
      ORDER BY s.updatedAt DESC
    `).all(req.params.id);

    res.json({ ...folder, sets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create folder
router.post('/', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Folder name is required' });

    const db = getDb();
    const result = db.prepare('INSERT INTO folders (name) VALUES (?)').run(name.trim());
    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(folder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update folder
router.put('/:id', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Folder name is required' });

    const db = getDb();
    db.prepare("UPDATE folders SET name = ?, updatedAt = datetime('now') WHERE id = ?")
      .run(name.trim(), req.params.id);
    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(req.params.id);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    res.json(folder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE folder
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(req.params.id);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    db.prepare('DELETE FROM folders WHERE id = ?').run(req.params.id);
    res.json({ message: 'Folder deleted', id: Number(req.params.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
