import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Prevent PostCSS from walking up to the parent UniBluePrint app's
  // postcss.config.js (Tailwind v3), which conflicts with this project's
  // Tailwind v4 setup. An inline config here stops that upward search.
  css: {
    postcss: {
      plugins: [],
    },
  },
})
