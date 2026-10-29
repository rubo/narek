// SPDX-License-Identifier: MIT

import { useLocation } from 'react-router';
import { editions, parseView, siteUrl, viewPath } from '../shared/views';

// The original's spelling, and the reformed one the translations use.
const titles = {
  original: 'Մատեան ողբերգութեան',
  translated: 'Մատյան ողբերգության',
};

// Link previews fetch the image on their own, so its URL is absolute.
const image = `${siteUrl}/og-image.jpg`;

/**
 * A page's title, description, canonical URL and link-preview tags, hoisted
 * by React into <head>.
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
  const canonical = siteUrl + viewPath(mode, edition, parseView(pathname).page);

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {/* Combined views repeat text that is indexed on its own pages. */}
      {mode === 'combined' && <meta name="robots" content="noindex, follow" />}
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={book} />
      <meta property="og:locale" content="hy_AM" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
    </>
  );
}
