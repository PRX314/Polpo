import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/gestionale/', // pubblicato su polpopoly.it/gestionale
  build: {
    rollupOptions: {
      output: {
        // Firebase pesa da solo più di tutta l'app: in un file suo si scarica una volta e resta in cache
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5032',
        changeOrigin: true,
      }
    }
  }
})
