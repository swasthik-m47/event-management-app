import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // This tells Vite not to worry about the backend files
    rollupOptions: {
      external: ['server.cjs']
    },
    outDir: 'dist'
  }
})