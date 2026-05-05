import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const proxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:8080';
const ocrProxyTarget = process.env.VITE_OCR_PROXY_TARGET || 'http://localhost:8001';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // OCR/crawl-data goes to Python FastAPI service — must be listed before the general /api rule
      // Frontend path:  /api/v1/crawl-data/books  →  rewrite  →  /api/v1/books  →  Python :8001
      '/api/v1/crawl-data': {
        target: ocrProxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/v1/crawl-data', '/api/v1'),
      },
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
});
