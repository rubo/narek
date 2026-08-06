import { Fragment } from 'react';
import { range, toArmenian } from '../shared/utils';

export default function SectionCombined({
  number,
  translationLines,
  originalLines,
  mapping,
  hideNumber,
}) {
  return (
    <section className="mt-6">
      {!hideNumber && <h3 className="text-center">{toArmenian(number)}</h3>}
      {mapping?.map((pair, pairIndex) => {
        if (pair.mode === 'line') {
          const origRange = range(pair.original[0], pair.original[1]);
          const transRange = range(pair.translation[0], pair.translation[1]);

          return origRange.map((lineNumber, lineIndex) => (
            <Fragment key={lineNumber}>
              <p className="mt-2 indent-2">{originalLines[lineNumber]}</p>
              <p className="text-muted text-book-sm indent-2">
                {translationLines[transRange[lineIndex]]}
              </p>
            </Fragment>
          ));
        } else if (pair.mode === 'block') {
          return (
            <Fragment key={pairIndex}>
              <section className="mt-2">
                {range(pair.original[0], pair.original[1]).map((lineNumber) => (
                  <p key={lineNumber} className="indent-2">
                    {originalLines[lineNumber]}
                  </p>
                ))}
              </section>
              {range(pair.translation[0], pair.translation[1]).map((lineNumber) => (
                <p key={lineNumber} className="text-muted text-book-sm indent-2">
                  {translationLines[lineNumber]}
                </p>
              ))}
            </Fragment>
          );
        }

        // Unreachable: only validated mappings are emitted.
        throw new Error(`unexpected mapping mode: ${pair.mode}`);
      })}
    </section>
  );
}
