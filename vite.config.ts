import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const defaultBase = repository && !repository.endsWith('.github.io') ? `/${repository}/` : '/';

export default defineConfig(({ command, isPreview }) => ({
  base: process.env.VITE_BASE_PATH || (command === 'build' || isPreview ? defaultBase : '/'),
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
  build: { rollupOptions: { output: { manualChunks: { charts: ['recharts'] } } } },
}));
