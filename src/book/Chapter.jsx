// SPDX-License-Identifier: MIT

import { useOutletContext, useParams } from 'react-router';
import mapping from '../assets/generated/mapping_mk.json';
import originalChapters from '../assets/generated/original/chapters.json';
import translationChapters from '../assets/generated/translation_mk/chapters.json';
import { toArmenian } from '../shared/utils';
import ChapterHeading from './ChapterHeading';
import FitHeading from './FitHeading';
import Section from './Section';
import SectionCombined from './SectionCombined';

export default function Chapter() {
  const { number } = useParams();
  /** @type {{ displayMode: string }} */
  const { displayMode } = useOutletContext();

  const chapterIndex = originalChapters.findIndex((entry) => entry.chapter === Number(number));

  if (chapterIndex === -1) {
    return (
      <article className="max-w-xl text-center">
        <h1>TODO</h1>
      </article>
    );
  }

  const original = originalChapters[chapterIndex];
  const translation = translationChapters[chapterIndex];
  const chapter = displayMode === 'original' ? original : translation;
  const hideNumber = chapter.sections?.length === 1;

  return (
    <article>
      <header className="flex flex-col items-center">
        <FitHeading className="heading">Բան {toArmenian(chapter.chapter)}</FitHeading>
        <ChapterHeading
          displayMode={displayMode}
          originalLines={original.heading}
          translationLines={translation.heading}
          mapping={mapping[chapterIndex].heading}
        />
      </header>
      {displayMode === 'combined'
        ? chapter.sections?.map((section, sectionIndex) => (
            <SectionCombined
              key={sectionIndex}
              number={sectionIndex + 1}
              translationLines={section}
              originalLines={original.sections[sectionIndex]}
              mapping={mapping[chapterIndex].sections[sectionIndex]}
              hideNumber={hideNumber}
            />
          ))
        : chapter.sections?.map((section, sectionIndex) => (
            <Section
              key={sectionIndex}
              number={sectionIndex + 1}
              lines={section}
              paragraphs={chapter.prose?.[sectionIndex]}
              hideNumber={hideNumber}
            />
          ))}
    </article>
  );
}
