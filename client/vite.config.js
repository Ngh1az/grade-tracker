import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Mặc định proxy /api sang server local (npm run dev, cần server+Mongo local đang chạy).
// `npm run dev:live` nạp .env.live (VITE_API_PROXY_TARGET) để proxy sang production —
// sửa UI thấy ngay bằng data thật, không cần deploy hay chạy Mongo/server ở máy mình.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_PROXY_TARGET || 'http://localhost:5000';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': { target, changeOrigin: true, secure: true },
      },
    },
  };
});
