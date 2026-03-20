import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Per Netlify deployment dalla root
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5032',
        changeOrigin: true,
      }
    }
  }
})
