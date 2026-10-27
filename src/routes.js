// SPDX-License-Identifier: MIT

import { index, layout, prefix, route } from '@react-router/dev/routes';

// Every page in each view: the original at the root, a translation under its
// edition, and the two side by side under /combined. Paths must agree with
// viewPath in shared/views.js.
const views = [
  ['original', ''],
  ['translated', ':edition'],
  ['combined', 'combined/:edition'],
];

export default [
  layout(
    'Layout.jsx',
    views.flatMap(([view, path]) =>
      prefix(path, [
        index('book/Superscription.jsx', { id: `${view}/superscription` }),
        route('chapter/:number', 'book/Chapter.jsx', { id: `${view}/chapter` }),
        route('colophon', 'book/Colophon.jsx', { id: `${view}/colophon` }),
      ]),
    ),
  ),
];
