require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

(async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = 'gemini-1.5-flash';
  console.log(`Testing ${model} with minimal config...`);
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: [{ text: 'Say "Working"' }] }]
    });
    console.log('SUCCESS:', response.text);
  } catch (e) {
    console.error('FAILED:', e.message);
    if (e.status) console.error('STATUS:', e.status);
    
    console.log('\nTrying with models/ prefix...');
    try {
      const response2 = await ai.models.generateContent({
        model: 'models/' + model,
        contents: [{ role: 'user', parts: [{ text: 'Say "Working"' }] }]
      });
      console.log('SUCCESS with prefix:', response2.text);
    } catch (e2) {
      console.error('FAILED with prefix:', e2.message);
    }
  }
})();
