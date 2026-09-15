// SPDX-License-Identifier: MIT

import { useOutletContext } from 'react-router';
import original from '../assets/generated/original/superscription.json';
import SectionCombined from './SectionCombined';

export default function Superscription() {
  /** @type {{ displayMode: string, translation: object | null }} */
  const { displayMode, translation } = useOutletContext();
  const translated = translation?.superscription;
  const superscription = displayMode === 'original' ? original : translated.text;

  return (
    <article className="mt-12 text-center">
      {displayMode === 'combined' ? (
        <SectionCombined
          hideNumber
          originalLines={original.content}
          translationLines={translated.text.content}
          mapping={translated.mapping.content}
        />
      ) : (
        <>
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
