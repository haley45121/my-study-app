require('dotenv').config();
const { generateQuizFromContent } = require('./services/aiGenerator');

(async () => {
  const sampleContent = `
  • IHRM: International Human Resource Management is the process of procuring, allocating, and effectively utilizing human resources in a multinational corporation.
  Chapter 1: Intro to Biology
  • Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar.
  • Mitochondria are the powerhouse of the cell, generating most of the cell's supply of adenosine triphosphate (ATP).
  • DNA (Deoxyribonucleic acid) is a molecule composed of two polynucleotide chains that coil around each other to form a double helix.
  `;
  console.log("Testing Quiz Generation...");
  try {
    const quiz = await generateQuizFromContent(sampleContent);
    console.log("Quiz Success! Items generated:", quiz.length);
    console.log(JSON.stringify(quiz.slice(0, 2), null, 2));
  } catch (e) {
    console.error("Quiz Error:", e);
  }
})();
