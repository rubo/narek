// SPDX-License-Identifier: MIT

import { rename } from 'node:fs/promises';
import { join } from 'node:path';
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

    // Served for any path without a file (`not_found_handling` in wrangler.jsonc).
    await rename(join(client, '__spa-fallback.html'), join(client, '404.html'));
  },
};
