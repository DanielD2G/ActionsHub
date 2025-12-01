// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

// Configuration for Vercel deployment
// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel({
    webAnalytics: {
      enabled: false
    }
  }),
  integrations: [
    preact(),
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});