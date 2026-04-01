import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/health': 'http://127.0.0.1:7860',
      '/reset': 'http://127.0.0.1:7860',
      '/step': 'http://127.0.0.1:7860',
      '/state': 'http://127.0.0.1:7860',
      '/autopilot': 'http://127.0.0.1:7860',
      '/assets': 'http://127.0.0.1:7860',
    },
  },
})
