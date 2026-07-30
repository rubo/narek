import { useOutletContext } from 'react-router';
import prologue from '../assets/generated/original/prologue.json';
import { scaleClasses } from './scale';

export default function Prologue() {
  /** @type {{ fontScale: string }} */
  const { fontScale } = useOutletContext();

  return (
    <article
      className={`text-book-lg max-w-xl text-center font-serif uppercase ${scaleClasses[fontScale]}`}
    >
      <h1 className="text-book-2xl mb-6 text-center">{prologue.heading}</h1>
      {prologue.content.map((text, index) => (
        <p key={index} className="indent-2">
          {text}
        </p>
      ))}
    </article>
  );
}
