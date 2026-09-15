// SPDX-License-Identifier: MIT

import { useOutletContext } from 'react-router';
import original from '../assets/generated/original/colophon.json';
import CombinedHeading from './CombinedHeading';
import FitHeading from './FitHeading';
import SectionCombined from './SectionCombined';

export default function Colophon() {
  /** @type {{ displayMode: string, translation: object | null }} */
  const { displayMode, translation } = useOutletContext();
  const translated = translation?.colophon;
  const colophon = displayMode === 'original' ? original : translated.text;

  return (
    <article>
      {displayMode === 'combined' ? (
        <>
          <FitHeading className="heading">
            <CombinedHeading
              originalLines={[original.heading]}
              translationLines={[translated.text.heading]}
              mapping={translated.mapping.heading}
            />
          </FitHeading>
          <SectionCombined
            hideNumber
            originalLines={original.content}
            translationLines={translated.text.content}
            mapping={translated.mapping.content}
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
