import colophon from '../assets/generated/original/colophon.json';

export default function Colophon() {
  return (
    <article>
      <h1 className="chapter-heading">{colophon.heading}</h1>
      {colophon.content.map((text, index) => (
        <p key={index} className="mb-3 indent-2 last:mb-0 md:text-justify md:indent-6">
          {text}
        </p>
      ))}
    </article>
  );
}
