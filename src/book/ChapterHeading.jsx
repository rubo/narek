// SPDX-License-Identifier: MIT

import CombinedHeading from './CombinedHeading';
import FitHeading from './FitHeading';

export default function ChapterHeading({ displayMode, originalLines, translationLines, mapping }) {
  let content;

  if (displayMode === 'combined') {
    content = (
      <CombinedHeading
        originalLines={originalLines}
        translationLines={translationLines}
        mapping={mapping}
      />
    );
  } else {
    const lines = displayMode === 'original' ? originalLines : translationLines;

    if (!lines) {
      return null;
    }

    content = lines.map((heading, headingIndex) => (
      <span key={headingIndex} className="mt-2 block first:mt-0">
        {heading}
      </span>
    ));
  }

  return (
    <FitHeading as="h2" className="subheading">
      {content}
    </FitHeading>
  );
}
