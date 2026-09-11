// SPDX-License-Identifier: MIT

import { useOutletContext } from 'react-router';
import mapping from '../assets/generated/mapping_mk/superscription.json';
import original from '../assets/generated/original/superscription.json';
import translation from '../assets/generated/translation_mk/superscription.json';
import SectionCombined from './SectionCombined';

export default function Superscription() {
  /** @type {{ displayMode: string }} */
  const { displayMode } = useOutletContext();
  const superscription = displayMode === 'original' ? original : translation;

  return (
    <article className="mt-12 text-center">
      {displayMode === 'combined' ? (
        <SectionCombined
          hideNumber
          originalLines={original.content}
          translationLines={translation.content}
          mapping={mapping.content}
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
