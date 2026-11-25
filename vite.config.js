// SPDX-License-Identifier: MIT

import { reactRouter } from '@react-router/dev/vite';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import books from './scripts/vite-plugin-books.js';

// https://vite.dev/config/
export default defineConfig({
  // Inlines SITE_URL into the bundles, so the client hydrates the same
  // canonical URL the prerender wrote.
  envPrefix: ['VITE_', 'SITE_URL'],
  plugins: [books(), reactRouter(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
});
