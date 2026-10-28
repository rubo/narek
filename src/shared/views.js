// SPDX-License-Identifier: MIT

// Shared by the app, the loaders and scripts/build-books.js, so the URLs the
// app navigates to are the ones that get prerendered.

// Canonical URLs, the sitemap and robots.txt are absolute.
export const siteUrl = 'https://narek.page';

// Keyed by the id in the URL. A translation always names its translator.
export const editions = {
  mk: 'Մ. Խերանյան',
  vg: 'Վ. Գևորգյան',
};

/**
 * A page's URL in a view. `page` is its path in the original: `/`,
 * `/chapter/<n>` or `/<name>` for a standalone page.
 *
 * @param {'original' | 'translated' | 'combined'} mode
 * @param {string | null} edition
 * @param {string} page
 * @returns {string}
 */
export function viewPath(mode, edition, page) {
  if (mode === 'original') {
    return page;
  }

  const base = mode === 'combined' ? `/combined/${edition}` : `/${edition}`;

  return page === '/' ? base : base + page;
}

/**
 * The inverse of viewPath. A first segment that names no edition is part of
 * an original page, which the router then fails to match.
 *
 * @param {string} pathname
 * @returns {{ mode: 'original' | 'translated' | 'combined', edition: string | null, page: string }}
 */
export function parseView(pathname) {
  // Rebuilt from segments, so a trailing slash is dropped.
  const segments = pathname.split('/').filter(Boolean);
  const combined = segments[0] === 'combined';
  const edition = combined ? segments[1] : segments[0];

  if (!Object.hasOwn(editions, edition ?? '')) {
    return { mode: 'original', edition: null, page: `/${segments.join('/')}` };
  }

  return {
    mode: combined ? 'combined' : 'translated',
    edition,
    page: `/${segments.slice(combined ? 2 : 1).join('/')}`,
  };
}

/**
 * Every prerendered page. Combined views repeat text indexed on their own
 * pages, so they are left out of search and the sitemap.
 *
 * @param {string[]} originalPages
 * @param {Record<string, string[]>} editionPages pages each edition has
 * @returns {{ path: string, indexed: boolean }[]}
 */
export function sitePages(originalPages, editionPages) {
  return [
    ...originalPages.map((path) => ({ path, indexed: true })),
    ...Object.entries(editionPages).flatMap(([edition, pages]) =>
      pages.flatMap((page) => [
        { path: viewPath('translated', edition, page), indexed: true },
        { path: viewPath('combined', edition, page), indexed: false },
      ]),
    ),
  ];
}
