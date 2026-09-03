// SPDX-License-Identifier: MIT

import { useOutletContext } from 'react-router';
import mapping from '../assets/generated/mapping_mk/colophon.json';
import original from '../assets/generated/original/colophon.json';
import translation from '../assets/generated/translation_mk/colophon.json';
import HeadingCombined from './HeadingCombined';
import SectionCombined from './SectionCombined';

export default function Colophon() {
  /** @type {{ displayMode: string }} */
  const { displayMode } = useOutletContext();
  const colophon = displayMode === 'original' ? original : translation;

  return (
    <article>
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
          <h1 className="chapter-heading">{colophon.heading}</h1>
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
