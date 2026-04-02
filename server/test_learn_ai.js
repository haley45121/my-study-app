const { semanticGradeAnswer, generateQuizFromContent } = require('./services/aiGenerator');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testRecall() {
  const { getAIClient } = require('./services/aiGenerator');
  const client = getAIClient();
  console.log("AI Client Keys:", Object.keys(client));
  console.log("Testing Semantic Recall Grading...");
  const tests = [
    { user: "A group of notes played together", correct: "A chord", expected: true },
    { user: "sequence of notes", correct: "A chord", expected: true },
    { user: "something else", correct: "A chord", expected: false }
  ];

  for (const t of tests) {
    try {
      const result = await semanticGradeAnswer(t.user, t.correct);
      console.log(`- Student: "${t.user}" | Correct: "${t.correct}" | Result: ${result.isCorrect} (Score: ${result.score})`);
    } catch (e) {
      console.log(`- Error in test: ${e.message}`);
    }
  }
}

async function testQuiz() {
  console.log("\nTesting Quiz Generation...");
  const content = "The mitochondria is the powerhouse of the cell. It generates ATP through oxidative phosphorylation. Chloroplasts are found in plant cells and perform photosynthesis.";
  try {
    const quiz = await generateQuizFromContent(content);
    console.log(JSON.stringify(quiz, null, 2));
  } catch (e) {
    console.log(`- Error in quiz test: ${e.message}`);
  }
}

async function run() {
  await testRecall();
  await testQuiz();
}

run().catch(console.error);
