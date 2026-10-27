// SPDX-License-Identifier: MIT

import { Button, IconChevronRight } from '@heroui/react';
import { useNavigate } from 'react-router';

// Ruled lines of a leaf whose text is lost, ragged where it tore away.
const ruling = ['90%', '100%', '72%', '100%', '64%', '48%', '32%'];

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <article className="w-full max-w-xl text-center">
      <title>Բան չկա — Մատեան ողբերգութեան</title>
      <h1 className="font-serif text-2xl uppercase">Բան չկա</h1>
      <div aria-hidden="true" className="my-12 flex flex-col gap-4">
        {ruling.map((width, index) => (
          <div key={index} className="bg-border h-px" style={{ width }} />
        ))}
      </div>
      <Button variant="tertiary" onClick={() => navigate('/')}>
        Բայց կան մնացած ՂԵ բաները
        <IconChevronRight />
      </Button>
    </article>
  );
}
