import { range } from '../shared/utils';

export default function HeadingCombined({
  originalLines,
  translationLines,
  mapping,
  as: Heading = 'h2',
  className = 'text-book-sm px-4 text-center',
}) {
  return (
    <Heading className={className}>
      {mapping.map((pair, pairIndex) => {
        if (pair.mode === 'line') {
          const origRange = range(pair.original[0], pair.original[1]);
          const transRange = range(pair.translation[0], pair.translation[1]);

          return origRange.map((lineNumber, lineIndex) => (
            <span key={lineNumber} className="mt-4 block first:mt-0">
              <span className="block">{originalLines[lineNumber]}</span>
              <span className="text-book-xs text-muted block">
                {translationLines[transRange[lineIndex]]}
              </span>
            </span>
          ));
        }

        if (pair.mode === 'block') {
          return (
            <span key={pairIndex} className="mt-4 block first:mt-0">
              {range(pair.original[0], pair.original[1]).map((lineNumber) => (
                <span key={lineNumber} className="mt-2 block first:mt-0">
                  {originalLines[lineNumber]}
                </span>
              ))}
              <span className="text-muted block">
                {range(pair.translation[0], pair.translation[1]).map((lineNumber) => (
                  <span key={lineNumber} className="text-book-xs mt-2 block first:mt-0">
                    {translationLines[lineNumber]}
                  </span>
                ))}
              </span>
            </span>
          );
        }

        // Unreachable: only validated mappings are emitted.
        throw new Error(`unexpected mapping mode: ${pair.mode}`);
      })}
    </Heading>
  );
}
