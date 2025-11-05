import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 👇 DODAJ TO KONFIGURACIJO
export default defineConfig({
  plugins: [react()],
  root: '.', // pove Vite, da je index.html v root mapi
  build: {
    outDir: 'dist'
  }
})
