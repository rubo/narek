// SPDX-License-Identifier: MIT

import { summarize } from '../shared/utils';
import { loadPage } from './corpus.server';
import PageMeta from './PageMeta';
import SectionCombined from './SectionCombined';

export function loader(args) {
  return loadPage(args, 'superscription');
}

export default function Superscription({ loaderData }) {
  const { mode, edition, original, translated, mapping } = loaderData;
  const superscription = mode === 'original' ? original : translated;

  return (
    <article className="mt-12 text-center">
      <PageMeta
        mode={mode}
        edition={edition}
        // The home page names the author, as the original title page does.
        description={
          mode === 'original'
            ? 'Գրիգորի Նարեկայ վանից վանականի մատեան ողբերգութեան'
            : summarize(superscription.content)
        }
      />
      {mode === 'combined' ? (
        <SectionCombined
          hideNumber
          originalLines={original.content}
          translationLines={translated.content}
          mapping={mapping.content}
        />
      ) : (
        <>
          {superscription.content.map((text, index) => (
            <p key={index} className="indent-2">
              {text}
            </p>
          ))}
        </>
      )}
    </article>
  );
}
