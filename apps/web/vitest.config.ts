import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: false })],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'jsdom',
    globals: true,
    alias: {
      '$lib': new URL('./src/lib', import.meta.url).pathname,
      '@toolbox/toolkit': new URL('../../packages/toolkit/src/index.ts', import.meta.url).pathname,
    },
  },
});
