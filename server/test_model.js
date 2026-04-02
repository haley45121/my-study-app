require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
ai.models.generateContent({model: 'gemini-pro', contents: 'hi'}).then(console.log).catch(console.error);
