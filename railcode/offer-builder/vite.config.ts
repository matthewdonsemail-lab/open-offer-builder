import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Plain Vite for the frontend ONLY. The Hono worker is built by the Railcode
// CLI for both `railcode dev` and `railcode deploy`.
export default defineConfig({
  root: 'frontend',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'frontend/src'),
    },
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
})
