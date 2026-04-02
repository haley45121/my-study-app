const fs = require('fs');
const path = require('path');
const os = require('os');
const pdf = require('pdf-parse');
const { uploadDocumentForFlashcards, extractTextFromDocument } = require('./aiGenerator');

/**
 * Persists the buffer to disk temporarily, uploads it securely to Gemini's 
 * Engine to parse, and then cleans up.
 */
async function parseDocument(buffer, mimeType, extension) {
  const tempFilePath = path.join(os.tmpdir(), `flashcard-upload-${Date.now()}${extension}`);
  fs.writeFileSync(tempFilePath, buffer);
  
  try {
    let candidates = [];
    let rawContent = "";
    
    try {
      // Primary: Use Gemini AI for extraction and text
      console.log('Attempting AI extraction for document...');
      candidates = await uploadDocumentForFlashcards(tempFilePath, mimeType);
      rawContent = await extractTextFromDocument(tempFilePath, mimeType);
      console.log('AI extraction successful.');
    } catch (aiErr) {
      console.error('AI Extraction failed, falling back to local parsing:', aiErr);
      
      try {
        if (mimeType === 'application/pdf') {
          const dataBuffer = fs.readFileSync(tempFilePath);
          const data = await pdf(dataBuffer);
          rawContent = data.text;
        } else if (mimeType === 'text/csv' || extension === '.csv') {
          rawContent = fs.readFileSync(tempFilePath, 'utf-8');
        }
        console.log('Local fallback parsing successful.');
      } catch (fallbackErr) {
        console.error('Local fallback parsing failed as well:', fallbackErr);
        throw new Error('Both AI extraction and local fallback failed to process this document.');
      }
      
      candidates = []; // No candidates available from local parsing
    }
    
    return {
      candidates,
      rawContent
    };
  } finally {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

module.exports = {
  parseDocument
};
