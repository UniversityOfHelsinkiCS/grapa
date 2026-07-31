/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
    },
  },
  plugins: [react()],
  test: {
    projects: [
      {
        test: {
          name: 'server',
          include: ['src/server/**/*.test.{ts,tsx,js,jsx}'],
          setupFiles: ['./setupTests.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'client',
          include: ['src/client/**/*.test.{ts,tsx,js,jsx}'],
          setupFiles: ['./setupTests.ts'],
          environment: 'jsdom',
        },
      },
      {
        test: {
          name: 'integration',
          include: ['src/**/*.integration-test.{ts,tsx,js,jsx}'],
          setupFiles: ['./setupIntegrationTests.ts'],
          globalSetup: ['./setupDbForTests.cjs'],
          environment: 'node',
          fileParallelism: false,
        },
      },
    ],
  },
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
