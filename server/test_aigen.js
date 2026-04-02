require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const dummyPath = path.join(__dirname, 'dummy.txt');
  fs.writeFileSync(dummyPath, "Hello world, what is mitochondria?");
  
  const file = await ai.files.upload({ file: dummyPath, mimeType: 'text/plain' });

  const payloads = [
    [ file, "hello" ],
    [ { fileData: { fileUri: file.uri, mimeType: file.mimeType } }, "hello" ],
    [ { fileData: { fileUri: file.uri, mimeType: file.mimeType } }, { text: "hello" } ],
    [{ role: 'user', parts: [ { fileData: { fileUri: file.uri, mimeType: file.mimeType } }, { text: "hello" } ] }],
    [ { fileData: { fileUri: file.uri, mimeType: file.mimeType } } ],
    [ file.uri, "hello" ]
  ];

  const results = [];

  for (let i = 0; i < payloads.length; i++) {
    try {
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: payloads[i]
      });
      results.push({ payload: i + 1, status: "SUCCESS" });
    } catch(e) {
      results.push({ payload: i + 1, status: "FAILED", error: e.message });
    }
  }
  fs.writeFileSync('result.json', JSON.stringify(results, null, 2));
}

test();
