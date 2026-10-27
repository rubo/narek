// SPDX-License-Identifier: MIT

import { build } from './build-books.js';

// Watcher paths are relative to the root, so the leading separator is optional.
const SOURCE = /(^|[\\/])book[\\/].+\.(?:md|json)$/u;

/**
 * Regenerates the JSON from book/, watches the corpus in dev, and fails the
 * build on a broken mapping.
 *
 * @returns {import('vite').Plugin}
 */
export default function books() {
  // Held from buildStart to generateBundle; assets are empty unless SITE_URL
  // is set.
  let assets = new Map();
  let routes = [];

  return {
    name: 'books',
    async buildStart() {
      const result = await build({ log: (message) => this.info(message) });

      assets = result.assets;
      routes = result.routes;

      if (result.problems.length > 0) {
        this.error(result.problems.join('\n'));
      }
    },
    generateBundle: {
      // After Vite's own HTML plugin, which emits index.html.
      order: 'post',
      handler(_options, bundle) {
        for (const [fileName, source] of assets) {
          this.emitFile({ type: 'asset', fileName, source });
        }

        const index = bundle['index.html']?.source;

        if (index === undefined) {
          this.error('index.html is missing from the bundle');
        }

        // GitHub Pages has no SPA fallback: it serves /chapter/3 from
        // chapter/3.html and anything else from 404.html, with a 404 status.
        // A <route>.html rather than <route>/index.html, which it would
        // redirect to the slashed URL.
        for (const route of routes.filter((route) => route !== '/')) {
          this.emitFile({ type: 'asset', fileName: `${route.slice(1)}.html`, source: index });
        }

        this.emitFile({ type: 'asset', fileName: '404.html', source: index });
      },
    },
    configureServer(server) {
      const run = async () => {
        try {
          // Writing the JSON is enough: it is under src/, so Vite reloads it.
          const { problems } = await build({});

          for (const problem of problems) {
            server.config.logger.error(problem);
          }
        } catch (error) {
          server.config.logger.error(error?.message ?? String(error));
        }
      };

      // A single save fires more than one event, so coalesce them.
      let queued;

      const regenerate = (file) => {
        if (!SOURCE.test(file)) {
          return;
        }

        clearTimeout(queued);
        queued = setTimeout(run, 50);
      };

      server.watcher.on('add', regenerate);
      server.watcher.on('change', regenerate);
      server.watcher.on('unlink', regenerate);
    },
  };
}
