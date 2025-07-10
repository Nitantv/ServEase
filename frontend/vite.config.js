// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.', // root is current folder
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      // string shorthand: http://localhost:5173/api -> http://localhost:5000/api
      '/api': 'http://localhost:5000',
    }
  }
});
