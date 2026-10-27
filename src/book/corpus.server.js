// SPDX-License-Identifier: MIT

// Read only by route loaders at build time. The .server suffix keeps the corpus
// out of the client bundle; the browser gets it one page at a time.

import { data } from 'react-router';
import { editions, parseView } from '../shared/views';

const generated = import.meta.glob('../assets/generated/**/*.json', {
  eager: true,
  import: 'default',
});

function read(name) {
  return generated[`../assets/generated/${name}.json`];
}

const pages = read('pages');
const originalChapters = read('original/chapters');
const original = {
  superscription: read('original/superscription'),
  colophon: read('original/colophon'),
};

// Undefined where the edition lacks the page.
function translatedPage(id, name) {
  const text = read(`translation_${id}/${name}`);

  return text && { text, mapping: read(`mapping_${id}/${name}`) };
}

// `mapping` follows the original's chapters, with null where the edition lacks
// one.
const translations = Object.fromEntries(
  Object.keys(editions).map((id) => [
    id,
    {
      chapters: read(`translation_${id}/chapters`),
      mapping: read(`mapping_${id}`),
      superscription: translatedPage(id, 'superscription'),
      colophon: translatedPage(id, 'colophon'),
    },
  ]),
);

function notFound() {
  return data(null, { status: 404 });
}

// What the drawer lists, the same on every page.
export function loadNavigation() {
  const labelsOf = (superscription, colophon) => ({
    superscription: superscription?.content[0],
    colophon: colophon?.heading,
  });

  return {
    chapters: originalChapters.map(({ chapter }) => chapter),
    pages: Object.fromEntries(Object.keys(editions).map((id) => [id, pages[id]])),
    labels: {
      original: labelsOf(original.superscription, original.colophon),
      ...Object.fromEntries(
        Object.entries(translations).map(([id, t]) => [
          id,
          labelsOf(t.superscription?.text, t.colophon?.text),
        ]),
      ),
    },
  };
}

// The view's translation, or a 404 for an edition the URL names wrongly.
function viewOf(url, params) {
  const { mode, edition } = parseView(url.pathname);

  // parseView reads an unknown edition as part of an original page.
  if (params.edition !== undefined && mode === 'original') {
    throw notFound();
  }

  return { mode, edition, translation: edition ? translations[edition] : null };
}

/**
 * Only what the view shows: the original, the translation, or both with the
 * mapping between them.
 *
 * @param {{ url: URL, params: Record<string, string | undefined> }} args
 */
export function loadChapter({ url, params }) {
  const index = originalChapters.findIndex(({ chapter }) => chapter === Number(params.number));

  if (index === -1) {
    throw notFound();
  }

  const { mode, edition, translation } = viewOf(url, params);
  const chapter = originalChapters[index];

  if (mode === 'original') {
    return { mode, edition, original: chapter };
  }

  const translated = translation.chapters.find((entry) => entry.chapter === chapter.chapter);

  if (!translated) {
    throw notFound();
  }

  if (mode === 'translated') {
    return { mode, edition, translated };
  }

  return { mode, edition, original: chapter, translated, mapping: translation.mapping[index] };
}

/**
 * A standalone page, shaped like loadChapter's result.
 *
 * @param {{ url: URL, params: Record<string, string | undefined> }} args
 * @param {'superscription' | 'colophon'} name
 */
export function loadPage({ url, params }, name) {
  const { mode, edition, translation } = viewOf(url, params);

  if (mode === 'original') {
    return { mode, edition, original: original[name] };
  }

  const page = translation[name];

  if (!page) {
    throw notFound();
  }

  if (mode === 'translated') {
    return { mode, edition, translated: page.text };
  }

  return { mode, edition, original: original[name], translated: page.text, mapping: page.mapping };
}
