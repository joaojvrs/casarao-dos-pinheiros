import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      viteCompression({ algorithm: 'gzip', ext: '.gz', threshold: 1024 }),
      viteCompression({ algorithm: 'brotliCompress', ext: '.br', threshold: 1024 }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'es2020',
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            const normalizedId = id.replace(/\\/g, '/');

            if (
              normalizedId.includes('/node_modules/react/') ||
              normalizedId.includes('/node_modules/react-dom/') ||
              normalizedId.includes('/node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }

            if (
              normalizedId.includes('/node_modules/three/') ||
              normalizedId.includes('/node_modules/@react-three/')
            ) {
              return 'vendor-three';
            }

            if (normalizedId.includes('/node_modules/gsap/')) return 'vendor-gsap';

            if (
              normalizedId.includes('/node_modules/motion/') ||
              normalizedId.includes('/node_modules/framer-motion/') ||
              normalizedId.includes('/node_modules/motion-dom/') ||
              normalizedId.includes('/node_modules/motion-utils/')
            ) {
              return 'vendor-motion';
            }
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
