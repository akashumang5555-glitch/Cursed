import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // relative asset paths: the built site works from any folder or domain it is uploaded to
  base: './',
  plugins: [react(), tailwindcss()],
})
