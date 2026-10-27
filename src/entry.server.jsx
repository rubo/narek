// SPDX-License-Identifier: MIT

import { prerender } from 'react-dom/static';
import { ServerRouter } from 'react-router';

// Build time only, so React's static prerender: it waits for all content.
export default async function handleRequest(request, status, headers, routerContext) {
  const { prelude } = await prerender(<ServerRouter context={routerContext} url={request.url} />, {
    onError(error) {
      // Fails the build rather than publishing a broken page.
      status = 500;
      console.error(error);
    },
  });

  headers.set('Content-Type', 'text/html');

  return new Response(prelude, { headers, status });
}
