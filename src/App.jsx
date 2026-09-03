// SPDX-License-Identifier: MIT

import './App.css';
import { useTheme } from '@heroui/react';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import Chapter from './book/Chapter';
import Colophon from './book/Colophon';
import Superscription from './book/Superscription';
import Layout from './Layout';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />} path="/">
      <Route element={<Superscription />} index />
      <Route element={<Chapter />} path="/chapter/:number" />
      <Route element={<Colophon />} path="/colophon" />
    </Route>,
  ),
);

export default function App() {
  useTheme('system');

  return <RouterProvider router={router} />;
}
