import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import yaml from '@rollup/plugin-yaml';
import vuetify from 'vite-plugin-vuetify';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    yaml(),
    vuetify(),
  ],
  base: './',
  build: {
    outDir: 'dist/app',
    chunkSizeWarningLimit: 1000,
  }
});
