import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'esbuild',  // ⚠️ WICHTIG: NICHT 'terser'!
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    port: 3000,
    open: true
  }
})
