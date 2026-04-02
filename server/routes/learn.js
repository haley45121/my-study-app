const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { generateQuizFromContent, semanticGradeAnswer } = require('../services/aiGenerator');

// GET all available source files
router.get('/files', (req, res) => {
  try {
    const db = getDb();
    const files = db.prepare('SELECT id, name, type, createdAt FROM files ORDER BY createdAt DESC').all();
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a file
router.delete('/files/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM files WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all sets as alternative sources
router.get('/sets', (req, res) => {
  try {
    const db = getDb();
    const sets = db.prepare('SELECT id, title FROM sets ORDER BY updatedAt DESC').all();
    res.json(sets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST generate study material (Quiz/Recall)
router.post('/generate', async (req, res) => {
  try {
    const { fileIds, setIds, mode } = req.body;
    const db = getDb();
    
    let combinedContent = "";

    // Gather content from files
    if (fileIds && Array.isArray(fileIds)) {
      console.log(`Gathering content from ${fileIds.length} files...`);
      for (const id of fileIds) {
        const file = db.prepare('SELECT name, content FROM files WHERE id = ?').get(id);
        if (file && file.content) {
          console.log(`- Loaded content from file: ${file.name} (${file.content.length} chars)`);
          combinedContent += `--- Content from ${file.name} ---\n${file.content}\n\n`;
        } else {
          console.warn(`- No content found for file ID: ${id}`);
        }
      }
    }

    // Gather content from sets (terms/definitions)
    if (setIds && Array.isArray(setIds)) {
      console.log(`Gathering content from ${setIds.length} sets...`);
      for (const id of setIds) {
        const setInfo = db.prepare('SELECT title FROM sets WHERE id = ?').get(id);
        const cards = db.prepare('SELECT term, definition FROM cards WHERE setId = ?').all(id);
        const setContent = cards.map(c => `${c.term}: ${c.definition}`).join('\n');
        console.log(`- Loaded ${cards.length} cards from set: ${setInfo?.title || id}`);
        combinedContent += `--- Content from Study Set: ${setInfo?.title || id} ---\n${setContent}\n\n`;
      }
    }

    if (!combinedContent.trim()) {
      return res.status(400).json({ error: 'No content found in selected sources' });
    }

    try {
      if (mode === 'quiz') {
        const quiz = await generateQuizFromContent(combinedContent);
        return res.json({ type: 'quiz', data: quiz });
      } else if (mode === 'guide') {
        const { generateStudyGuide } = require('../services/aiGenerator');
        const guide = await generateStudyGuide(combinedContent);
        return res.json({ type: 'guide', data: guide });
      } else if (mode === 'recall' || mode === 'game') {
        const { generateFlashcardsFromText } = require('../services/aiGenerator');
        const pairs = await generateFlashcardsFromText(combinedContent);
        return res.json({ type: mode, data: pairs });
      }
    } catch (aiErr) {
      console.error(`AI Generation for ${mode} failed:`, aiErr);
      
      // Basic heuristic fallback: extract "term: definition" or "term - definition" from raw text
      const lines = combinedContent.split('\n');
      const fallbackPairs = [];
      for (const line of lines) {
        if (line.includes(':') || line.includes(' - ')) {
          const separator = line.includes(':') ? ':' : ' - ';
          const [term, ...defParts] = line.split(separator);
          const definition = defParts.join(separator).trim();
          if (term.trim() && definition) {
            fallbackPairs.push({ term: term.trim(), definition, aliases: [] });
          }
        }
        if (fallbackPairs.length >= 50) break;
      }

      if (fallbackPairs.length > 0) {
        if (mode === 'quiz') {
          // Convert pairs to simple quiz
          const quiz = fallbackPairs.map((p, i) => ({
            question: `What is the definition of "${p.term}"?`,
            options: [p.definition, ...fallbackPairs.filter((_, idx) => idx !== i).slice(0, 3).map(f => f.definition)],
            correctAnswer: p.definition
          }));
          return res.json({ type: 'quiz', data: quiz, isFallback: true });
        } else if (mode === 'guide') {
          return res.json({ type: 'guide', data: combinedContent, isFallback: true });
        }
        return res.json({ type: mode, data: fallbackPairs, isFallback: true });
      }
      
      throw aiErr; // Rethrow if no fallback possible
    }

    res.status(400).json({ error: 'Invalid mode' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST semantic grading
router.post('/grade', async (req, res) => {
  try {
    const { userAnswer, correctAnswer } = req.body;
    if (!userAnswer || !correctAnswer) {
      return res.status(400).json({ error: 'Both userAnswer and correctAnswer are required' });
    }

    const result = await semanticGradeAnswer(userAnswer, correctAnswer);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
