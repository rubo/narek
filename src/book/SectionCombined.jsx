import { Fragment } from 'react';
import { range, toArmenian } from '../shared/utils';

export default function SectionCombined({ number, translationLines, originalLines, mapping }) {
  return (
    <section className="mt-6">
      <h4 className="text-center">{toArmenian(number)}</h4>
      {mapping?.map((block, blockIndex) => {
        if (block.mode === 'line') {
          // TODO: handle unequal original and translation ranges
          const origRange = range(block.original[0], block.original[1]);
          const transRange = range(block.translation[0], block.translation[1]);

          return origRange.map((lineNumber, lineIndex) => (
            <Fragment key={lineNumber}>
              <p className="mt-2 indent-2">{originalLines[lineNumber]}</p>
              <p className="text-muted text-book-base indent-2">
                {translationLines[transRange[lineIndex]]}
              </p>
            </Fragment>
          ));
        } else if (block.mode === 'group') {
          return (
            <Fragment key={blockIndex}>
              <section className="mt-2">
                {range(block.original[0], block.original[1]).map((lineNumber) => (
                  <p key={lineNumber} className="indent-2">
                    {originalLines[lineNumber]}
                  </p>
                ))}
              </section>
              {range(block.translation[0], block.translation[1]).map((lineNumber) => (
                <p key={lineNumber} className="text-muted text-book-base indent-2">
                  {translationLines[lineNumber]}
                </p>
              ))}
            </Fragment>
          );
        }

        return <section key={blockIndex}>TODO: Թարգմանությունը բացակայում է</section>;
      })}
    </section>
  );
}
