import prologue from '../assets/generated/original/prologue.json';

export default function Prologue() {
  return (
    <article className="text-center uppercase">
      <h1 className="chapter-heading">{prologue.heading}</h1>
      {prologue.content.map((text, index) => (
        <p key={index} className="indent-2">
          {text}
        </p>
      ))}
    </article>
  );
}
