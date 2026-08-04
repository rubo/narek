import { toArmenian } from '../shared/utils';

export default function Section({ number, lines, hideNumber }) {
  return (
    <section className="mt-6">
      {!hideNumber && <h3 className="mb-2 text-center">{toArmenian(number)}</h3>}
      {lines.map((line, index) => (
        <p key={index} className="indent-2">
          {line}
        </p>
      ))}
    </section>
  );
}
