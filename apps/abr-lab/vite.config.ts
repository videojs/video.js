import { defineConfig } from 'vite-plus';

export default defineConfig({
  // `vp dev` serves the logger page; the scorer and tests run in Node.
  root: 'src/logger',
  server: { port: 5199, strictPort: true },
  test: {
    root: '.',
    include: ['src/**/tests/*.test.ts'],
  },
});
