require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function testModel(modelName) {
  console.log(`\nTesting model: ${modelName}`);
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: "Hello, are you there? Reply with 'Yes'." }] }],
      config: {
        temperature: 0.1
      }
    });
    console.log(`Success with ${modelName}:`, response.text);
    return true;
  } catch (err) {
    console.error(`Error with ${modelName}:`, err.message, err.status ? `(Status: ${err.status})` : '');
    return false;
  }
}

(async () => {
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'];
  for (const model of models) {
    await testModel(model);
  }
})();
