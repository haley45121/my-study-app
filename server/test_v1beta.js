const { generateFlashcardsFromText, semanticGradeAnswer } = require('./services/aiGenerator');
require('dotenv').config();

async function testV1Beta() {
  console.log('--- Testing Gemini v1beta Integration ---');
  
  try {
    console.log('\n1. Testing Text-to-Flashcard Generation...');
    const testText = "The mitochondria is the powerhouse of the cell. Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water.";
    const flashcards = await generateFlashcardsFromText(testText);
    console.log('SUCCESS: Generated Flashcards:');
    console.log(JSON.stringify(flashcards, null, 2));
    
    console.log('\n2. Testing Semantic Grading...');
    const grade = await semanticGradeAnswer("The powerhouse", "Mitochondria");
    console.log('SUCCESS: Grade Result:');
    console.log(JSON.stringify(grade, null, 2));
    
    console.log('\n--- ALL V1BETA TESTS PASSED ---');
  } catch (err) {
    console.error('\n--- TEST FAILED ---');
    console.error(err);
    process.exit(1);
  }
}

testV1Beta();
