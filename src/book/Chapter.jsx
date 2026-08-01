import { useOutletContext, useParams } from 'react-router';
import mapping from '../assets/generated/mapping_mk.json';
import originalChapters from '../assets/generated/original/chapters.json';
import translationChapters from '../assets/generated/translation_mk/chapters.json';
import { toArmenian } from '../shared/utils';
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
  const chapter = displayMode === 'original' ? original : translationChapters[chapterIndex];

  return (
    <article>
      <header className="flex flex-col items-center uppercase">
        <h1 className="chapter-heading">Բան {toArmenian(chapter.chapter)}</h1>
        {chapter.heading && (
          <h3 className="text-book-sm text-center">
            {chapter.heading.map((heading, headingIndex) => (
              <p key={headingIndex}>{heading}</p>
            ))}
          </h3>
        )}
      </header>
      {displayMode === 'combined'
        ? chapter.sections?.map((section, sectionIndex) => (
            <SectionCombined
              key={sectionIndex}
              number={sectionIndex + 1}
              translationLines={section}
              originalLines={original.sections[sectionIndex]}
              mapping={mapping[chapterIndex].sections[sectionIndex]}
            />
          ))
        : chapter.sections?.map((section, sectionIndex) => (
            <Section key={sectionIndex} number={sectionIndex + 1} lines={section} />
          ))}
    </article>
  );
}
