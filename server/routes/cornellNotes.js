const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// GET all Cornell notes
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { folderId, setId } = req.query;
    let query = `
      SELECT cn.*, f.name as folderName, s.title as setTitle
      FROM cornell_notes cn
      LEFT JOIN folders f ON cn.folderId = f.id
      LEFT JOIN sets s ON cn.setId = s.id
    `;
    const conditions = [];
    const params = [];

    if (folderId) { conditions.push('cn.folderId = ?'); params.push(folderId); }
    if (setId) { conditions.push('cn.setId = ?'); params.push(setId); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY cn.updatedAt DESC';

    const notes = db.prepare(query).all(...params);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single Cornell note
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const note = db.prepare(`
      SELECT cn.*, f.name as folderName, s.title as setTitle
      FROM cornell_notes cn
      LEFT JOIN folders f ON cn.folderId = f.id
      LEFT JOIN sets s ON cn.setId = s.id
      WHERE cn.id = ?
    `).get(req.params.id);
    if (!note) return res.status(404).json({ error: 'Cornell note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create Cornell note
router.post('/', (req, res) => {
  try {
    const { title, cues, mainNotes, summary, folderId, setId } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

    const db = getDb();
    const result = db.prepare(
      'INSERT INTO cornell_notes (title, cues, mainNotes, summary, folderId, setId) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(title.trim(), cues || '', mainNotes || '', summary || '', folderId || null, setId || null);

    const note = db.prepare('SELECT * FROM cornell_notes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update Cornell note
router.put('/:id', (req, res) => {
  try {
    const { title, cues, mainNotes, summary, folderId, setId } = req.body;
    const db = getDb();
    db.prepare(`
      UPDATE cornell_notes SET
        title = COALESCE(?, title),
        cues = COALESCE(?, cues),
        mainNotes = COALESCE(?, mainNotes),
        summary = COALESCE(?, summary),
        folderId = ?,
        setId = ?,
        updatedAt = datetime('now')
      WHERE id = ?
    `).run(
      title || null,
      cues !== undefined ? cues : null,
      mainNotes !== undefined ? mainNotes : null,
      summary !== undefined ? summary : null,
      folderId !== undefined ? folderId : null,
      setId !== undefined ? setId : null,
      req.params.id
    );
    const note = db.prepare('SELECT * FROM cornell_notes WHERE id = ?').get(req.params.id);
    if (!note) return res.status(404).json({ error: 'Cornell note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Cornell note
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const note = db.prepare('SELECT * FROM cornell_notes WHERE id = ?').get(req.params.id);
    if (!note) return res.status(404).json({ error: 'Cornell note not found' });

    db.prepare('DELETE FROM cornell_notes WHERE id = ?').run(req.params.id);
    res.json({ message: 'Cornell note deleted', id: Number(req.params.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
