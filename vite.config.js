import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  define: {
    // Ensure environment variables are properly loaded
    'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY),
    'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN),
    'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID),
    'import.meta.env.VITE_FIREBASE_STORAGE': JSON.stringify(process.env.VITE_FIREBASE_STORAGE),
    'import.meta.env.VITE_FIREBASE_SENDER_ID': JSON.stringify(process.env.VITE_FIREBASE_SENDER_ID),
    'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(process.env.VITE_FIREBASE_APP_ID)
  }
})
