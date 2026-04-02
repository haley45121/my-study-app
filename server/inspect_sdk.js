const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

try {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  console.log('Keys of ai object:', Object.keys(ai));
  if (ai.models) {
    console.log('Keys of ai.models:', Object.keys(ai.models));
  } else {
    console.log('ai.models is UNDEFINED');
  }
} catch (e) {
  console.error('Constructor failed:', e.message);
}
