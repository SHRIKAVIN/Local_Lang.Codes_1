import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // So "@/components" works
    },
  },
  server: {
    port: 5173, // Frontend default port
    proxy: {
      '/process': 'http://localhost:5000', // Proxy API to Flask backend
    },
  },
})
