const { GoogleGenAI } = require('@google/genai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

async function test() {
  const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  console.log("Model initialized:", !!model);
  
  const prompt = "Explain the term 'Chord' in 5 words.";
  const result = await model.generateContent(prompt);
  console.log("Response:", result.response.text());
}

test().catch(console.error);
