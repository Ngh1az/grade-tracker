import dotenv from 'dotenv';
import { connectDB } from './db.js';
import { createApp } from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  createApp().listen(PORT, '127.0.0.1', () => {
    console.log(`Server listening on 127.0.0.1:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
