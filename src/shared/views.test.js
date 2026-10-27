// SPDX-License-Identifier: MIT

// Every URL the app links to must be one that was prerendered, and the
// loaders read the view back from the URL, so the two directions must agree.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseView, sitePages, viewPath } from './views.js';

const pages = ['/', '/chapter/1', '/colophon'];

test('parseView reads back every path viewPath builds', () => {
  for (const page of pages) {
    assert.deepEqual(parseView(viewPath('original', null, page)), {
      mode: 'original',
      edition: null,
      page,
    });

    for (const mode of ['translated', 'combined']) {
      assert.deepEqual(parseView(viewPath(mode, 'mk', page)), { mode, edition: 'mk', page });
    }
  }
});

test('parseView ignores a trailing slash', () => {
  assert.deepEqual(parseView('/combined/mk/chapter/1/'), {
    mode: 'combined',
    edition: 'mk',
    page: '/chapter/1',
  });
  assert.equal(parseView('/chapter/1/').page, '/chapter/1');
});

test('parseView reads an unknown edition as an original page', () => {
  assert.deepEqual(parseView('/xx/chapter/1'), {
    mode: 'original',
    edition: null,
    page: '/xx/chapter/1',
  });
  assert.equal(parseView('/combined').mode, 'original');
});

test('sitePages indexes the original and translations but not combined views', () => {
  const site = sitePages(pages, { vg: ['/chapter/1'] });

  assert.deepEqual(site, [
    { path: '/', indexed: true },
    { path: '/chapter/1', indexed: true },
    { path: '/colophon', indexed: true },
    { path: '/vg/chapter/1', indexed: true },
    { path: '/combined/vg/chapter/1', indexed: false },
  ]);
});
