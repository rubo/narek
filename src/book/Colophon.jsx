import colophon from '../assets/generated/original/colophon.json';

export default function Colophon() {
  return (
    <article>
      <h1 className="chapter-heading">{colophon.heading}</h1>
      {colophon.content.map((text, index) => (
        <p key={index} className="mb-3 text-justify indent-6 last:mb-0">
          {text}
        </p>
      ))}
    </article>
  );
}
