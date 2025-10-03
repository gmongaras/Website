import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// If deploying to GitHub Pages without a custom domain, set base to '/<repo-name>/'
// Example: base: '/gmongaras/'
export default defineConfig({
  plugins: [react()],
  base: '/', // change to '/<repo-name>/' when using GitHub Pages without a custom domain
})
