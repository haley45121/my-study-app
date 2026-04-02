/**
 * localExtractor.js
 * 
 * Strict local parsing engine designed to extract high-quality 
 * flashcards from uploaded documents (slides, PDFs, notes).
 * 
 * Implements strict rules for term/definition validation without an LLM.
 */

const STOPWORDS = new Set(['and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with']);

function cleanConcept(str) {
  let cleaned = str.replace(/^[•\-\*\>]\s*/, '').trim();
  cleaned = cleaned.replace(/[:\-\u2013\u2014]\s*$/, '').trim();
  return cleaned;
}

function isValidTerm(term) {
  if (!term || term.length < 2) return false;
  if (!isNaN(term)) return false;
  if (STOPWORDS.has(term.toLowerCase())) return false;
  
  // Terms must be concise (max 50 chars, max 7 words)
  if (term.length > 50) return false;
  const wordCount = term.split(/\s+/).length;
  if (wordCount > 7) return false;
  
  // Reject obvious PDF layout artifacts
  if (/^Page \d+( of \d+)?$/i.test(term)) return false;
  if (/^(Chapter|Lecture|Section) \d+/i.test(term)) return false;
  
  return true;
}

function isValidDefinition(def, term) {
  if (!def || def.length < 5) return false;
  if (def.toLowerCase() === term.toLowerCase()) return false;
  if (def.split(/\s+/).length < 3) return false; // meaningful definitions have at least 3 words
  if (/^[•\-\*]/.test(def) && def.length < 10) return false;
  if (/^Page \d+( of \d+)?$/i.test(def)) return false;
  return true;
}

function extractFlashcardsFromText(text) {
  if (!text) return [];

  // 1. Group text into logical blocks based on multiple newlines
  const rawLines = text.split(/\n/).map(l => l.trim());
  const lines = rawLines.filter(l => l.length > 0 && isNaN(l) && !/^Page \d+( of \d+)?$/i.test(l));

  const candidates = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for explicit delimiters on the same line "Term: Definition" or "Term - Definition"
    const explicitMatch = line.match(/^([A-Za-z0-9\s\(\)]+)\s*[:\-\u2013\u2014]\s+(.+)$/);
    if (explicitMatch) {
      const term = cleanConcept(explicitMatch[1]);
      let def = cleanConcept(explicitMatch[2]);
      
      // PDFs usually break definitions across consecutive lines.
      // If the next line exists, does not look like a new term, and the current definition doesn't end in typical sentence-ending punctuation, append it.
      let nextIdx = i + 1;
      while (nextIdx < lines.length) {
        let followingLine = lines[nextIdx];
        // If next line matches a new Term explicit pattern or looks like a typical short header, break out
        if (followingLine.match(/^([A-Za-z0-9\s\(\)]+)\s*[:\-\u2013\u2014]/) || (followingLine.length < 50 && isValidTerm(cleanConcept(followingLine)))) {
          break;
        }
        if (/^Page \d+( of \d+)?$/i.test(followingLine)) { nextIdx++; continue; }
        
        def += ' ' + cleanConcept(followingLine);
        nextIdx++;
      }

      if (isValidTerm(term) && isValidDefinition(def, term)) {
        candidates.push({ term, definition: def, aliases: [] });
        i = nextIdx - 1; // skip consumed lines
        continue;
      }
    }

    // Look for explicit multi-line delimiters: "Term:" on one line, followed by definition lines
    if (line.match(/^([A-Za-z0-9\s\(\)]+)[:\-\u2013\u2014]$/) && i + 1 < lines.length) {
      const term = cleanConcept(line);
      let def = cleanConcept(lines[i + 1]);
      
      let nextIdx = i + 2;
      while (nextIdx < lines.length) {
        let followingLine = lines[nextIdx];
        if (followingLine.match(/^([A-Za-z0-9\s\(\)]+)\s*[:\-\u2013\u2014]/) || followingLine.match(/^([A-Za-z0-9\s\(\)]+)[:\-\u2013\u2014]$/)) {
          break;
        }
        def += ' ' + cleanConcept(followingLine);
        nextIdx++;
      }
      
      if (isValidTerm(term) && isValidDefinition(def, term)) {
        candidates.push({ term, definition: def, aliases: [] });
        i = nextIdx - 1;
        continue;
      }
    }
  }

  // Deduplicate
  const uniqueTerms = new Set();
  const finalSet = [];
  
  for (const card of candidates) {
    const key = card.term.toLowerCase();
    if (!uniqueTerms.has(key)) {
      uniqueTerms.add(key);
      finalSet.push(card);
    }
  }

  return finalSet;
}

module.exports = {
  extractFlashcardsFromText
};
