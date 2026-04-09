require('dotenv').config();
console.log('KEY EXISTS:', !!process.env.GEMINI_API_KEY);
console.log('KEY PREFIX:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) : 'NONE');
const { GoogleGenAI } = require('@google/genai');

(async () => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log('Constructor worked');
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: "user", parts: [{ text: "hi" }] }]
    });
    console.log('Response:', response.text);
  } catch (e) {
    console.error('ERROR:', e.message);
    if (e.status) console.error('STATUS:', e.status);
  }
})();
