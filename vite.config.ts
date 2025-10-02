// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/', // correct asset paths
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Dev: forward /api/* to your local backend
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // secure: false, // uncomment if you use https locally with self-signed cert
      },
    },
  },
  preview: {
    // Optional: when running `vite preview`, keep the same proxy
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
