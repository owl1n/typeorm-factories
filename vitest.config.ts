import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/index.ts'],
    },
  },
});
