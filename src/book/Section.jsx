import { toArmenian } from '../shared/utils';

export default function Section({ number, lines }) {
  return (
    <section className="text-book-lg mt-6">
      <h4 className="mb-2 text-center">{toArmenian(number)}</h4>
      {lines.map((line, index) => (
        <p key={index} className="indent-2">
          {line}
        </p>
      ))}
    </section>
  );
}
