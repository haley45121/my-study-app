const { initDb, getDb } = require('./server/db/database');
const express = require('express');
const progressRouter = require('./server/routes/progress');

async function test() {
  await initDb();
  console.log('DB initialized');
  
  const app = express();
  app.use('/api/progress', progressRouter);
  
  // Mock request/response for the dashboard route
  const req = {};
  const res = {
    json: (data) => console.log('Response data:', JSON.stringify(data, null, 2)),
    status: (code) => {
      console.log('Status:', code);
      return res;
    }
  };
  
  // We can't easily call the router function directly without a full express setup
  // but we can test the database queries if we wanted.
  // Instead, let's just do a manual check of the progress.js logic by calling the handler
  const handler = progressRouter.stack.find(s => s.route?.path === '/dashboard')?.route?.stack[0]?.handle;
  
  if (handler) {
    console.log('Calling dashboard handler...');
    await handler(req, res);
  } else {
    console.log('Dashboard handler not found');
  }
}

test().catch(console.error);
