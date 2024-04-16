import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { inStaging } from './src/config'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: inStaging ? '/grapa' : '/',
  server: {
    proxy: {
      '/api/': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      usePolling: true,
    },
    host: true,
    strictPort: true,
    port: 3000,
  },
  define: {
    'process.env': process.env,
  },
})
