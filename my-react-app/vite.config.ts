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
      // OCR static assets (images served by Python /static/**) MUST go through Spring Boot,
      // because the BE proxy injects the X-Internal-API-Key header that Python requires.
      // Direct browser → Python returns 403 Forbidden. Listed before the generic crawl-data rule.
      '/api/v1/crawl-data/static': {
        target: proxyTarget,
        changeOrigin: true,
        // Same long-running backend routes as /api (Spring → Gemini, LaTeX, …)
        timeout: 1_200_000,
        proxyTimeout: 1_200_000,
      },
      // OCR/crawl-data REST APIs go to Python FastAPI service — must be listed before the general /api rule
      // Frontend path:  /api/v1/crawl-data/books  →  rewrite  →  /api/v1/books  →  Python :8001
      '/api/v1/crawl-data': {
        target: ocrProxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/v1/crawl-data', '/api/v1'),
      },
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        // Default Node proxy closes ~2min; template generation is often 5–15+ minutes (many Gemini calls).
        timeout: 1_200_000,
        proxyTimeout: 1_200_000,
      },
    },
  },
});
