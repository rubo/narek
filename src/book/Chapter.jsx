// SPDX-License-Identifier: MIT

import { useOutletContext, useParams } from 'react-router';
import originalChapters from '../assets/generated/original/chapters.json';
import NotFound from '../NotFound';
import { toArmenian } from '../shared/utils';
import ChapterHeading from './ChapterHeading';
import FitHeading from './FitHeading';
import MissingTranslation from './MissingTranslation';
import Section from './Section';
import SectionCombined from './SectionCombined';

export default function Chapter() {
  const { number } = useParams();
  /** @type {{ displayMode: string, translation: object | null }} */
  const { displayMode, translation } = useOutletContext();

  const chapterIndex = originalChapters.findIndex((entry) => entry.chapter === Number(number));

  if (chapterIndex === -1) {
    return <NotFound />;
  }

  const original = originalChapters[chapterIndex];
  const translated = translation?.chapters.find((entry) => entry.chapter === original.chapter);
  const mapping = translation?.mapping[chapterIndex];

  // Only a typed URL gets here; the drawer and paging skip it.
  if (translation && !translated) {
    return (
      <article>
        <header className="flex flex-col items-center">
          <FitHeading className="heading">Բան {toArmenian(original.chapter)}</FitHeading>
        </header>
        <MissingTranslation />
      </article>
    );
  }

  const chapter = displayMode === 'original' ? original : translated;
  const hideNumber = chapter.sections?.length === 1;

  return (
    <article>
      <header className="flex flex-col items-center">
        <FitHeading className="heading">Բան {toArmenian(chapter.chapter)}</FitHeading>
        <ChapterHeading
          displayMode={displayMode}
          originalLines={original.heading}
          translationLines={translated?.heading}
          mapping={mapping?.heading}
        />
      </header>
      {displayMode === 'combined'
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
