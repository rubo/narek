import { useOutletContext, useParams } from 'react-router';
import mapping from '../assets/generated/mapping_mk.json';
import originalChapters from '../assets/generated/original/chapters.json';
import translationChapters from '../assets/generated/translation_mk/chapters.json';
import { toArmenian } from '../shared/utils';
import HeadingCombined from './HeadingCombined';
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
        <h1 className="chapter-heading">Բան {toArmenian(chapter.chapter)}</h1>
        {displayMode === 'combined' ? (
          <HeadingCombined
            originalLines={original.heading}
            translationLines={translation.heading}
            mapping={mapping[chapterIndex].heading}
          />
        ) : (
          chapter.heading && (
            <h2 className="text-book-sm px-4 text-center">
              {chapter.heading.map((heading, headingIndex) => (
                <span key={headingIndex} className="mt-2 block first:mt-0">
                  {heading}
                </span>
              ))}
            </h2>
          )
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
