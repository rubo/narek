// SPDX-License-Identifier: MIT

import { useLocation } from 'react-router';
import { editions, parseView, viewPath } from '../shared/views';

const siteUrl = import.meta.env.SITE_URL;

// The original's spelling, and the reformed one the translations use.
const titles = {
  original: 'Մատեան ողբերգութեան',
  translated: 'Մատյան ողբերգության',
};

/**
 * A page's title, description and canonical URL, hoisted by React into <head>.
 *
 * @param {{ mode: string, edition: string | null, name?: string, description: string }} props
 */
export default function PageMeta({ mode, edition, name, description }) {
  const { pathname } = useLocation();
  const book = mode === 'translated' ? titles.translated : titles.original;
  const qualifier =
    mode === 'original'
      ? ''
      : ` (${mode === 'combined' ? `Բնագիր + ${editions[edition]}` : editions[edition]})`;
  const title = name ? `${name}${qualifier} — ${book}` : `${book}${qualifier}`;
  // Rebuilt, because the prerenderer's pathname ends in a slash.
  const canonical = siteUrl && siteUrl + viewPath(mode, edition, parseView(pathname).page);

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {/* Combined views repeat text that is indexed on its own pages. */}
      {mode === 'combined' && <meta name="robots" content="noindex, follow" />}
      {canonical && <link rel="canonical" href={canonical} />}
    </>
  );
}
