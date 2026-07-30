import { useOutletContext } from 'react-router';
import epilogue from '../assets/generated/original/epilogue.json';
import { scaleClasses } from './scale';

export default function Epilogue() {
  /** @type {{ fontScale: string }} */
  const { fontScale } = useOutletContext();

  return (
    <article className={`text-book-lg max-w-xl font-serif ${scaleClasses[fontScale]}`}>
      <h1 className="text-book-2xl mb-6 px-12 text-center uppercase lg:px-0">{epilogue.heading}</h1>
      {epilogue.content.map((text, index) => (
        <p key={index} className="mb-3 text-justify indent-6 last:mb-0">
          {text}
        </p>
      ))}
    </article>
  );
}
