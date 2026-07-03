// Deliberately empty. This project uses Tailwind CSS v4 via the
// @tailwindcss/vite plugin (see vite.config.ts), which does its own CSS
// transform and doesn't need a classic PostCSS plugin pipeline. This file
// exists solely so that postcss-load-config's upward directory search
// stops here instead of finding the parent UniBluePrint app's
// postcss.config.js (which configures Tailwind v3 and is incompatible
// with this project's CSS).
export default {
  plugins: {},
}
