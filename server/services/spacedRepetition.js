/**
 * SM-2 Spaced Repetition Algorithm (Simplified)
 * 
 * quality: 1-5 rating
 *   1 = complete blackout
 *   2 = incorrect, but recognized
 *   3 = correct with difficulty
 *   4 = correct with hesitation
 *   5 = perfect recall
 */

function calculateNextReview(currentData, quality) {
  let { easeFactor, interval, repetitions } = currentData;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect response — reset
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor (minimum 1.3)
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  const nextReviewDateStr = nextReviewDate.toISOString().split('T')[0];

  return {
    easeFactor: Math.round(easeFactor * 100) / 100,
    interval,
    repetitions,
    nextReviewDate: nextReviewDateStr,
    lastReviewedAt: new Date().toISOString()
  };
}

/**
 * Convert boolean correct/incorrect + attempt context to a quality rating
 */
function deriveQuality(wasCorrect, attempts, mode) {
  if (!wasCorrect) {
    return attempts >= 2 ? 1 : 2;
  }
  // Correct
  if (mode === 'learn') {
    if (attempts === 1) return 5; // First try correct
    return 3; // Needed multiple attempts
  }
  // Flashcard mode — rating comes directly from user
  return 4; // Default for flashcard correct
}

module.exports = { calculateNextReview, deriveQuality };
