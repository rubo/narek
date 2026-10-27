// SPDX-License-Identifier: MIT

// Serves the build the way GitHub Pages does: /chapter/3 from chapter/3.html,
// a folder only with a trailing slash, and anything else as 404.html.

import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/client', import.meta.url));
const port = 4173;
const types = {
  '.css': 'text/css',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
};

async function isFile(path) {
  return (await stat(path).catch(() => null))?.isFile() ?? false;
}

async function isFolder(path) {
  return (await stat(path).catch(() => null))?.isDirectory() ?? false;
}

async function respond(request, response) {
  const { pathname, search } = new URL(request.url, 'http://localhost');
  const path = resolve(root, `.${decodeURIComponent(pathname)}`);
  const send = async (file, status = 200) => {
    // GitHub Pages' cache lifetime, which prefetched data relies on.
    response.writeHead(status, {
      'cache-control': 'max-age=600',
      'content-type': types[extname(file)] ?? 'application/octet-stream',
    });
    response.end(await readFile(file));
  };

  if (path !== root && !path.startsWith(root + sep)) {
    return send(join(root, '404.html'), 404);
  }

  if (await isFile(path)) {
    return send(path);
  }

  if (!pathname.endsWith('/') && (await isFile(`${path}.html`))) {
    return send(`${path}.html`);
  }

  if (await isFolder(path)) {
    if (!pathname.endsWith('/')) {
      response.writeHead(301, { location: `${pathname}/${search}` });
      return response.end();
    }

    if (await isFile(join(path, 'index.html'))) {
      return send(join(path, 'index.html'));
    }
  }

  return send(join(root, '404.html'), 404);
}

createServer((request, response) => {
  respond(request, response).catch(() => response.writeHead(400).end());
}).listen(port, () => console.log(`http://localhost:${port}`));
