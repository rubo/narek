import { useOutletContext } from 'react-router';
import mapping from '../assets/generated/mapping_mk/superscription.json';
import original from '../assets/generated/original/superscription.json';
import translation from '../assets/generated/translation_mk/superscription.json';
import HeadingCombined from './HeadingCombined';
import SectionCombined from './SectionCombined';

export default function Superscription() {
  /** @type {{ displayMode: string }} */
  const { displayMode } = useOutletContext();
  const superscription = displayMode === 'original' ? original : translation;

  return (
    <article className="text-center">
      {displayMode === 'combined' ? (
        <>
          <HeadingCombined
            as="h1"
            className="chapter-heading"
            originalLines={[original.heading]}
            translationLines={[translation.heading]}
            mapping={mapping.heading}
          />
          <SectionCombined
            hideNumber
            originalLines={original.content}
            translationLines={translation.content}
            mapping={mapping.content}
          />
        </>
      ) : (
        <>
          <h1 className="chapter-heading">{superscription.heading}</h1>
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
