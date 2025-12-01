// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import preact from '@astrojs/preact';
import dotenv from 'dotenv';

import tailwindcss from '@tailwindcss/vite';

// Load environment variables from .env file
dotenv.config();

// Configuration for Node.js deployment (Docker, standalone)
// https://astro.build/config
export default defineConfig({
  output: 'server',

  adapter: node({
    mode: 'standalone'
  }),

  integrations: [
    preact(),
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});