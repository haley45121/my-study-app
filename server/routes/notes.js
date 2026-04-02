const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// GET all notes
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { folderId, setId } = req.query;
    let query = `
      SELECT n.*, f.name as folderName, s.title as setTitle
      FROM notes n
      LEFT JOIN folders f ON n.folderId = f.id
      LEFT JOIN sets s ON n.setId = s.id
    `;
    const conditions = [];
    const params = [];

    if (folderId) { conditions.push('n.folderId = ?'); params.push(folderId); }
    if (setId) { conditions.push('n.setId = ?'); params.push(setId); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY n.updatedAt DESC';

    const notes = db.prepare(query).all(...params);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single note
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const note = db.prepare(`
      SELECT n.*, f.name as folderName, s.title as setTitle
      FROM notes n
      LEFT JOIN folders f ON n.folderId = f.id
      LEFT JOIN sets s ON n.setId = s.id
      WHERE n.id = ?
    `).get(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create note
router.post('/', (req, res) => {
  try {
    const { title, content, folderId, setId } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

    const db = getDb();
    const result = db.prepare('INSERT INTO notes (title, content, folderId, setId) VALUES (?, ?, ?, ?)')
      .run(title.trim(), content || '', folderId || null, setId || null);
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update note
router.put('/:id', (req, res) => {
  try {
    const { title, content, folderId, setId } = req.body;
    const db = getDb();
    db.prepare(`
      UPDATE notes SET 
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        folderId = ?,
        setId = ?,
        updatedAt = datetime('now')
      WHERE id = ?
    `).run(
      title || null,
      content !== undefined ? content : null,
      folderId !== undefined ? folderId : null,
      setId !== undefined ? setId : null,
      req.params.id
    );
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE note
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
    res.json({ message: 'Note deleted', id: Number(req.params.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
