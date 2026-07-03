import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/escape.spec.js']
  }
});
