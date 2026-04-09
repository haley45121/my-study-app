require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

(async () => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.list();
    const models = response.models || response;
    console.log('Available models:');
    if (Array.isArray(models)) {
      models.forEach(m => console.log(`- ${m.name} (${m.displayName || 'No Display Name'})`));
    } else {
      console.log('Models is not an array:', typeof models);
      console.log(JSON.stringify(models, null, 2));
    }
  } catch (e) {
    console.error('ERROR:', e.message);
  }
})();
