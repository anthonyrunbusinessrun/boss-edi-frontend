import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/connector': {
        target: 'https://boss-edi-connector-production.up.railway.app',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/connector/, ''),
      },
    },
  },
  build: { outDir: 'dist' },
});
