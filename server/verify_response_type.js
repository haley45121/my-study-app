require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

(async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Respond with just one word: "OK"' }] }]
    });
    console.log('Response type:', typeof response.text);
    console.log('Response value:', response.text);
    if (typeof response.text === 'function') {
      console.log('Value from function:', response.text());
    }
  } catch (e) {
    console.error('ERROR:', e.message);
  }
})();
