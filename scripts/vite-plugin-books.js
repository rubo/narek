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
  // Held from buildStart to generateBundle; empty unless SITE_URL is set.
  let assets = new Map();

  return {
    name: 'books',
    async buildStart() {
      const result = await build({ log: (message) => this.info(message) });

      assets = result.assets;

      if (result.problems.length > 0) {
        this.error(result.problems.join('\n'));
      }
    },
    generateBundle() {
      for (const [fileName, source] of assets) {
        this.emitFile({ type: 'asset', fileName, source });
      }
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
