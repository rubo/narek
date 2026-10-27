// SPDX-License-Identifier: MIT

import { summarize } from '../shared/utils';
import CombinedHeading from './CombinedHeading';
import { loadPage } from './corpus.server';
import FitHeading from './FitHeading';
import PageMeta from './PageMeta';
import SectionCombined from './SectionCombined';

export function loader(args) {
  return loadPage(args, 'colophon');
}

export default function Colophon({ loaderData }) {
  const { mode, edition, original, translated, mapping } = loaderData;
  const colophon = mode === 'original' ? original : translated;

  return (
    <article>
      <PageMeta
        mode={mode}
        edition={edition}
        name={colophon.heading}
        description={summarize(colophon.content)}
      />
      {mode === 'combined' ? (
        <>
          <FitHeading className="heading">
            <CombinedHeading
              originalLines={[original.heading]}
              translationLines={[translated.heading]}
              mapping={mapping.heading}
            />
          </FitHeading>
          <SectionCombined
            hideNumber
            originalLines={original.content}
            translationLines={translated.content}
            mapping={mapping.content}
          />
        </>
      ) : (
        <>
          <FitHeading className="heading">{colophon.heading}</FitHeading>
          {colophon.content.map((text, index) => (
            <p key={index} className="mb-3 indent-2 last:mb-0 md:text-justify md:indent-6">
              {text}
            </p>
          ))}
        </>
      )}
    </article>
  );
}
