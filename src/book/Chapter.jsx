// SPDX-License-Identifier: MIT

import { summarize, toArmenian } from '../shared/utils';
import ChapterHeading from './ChapterHeading';
import { loadChapter } from './corpus.server';
import FitHeading from './FitHeading';
import PageMeta from './PageMeta';
import Section from './Section';
import SectionCombined from './SectionCombined';

export function loader(args) {
  return loadChapter(args);
}

export default function Chapter({ loaderData }) {
  const { mode, edition, original, translated, mapping } = loaderData;
  const chapter = mode === 'original' ? original : translated;
  const hideNumber = chapter.sections?.length === 1;
  // The text the page leads with; an untranslated section is null.
  const shown = mode === 'translated' ? translated : original;
  const opening = shown.sections.find(Boolean) ?? [];

  return (
    <article>
      <PageMeta
        mode={mode}
        edition={edition}
        name={`Բան ${toArmenian(chapter.chapter)}`}
        description={summarize([...shown.heading, ...opening])}
      />
      <header className="flex flex-col items-center">
        <FitHeading className="heading">Բան {toArmenian(chapter.chapter)}</FitHeading>
        <ChapterHeading
          displayMode={mode}
          originalLines={original?.heading}
          translationLines={translated?.heading}
          mapping={mapping?.heading}
        />
      </header>
      {mode === 'combined'
        ? chapter.sections?.map((section, sectionIndex) => (
            <SectionCombined
              key={sectionIndex}
              number={sectionIndex + 1}
              translationLines={section}
              originalLines={original.sections[sectionIndex]}
              mapping={mapping.sections[sectionIndex]}
              hideNumber={hideNumber}
            />
          ))
        : chapter.sections?.map((section, sectionIndex) =>
            section ? (
              <Section
                key={sectionIndex}
                number={sectionIndex + 1}
                lines={section}
                paragraphs={chapter.prose?.[sectionIndex]}
                hideNumber={hideNumber}
              />
            ) : null,
          )}
    </article>
  );
}
