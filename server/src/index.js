import dotenv from 'dotenv';
import { connectDB } from './db.js';
import { createApp } from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  // Bind tất cả interface: Prometheus scrape từ network namespace riêng (container) không
  // reach được loopback của host. Firewall (ufw) mới là chốt chặn truy cập ngoài, không phải bind address.
  createApp().listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
