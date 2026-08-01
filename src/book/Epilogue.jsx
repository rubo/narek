import epilogue from '../assets/generated/original/epilogue.json';

export default function Epilogue() {
  return (
    <article>
      <h1 className="chapter-heading">{epilogue.heading}</h1>
      {epilogue.content.map((text, index) => (
        <p key={index} className="mb-3 text-justify indent-6 last:mb-0">
          {text}
        </p>
      ))}
    </article>
  );
}
