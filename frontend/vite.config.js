import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  server: {
    port: 3000,
    proxy: {
      '/api/auth': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/api/users': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/lawyers': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/firms': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/appointments': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      '/api/slots': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      '/api/meetings': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      '/api/notifications': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/api/chat': {
        target: 'http://localhost:8086',
        changeOrigin: true,
      },
      '/ws-chat': {
        target: 'http://localhost:8086',
        ws: true,
        changeOrigin: true,
      },
      '/ws-meeting': {
        target: 'http://localhost:8084',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
