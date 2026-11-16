import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api/admin/appointments': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      '/api/admin': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/auth': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/api/notifications': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
    },
  },
});
