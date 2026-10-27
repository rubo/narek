// SPDX-License-Identifier: MIT

import './index.css';
import './App.css';
import { useTheme } from '@heroui/react';
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts } from 'react-router';
import NotFound from './NotFound';

// A glob, not an import: the font is not committed, and CI builds without it.
const fonts = import.meta.glob('./assets/fonts/artarumian-grqi-nor-regular.v3.woff2', {
  eager: true,
  import: 'default',
  query: '?url',
});

// Applies the reader's theme and font scale before the first paint, mirroring
// HeroUI's useTheme('system') and Layout's font-scale store.
const prePaint = `
try {
  var root = document.documentElement;
  var theme = localStorage.getItem('heroui-theme') || 'system';

  if (theme === 'system') {
    theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  root.classList.add(theme);
  root.setAttribute('data-theme', theme);

  var scale = localStorage.getItem('fontScale');

  if (scale) {
    root.setAttribute('data-font-scale', scale);
  }
} catch (error) {}
`;

export function Layout({ children }) {
  // Here, not in App, so the error page keeps the theme when <html> re-renders.
  useTheme('system');

  return (
    <html lang="hy" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="theme-color"
          content="oklch(96.5% 0.018 90)"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="oklch(15% 0.024 66)"
          media="(prefers-color-scheme: dark)"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        {Object.values(fonts).map((href) => (
          <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="" />
        ))}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: prePaint }} />
        <Meta />
        <Links />
      </head>
      <body className="bg-background text-foreground px-4 py-8">
        <div id="root" className="flex flex-col items-center">
          {children}
        </div>
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

// Shown only on 404.html.
export function HydrateFallback() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <img alt="Բեռնվում է…" className="size-16" src="/spinner.svg" />
      <noscript className="max-w-[40rem] p-8 font-sans">
        JavaScript-ն անջատված է։ Միացրեք այն կամ փորձեք այլ բրաուզեր։
      </noscript>
    </div>
  );
}

export function ErrorBoundary({ error }) {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFound />;
  }

  return (
    <article className="max-w-xl text-center">
      <h1>{isRouteErrorResponse(error) ? error.status : 'Error'}</h1>
    </article>
  );
}
