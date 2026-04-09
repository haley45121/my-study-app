const fs = require('fs');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

(async () => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.list();
    fs.writeFileSync('models_output.json', JSON.stringify(response, null, 2));
    console.log('Saved to models_output.json');
  } catch (e) {
    console.error('ERROR:', e.message);
  }
})();
