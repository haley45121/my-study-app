require('dotenv').config();
const { generateFlashcardsFromText, generateQuizFromContent } = require('./services/aiGenerator');

(async () => {
  console.log('Testing generateFlashcardsFromText...');
  try {
    const text = 'Photosynthesis is the process by which plants use sunlight to make food. It happens in chloroplasts.';
    const cards = await generateFlashcardsFromText(text);
    console.log('SUCCESS:', cards.length, 'cards generated.');
  } catch (e) {
    console.error('FAILED Flashcards:', e.message);
  }

  console.log('\nTesting generateQuizFromContent...');
  try {
    const content = 'The mitochondria is the powerhouse of the cell. It produces ATP.';
    const quiz = await generateQuizFromContent(content);
    console.log('SUCCESS:', quiz.length, 'quiz items generated.');
  } catch (e) {
    console.error('FAILED Quiz:', e.message);
  }
})();
