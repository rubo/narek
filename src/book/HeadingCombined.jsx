import { Fragment } from 'react';
import { range } from '../shared/utils';

export default function HeadingCombined({ originalLines, translationLines, mapping }) {
  return (
    <h2 className="text-book-sm text-center">
      {mapping.map((pair, pairIndex) => {
        if (pair.mode === 'line') {
          const origRange = range(pair.original[0], pair.original[1]);
          const transRange = range(pair.translation[0], pair.translation[1]);

          return origRange.map((lineNumber, lineIndex) => (
            <Fragment key={lineNumber}>
              <span className="block">{originalLines[lineNumber]}</span>
              <span className="text-muted block">{translationLines[transRange[lineIndex]]}</span>
            </Fragment>
          ));
        }

        if (pair.mode === 'block') {
          return (
            <Fragment key={pairIndex}>
              {range(pair.original[0], pair.original[1]).map((lineNumber) => (
                <span key={lineNumber} className="block">
                  {originalLines[lineNumber]}
                </span>
              ))}
              {range(pair.translation[0], pair.translation[1]).map((lineNumber) => (
                <span key={lineNumber} className="text-muted block">
                  {translationLines[lineNumber]}
                </span>
              ))}
            </Fragment>
          );
        }

        // Unreachable: only validated mappings are emitted.
        throw new Error(`unexpected mapping mode: ${pair.mode}`);
      })}
    </h2>
  );
}
