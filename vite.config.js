import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['boss-edi-frontend-production.up.railway.app', 'all'],
    host: '0.0.0.0',
    port: 3001,
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
  },
  build: {
    outDir: 'dist'
  }
})
