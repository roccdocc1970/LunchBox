import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // Local-only: forwards to dev-server.js (see `npm run dev:api`).
      // In production, Vercel serves api/**.js as serverless functions directly.
      '/api': 'http://localhost:3001',
    },
  },
})