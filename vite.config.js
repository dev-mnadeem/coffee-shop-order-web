import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 3000, strictPort: true },
  preview: { port: 3000, strictPort: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    css: false,
    coverage: {
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/index.jsx', 'src/test/**', 'src/**/*.test.{js,jsx}'],
    },
  },
});
