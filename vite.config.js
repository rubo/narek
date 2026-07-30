import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import books from './scripts/vite-plugin-books';

// https://vite.dev/config/
export default defineConfig({
  plugins: [books(), react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
});
