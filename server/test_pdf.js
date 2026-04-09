const fs = require('fs');
const pdf = require('pdf-parse');

(async () => {
  try {
    const dataBuffer = fs.readFileSync('dummy.pdf');
    const data = await pdf(dataBuffer);
    console.log('PDF parsed successfully!');
    console.log('Text content:', data.text);
  } catch (err) {
    console.error('Local PDF parsing failed:', err.message);
  }
})();
