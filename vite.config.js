import { defineConfig } from 'vite';

export default defineConfig({
  base: '/escape-the-treehouse/',
  server: {
    port: 3005,
    strictPort: true,
    host: true
  },
  build: {
    assetsInlineLimit: 0
  }
});
