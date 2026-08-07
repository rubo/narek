import superscription from '../assets/generated/original/superscription.json';

export default function Superscription() {
  return (
    <article className="text-center">
      <h1 className="chapter-heading">{superscription.heading}</h1>
      {superscription.content.map((text, index) => (
        <p key={index} className="indent-2">
          {text}
        </p>
      ))}
    </article>
  );
}
