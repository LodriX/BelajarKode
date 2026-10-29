import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    viteSingleFile({
      outputFileName: 'BelajarKode.html',
      removeViteModuleLoader: true,
    }),
  ],
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
