import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// If deploying to GitHub Pages without a custom domain, set base to '/<repo-name>/'
// Example: base: '/gmongaras/'
export default defineConfig({
  plugins: [react()],
  base: '/', // change to '/<repo-name>/' when using GitHub Pages without a custom domain
  server: {
    watch: {
      // A packaged extension is locked while it is written, and watching it
      // crashes the dev server on Windows.
      ignored: ['**/.git/**', '**/node_modules/**', '**/test-results/**', '**/*.vsix'],
    },
  },
})
