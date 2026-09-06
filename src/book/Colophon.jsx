// SPDX-License-Identifier: MIT

import { useOutletContext } from 'react-router';
import mapping from '../assets/generated/mapping_mk/colophon.json';
import original from '../assets/generated/original/colophon.json';
import translation from '../assets/generated/translation_mk/colophon.json';
import CombinedHeading from './CombinedHeading';
import FitHeading from './FitHeading';
import SectionCombined from './SectionCombined';

export default function Colophon() {
  /** @type {{ displayMode: string }} */
  const { displayMode } = useOutletContext();
  const colophon = displayMode === 'original' ? original : translation;

  return (
    <article>
      {displayMode === 'combined' ? (
        <>
          <FitHeading className="heading">
            <CombinedHeading
              originalLines={[original.heading]}
              translationLines={[translation.heading]}
              mapping={mapping.heading}
            />
          </FitHeading>
          <SectionCombined
            hideNumber
            originalLines={original.content}
            translationLines={translation.content}
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
