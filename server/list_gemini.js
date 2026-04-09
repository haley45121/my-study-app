require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

(async () => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.list();
    const models = response.models || response;
    console.log('Available Gemini Models:');
    if (Array.isArray(models)) {
      models.filter(m => m.name.toLowerCase().includes('gemini'))
            .forEach(m => console.log(`- ${m.name}`));
    }
  } catch (e) {
    console.error('ERROR:', e.message);
  }
})();
