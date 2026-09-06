// SPDX-License-Identifier: MIT

import { useOutletContext } from 'react-router';
import mapping from '../assets/generated/mapping_mk/superscription.json';
import original from '../assets/generated/original/superscription.json';
import translation from '../assets/generated/translation_mk/superscription.json';
import CombinedHeading from './CombinedHeading';
import FitHeading from './FitHeading';
import SectionCombined from './SectionCombined';

export default function Superscription() {
  /** @type {{ displayMode: string }} */
  const { displayMode } = useOutletContext();
  const superscription = displayMode === 'original' ? original : translation;

  return (
    <article className="text-center">
      {displayMode === 'combined' ? (
        <>
          <FitHeading className="heading">
            <CombinedHeading
              originalLines={[original.heading]}
              translationLines={[translation.heading]}
              mapping={mapping.heading}
              translationClassName="heading-translation"
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
          <FitHeading className="heading">{superscription.heading}</FitHeading>
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
