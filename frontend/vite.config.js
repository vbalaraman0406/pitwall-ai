import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/f1/',
  server: {
    proxy: {
      '/f1/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
