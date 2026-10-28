// SPDX-License-Identifier: MIT

import { reactRouter } from '@react-router/dev/vite';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import books from './scripts/vite-plugin-books.js';

// https://vite.dev/config/
export default defineConfig({
  plugins: [books(), reactRouter(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
});
