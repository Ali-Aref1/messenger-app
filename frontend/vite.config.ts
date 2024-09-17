import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/upload': 'http://localhost:4000', // Replace with your server URL
    },
  },
  plugins: [react()],
  
})
