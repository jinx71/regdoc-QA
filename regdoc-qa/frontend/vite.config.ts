import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: the frontend calls relative `/api/*` and Vite proxies to the FastAPI backend,
// so there are no CORS issues locally. In production, set VITE_API_BASE_URL instead.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
