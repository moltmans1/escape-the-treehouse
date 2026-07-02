import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3005,
    strictPort: true,
    host: true
  },
  build: {
    assetsInlineLimit: 0
  }
});
