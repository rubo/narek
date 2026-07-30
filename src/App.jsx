import './App.css';
import { useTheme } from '@heroui/react';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import Chapter from './book/Chapter';
import Epilogue from './book/Epilogue';
import Prologue from './book/Prologue';
import Layout from './Layout';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />} path="/">
      <Route element={<Prologue />} index />
      <Route element={<Chapter />} path="/chapter/:number" />
      <Route element={<Epilogue />} path="/epilogue" />
    </Route>,
  ),
);

export default function App() {
  useTheme('system');

  return <RouterProvider router={router} />;
}
