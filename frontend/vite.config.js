import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // During local dev, proxy API calls to the Express backend so no
      // hardcoded absolute URL / CORS juggling is needed.
      '/api': 'http://localhost:8080',
    },
  },
});
