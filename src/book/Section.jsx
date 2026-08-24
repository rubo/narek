import { toArmenian } from '../shared/utils';

export default function Section({ number, lines, paragraphs, hideNumber }) {
  return (
    <section className="mt-6">
      {!hideNumber && <h3 className="mb-3 text-center">{toArmenian(number)}</h3>}
      {paragraphs
        ? // Restore prose paragraphs without losing the line breaks.
          paragraphs.map((start, index) => (
            <p key={start} className="indent-2">
              {lines.slice(start, paragraphs[index + 1]).map((line, offset) => (
                <span key={offset}>{offset > 0 ? ` ${line}` : line}</span>
              ))}
            </p>
          ))
        : lines.map((line, index) => (
            <p key={index} className="indent-2">
              {line}
            </p>
          ))}
    </section>
  );
}
