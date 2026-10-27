// SPDX-License-Identifier: MIT

import { readdir, rename, rmdir } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { build } from './scripts/build-books.js';

/** @type {import('@react-router/dev/config').Config} */
export default {
  appDirectory: 'src',
  buildDirectory: 'dist',
  ssr: false,
  async prerender() {
    const { pages } = await build({ check: true });

    return pages.map(({ path }) => path);
  },
  async buildEnd({ reactRouterConfig }) {
    const client = join(reactRouterConfig.buildDirectory, 'client');

    // GitHub Pages serves 404.html for any path without a file.
    await rename(join(client, '__spa-fallback.html'), join(client, '404.html'));

    // GitHub Pages serves chapter/3.html at /chapter/3, but redirects to
    // /chapter/3/ for chapter/3/index.html.
    const pages = (await readdir(client, { recursive: true })).filter(
      (file) => basename(file) === 'index.html' && file !== 'index.html',
    );

    if (pages.length === 0) {
      throw new Error('No <path>/index.html pages to flatten');
    }

    for (const page of pages) {
      const folder = join(client, dirname(page));

      await rename(join(client, page), `${folder}.html`);
      // A folder with pages below it, such as mk/, stays.
      await rmdir(folder).catch((error) => {
        if (error.code !== 'ENOTEMPTY') {
          throw error;
        }
      });
    }
  },
};
