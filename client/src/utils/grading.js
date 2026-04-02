/**
 * Grading logic for Learn Mode
 * Uses Levenshtein distance for typo tolerance and close-enough matching
 */

/**
 * Calculate the Levenshtein distance between two strings
 */
function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Normalize a string for comparison:
 * lowercase, trim, collapse whitespace, strip common punctuation
 */
function normalize(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[.,;:!?'"()\[\]{}\-_\/\\]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Calculate similarity ratio (0 to 1)
 */
function similarityRatio(a, b) {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLen;
}

/**
 * Grade a user's response against the correct answer and aliases
 * 
 * @param {string} userAnswer - What the user typed
 * @param {string} correctAnswer - The correct term
 * @param {string[]} aliases - Alternative accepted answers
 * @param {Object} options - Configurable thresholds
 * @returns {{ result: 'exact'|'close'|'alias'|'incorrect', similarity: number, matchedWith: string }}
 */
export function gradeAnswer(userAnswer, correctAnswer, aliases = [], options = {}) {
  const {
    closeEnoughThreshold = 0.80,  // 80% similarity = close enough
  } = options;

  const normalizedUser = normalize(userAnswer);
  const normalizedCorrect = normalize(correctAnswer);

  // Empty answer check
  if (!normalizedUser) {
    return { result: 'incorrect', similarity: 0, matchedWith: correctAnswer };
  }

  // Exact match
  if (normalizedUser === normalizedCorrect) {
    return { result: 'exact', similarity: 1, matchedWith: correctAnswer };
  }

  // Check aliases for exact match
  for (const alias of aliases) {
    if (normalizedUser === normalize(alias)) {
      return { result: 'alias', similarity: 1, matchedWith: alias };
    }
  }

  // Close-enough check against correct answer
  const mainSimilarity = similarityRatio(normalizedUser, normalizedCorrect);
  if (mainSimilarity >= closeEnoughThreshold) {
    return { result: 'close', similarity: mainSimilarity, matchedWith: correctAnswer };
  }

  // Close-enough check against aliases
  for (const alias of aliases) {
    const aliasSimilarity = similarityRatio(normalizedUser, normalize(alias));
    if (aliasSimilarity >= closeEnoughThreshold) {
      return { result: 'close', similarity: aliasSimilarity, matchedWith: alias };
    }
  }

  // No match
  return { result: 'incorrect', similarity: mainSimilarity, matchedWith: correctAnswer };
}

/**
 * Check if a grading result counts as correct
 */
export function isCorrect(gradeResult) {
  return ['exact', 'close', 'alias'].includes(gradeResult.result);
}
