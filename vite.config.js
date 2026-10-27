// SPDX-License-Identifier: MIT

import { reactRouter } from '@react-router/dev/vite';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { siteUrl } from './scripts/build-books.js';
import books from './scripts/vite-plugin-books.js';

// https://vite.dev/config/
export default defineConfig({
  define: {
    // Canonical URLs are absolute; empty leaves them out.
    'import.meta.env.SITE_URL': JSON.stringify(siteUrl),
  },
  plugins: [books(), reactRouter(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
});
