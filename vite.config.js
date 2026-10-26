import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The frontend always talks to the API through same-origin relative URLs.
    // In development Vite forwards /api to the local Apache-served project so
    // the request reaches backend/api/index.php via the project .htaccess.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1/khuzaifa-shinwari',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
})
