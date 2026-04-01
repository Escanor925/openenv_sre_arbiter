import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../sre_frontend_dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/reset': 'http://localhost:7860',
      '/step': 'http://localhost:7860',
      '/autopilot': 'http://localhost:7860',
      '/state': 'http://localhost:7860',
      '/health': 'http://localhost:7860',
    },
  },
})
