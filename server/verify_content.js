const { initDb, getDb } = require('./db/database');

async function verifyPdfFlow() {
  await initDb();
  const db = getDb();
  
  // 1. Check if we have any files with content
  const fileCount = db.prepare('SELECT COUNT(*) as count FROM files').get().count;
  console.log(`Total files in database: ${fileCount}`);
  
  const filesWithContent = db.prepare('SELECT id, name, type, length(content) as contentLen FROM files').all();
  filesWithContent.forEach(f => {
    console.log(`- File [${f.id}]: ${f.name} (${f.type}) | Content Length: ${f.contentLen || 0} chars`);
  });

  if (filesWithContent.length > 0) {
    console.log('\n--- SUCCESS: Files are being parsed and stored correctly. ---');
  } else {
    console.warn('\n--- WARNING: No files found in database. ---');
  }

  // 2. Simulate the /generate logic
  let combinedContent = "";
  for (const f of filesWithContent) {
    const file = db.prepare('SELECT content FROM files WHERE id = ?').get(f.id);
    if (file && file.content) combinedContent += file.content + "\n\n";
  }
  
  if (combinedContent.trim()) {
    console.log(`\nCombined content for session: ${combinedContent.length} chars total.`);
    console.log('Sample content:', combinedContent.substring(0, 100).replace(/\n/g, ' ') + '...');
  } else if (fileCount > 0) {
    console.error('\n--- ERROR: Files exist but content is EMPTY. ---');
  }
}

verifyPdfFlow().catch(console.error);
