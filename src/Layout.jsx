// SPDX-License-Identifier: MIT

import {
  Button,
  ButtonGroup,
  Description,
  Drawer,
  Dropdown,
  IconChevronLeft,
  IconChevronRight,
  Label,
  Link,
  ListBox,
  Separator,
} from '@heroui/react';
import { useOverlayState } from '@heroui/react';
import { useLayoutEffect, useRef, useState, useSyncExternalStore, ViewTransition } from 'react';
import { Outlet, useLocation, useNavigate, useNavigationType } from 'react-router';
import { loadNavigation } from './book/corpus.server';
import { toArmenian } from './shared/utils';
import { editions, parseView, viewPath } from './shared/views';

export function loader() {
  return loadNavigation();
}

// On 404.html, which has no data, this requests it and so fails as a 404.
export function clientLoader({ serverLoader }) {
  return serverLoader();
}

// The same on every page, so client navigation never refetches it.
export function shouldRevalidate() {
  return false;
}

// Dropdown keys: `<mode>-<edition>`, or `original`.
const defaultView = 'original';

const fontScales = ['sm', 'base', 'lg'];
const defaultFontScale = 'base';

// The pre-paint script in root.jsx restores data-font-scale, so the attribute
// is the store and hydration sees the default.
const fontScaleListeners = new Set();

function subscribeFontScale(listener) {
  fontScaleListeners.add(listener);
  return () => fontScaleListeners.delete(listener);
}

function getFontScale() {
  const scale = document.documentElement.dataset.fontScale;
  return fontScales.includes(scale) ? scale : defaultFontScale;
}

function getServerFontScale() {
  return defaultFontScale;
}

function setFontScale(value) {
  document.documentElement.dataset.fontScale = value;
  localStorage.setItem('fontScale', value);

  for (const listener of fontScaleListeners) {
    listener();
  }
}

// The file React Router fetches when navigating to a page. PrefetchPageLinks
// would add a ?_routes= that navigation without SSR never sends.
function dataPath(page) {
  return page.endsWith('/') ? `${page}_.data` : `${page}.data`;
}

// HeroUI's ItemIndicator checkmark, reused so the font-scale buttons show the
// same mark as the drawer's list selection (an icon-font glyph would not match).
function CheckIcon(props) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 17 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="1 9 7 14 15 4" />
    </svg>
  );
}

export default function Layout({ loaderData }) {
  const { chapters, pages, labels } = loaderData;
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const drawerState = useOverlayState({
    defaultOpen: false,
  });
  const [hovered, setHovered] = useState(null);
  const hoverTimer = useRef(null);

  const fontScale = useSyncExternalStore(subscribeFontScale, getFontScale, getServerFontScale);

  const handleFontScaleChange = (value) => {
    setFontScale(value);
    drawerState.close();
  };

  // `page` is the path in the original, so the drawer works the same in
  // every view.
  const { mode, edition, page } = parseView(location.pathname);
  const selectedView = mode === 'original' ? defaultView : `${mode}-${edition}`;
  const drawerLabels = mode === 'translated' ? labels[edition] : labels.original;
  const superscriptionLabel = drawerLabels.superscription ?? labels.original.superscription;
  const colophonLabel = drawerLabels.colophon ?? labels.original.colophon;
  // Every path the drawer lists; anything else selects nothing.
  const paths = ['/', ...chapters.map((chapter) => `/chapter/${chapter}`), '/colophon'];
  // Rows for a translation that lacks this page.
  const disabledViews = Object.keys(editions)
    .filter((id) => !pages[id].includes(page))
    .flatMap((id) => [`translated-${id}`, `combined-${id}`]);
  // Pages the chosen translation lacks.
  const disabledPaths = edition ? paths.filter((path) => !pages[edition].includes(path)) : [];
  const selectedKeys = paths.includes(page) ? [page] : [];

  useLayoutEffect(() => {
    // Leave initial loads and history navigation to browser scroll restoration.
    if (navigationType === 'POP') {
      return;
    }

    // Reset between the old and new snapshots, before the transition is painted.
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname, navigationType]);

  // Keep the view when moving between pages.
  const goTo = (target) => {
    navigate(viewPath(mode, edition, target));
  };

  const pageable = chapters.filter((chapter) => !disabledPaths.includes(`/chapter/${chapter}`));

  // Keyed by path, so the route drives the selection.
  const current = chapters.find((chapter) => `/chapter/${chapter}` === page);

  // By number, so a chapter the translation lacks still has neighbours.
  let previous = current ? pageable.findLast((chapter) => chapter < current) : null;
  let next = current ? pageable.find((chapter) => chapter > current) : null;

  // The superscription and colophon lead into the chapters, not back out.
  if (page === '/') {
    next = pageable[0];
  }

  if (page === '/colophon') {
    previous = pageable.at(-1);
  }

  // Loaded in the background, so moving to them is instant.
  const prefetched = new Set(
    [previous && `/chapter/${previous}`, next && `/chapter/${next}`, hovered].filter(
      (target) => target && target !== page,
    ),
  );

  // Delayed, so sweeping the pointer down the drawer prefetches nothing.
  const prefetchOnHover = (target) => ({
    onHoverStart: () => {
      hoverTimer.current = setTimeout(() => setHovered(target), 100);
    },
    onHoverEnd: () => clearTimeout(hoverTimer.current),
  });

  const handleChapterChange = (keys) => {
    const value = keys.values().next().value;

    if (value) {
      drawerState.close();
      goTo(String(value));
    }
  };

  const handleDisplayChange = (keys) => {
    const value = keys.values().next().value;

    if (!value) {
      return;
    }

    const [nextMode, nextEdition = null] = String(value).split('-');

    // Switching the view is not a navigation step.
    navigate(viewPath(nextMode, nextEdition, page), { replace: true });
  };

  return (
    <>
      <Drawer state={drawerState}>
        <Button
          variant="tertiary"
          isIconOnly
          className="fixed top-4 left-4 shadow-lg"
          aria-label="Բովանդակություն"
        >
          <span className="material-symbols-outlined">menu</span>
        </Button>
        <Drawer.Backdrop>
          <Drawer.Content placement="left">
            <Drawer.Dialog>
              <Drawer.Header>
                <Drawer.Heading>Բովանդակություն</Drawer.Heading>
              </Drawer.Header>
              <Drawer.Body>
                <ListBox
                  autoFocus
                  selectionMode="single"
                  disabledKeys={disabledPaths}
                  selectedKeys={selectedKeys}
                  onSelectionChange={handleChapterChange}
                  aria-label="Բովանդակություն"
                >
                  <ListBox.Item id="/" textValue={superscriptionLabel} {...prefetchOnHover('/')}>
                    <Label>{superscriptionLabel}</Label>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  {chapters.map((chapter) => (
                    <ListBox.Item
                      key={chapter}
                      id={`/chapter/${chapter}`}
                      textValue={`Բան ${toArmenian(chapter)}`}
                      {...prefetchOnHover(`/chapter/${chapter}`)}
                    >
                      <Label>Բան {toArmenian(chapter)}</Label>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                  <ListBox.Item
                    id="/colophon"
                    textValue={colophonLabel}
                    {...prefetchOnHover('/colophon')}
                  >
                    <Label>{colophonLabel}</Label>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                </ListBox>
              </Drawer.Body>
              <Drawer.Footer className="flex flex-row justify-between gap-4">
                <Link href="https://github.com/rubo/narek">
                  <Link.Icon className="size-6">
                    <img alt="GitHub" src="/github.svg" />
                  </Link.Icon>
                </Link>
                <ButtonGroup variant="tertiary">
                  <Button
                    className="w-16 text-xs"
                    aria-pressed={fontScale === 'sm'}
                    aria-label="Փոքր տառաչափ"
                    onClick={() => handleFontScaleChange('sm')}
                  >
                    {fontScale === 'sm' && <CheckIcon className="size-2.5" />}Ա
                  </Button>
                  <Button
                    className="w-16 text-base"
                    aria-pressed={fontScale === 'base'}
                    aria-label="Միջին տառաչափ"
                    onClick={() => handleFontScaleChange('base')}
                  >
                    <ButtonGroup.Separator />
                    {fontScale === 'base' && <CheckIcon className="size-2.5" />}Ա
                  </Button>
                  <Button
                    className="w-16 text-lg"
                    aria-pressed={fontScale === 'lg'}
                    aria-label="Մեծ տառաչափ"
                    onClick={() => handleFontScaleChange('lg')}
                  >
                    <ButtonGroup.Separator />
                    {fontScale === 'lg' && <CheckIcon className="size-2.5" />}Ա
                  </Button>
                </ButtonGroup>
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
      <Dropdown>
        <Button
          variant="tertiary"
          isIconOnly
          className="fixed top-4 right-4 shadow-lg"
          aria-label="Թարգմանություն"
        >
          <span className="material-symbols-outlined">translate</span>
        </Button>
        <Dropdown.Popover placement="bottom end">
          <Dropdown.Menu
            disallowEmptySelection
            disabledKeys={disabledViews}
            selectedKeys={[selectedView]}
            selectionMode="single"
            onSelectionChange={handleDisplayChange}
          >
            <Dropdown.Item id="original" textValue="Բնագիր">
              <Dropdown.ItemIndicator />
              <div className="flex flex-col">
                <Label>Բնագիր</Label>
                <Description>Գրաբար</Description>
              </div>
            </Dropdown.Item>
            {/* Repeated labels need the name for typeahead. */}
            {Object.entries(editions).map(([id, name]) => (
              <Dropdown.Item key={id} id={`translated-${id}`} textValue={`Թարգմանություն, ${name}`}>
                <Dropdown.ItemIndicator />
                <div className="flex flex-col">
                  <Label>Թարգմանություն</Label>
                  <Description>{name}</Description>
                </div>
              </Dropdown.Item>
            ))}
            <Separator />
            {Object.entries(editions).map(([id, name]) => (
              <Dropdown.Item key={id} id={`combined-${id}`} textValue={`Համատեղ, ${name}`}>
                <Dropdown.ItemIndicator />
                <div className="flex flex-col">
                  <Label>Համատեղ</Label>
                  <Description>Բնագիր + {name}</Description>
                </div>
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      {/* Separate snapshots avoid animating the scroll reset as a position change. */}
      <ViewTransition key={location.pathname} default="reading-view">
        <main className="text-book-base w-full max-w-xl font-serif">
          <Outlet />
        </main>
      </ViewTransition>
      {(previous || next) && (
        <ButtonGroup variant="tertiary" className="mt-12">
          {previous && (
            <Button onClick={() => goTo(`/chapter/${previous}`)}>
              <IconChevronLeft />
              Բան {toArmenian(previous)}
            </Button>
          )}
          {next && (
            <Button onClick={() => goTo(`/chapter/${next}`)}>
              {previous && <ButtonGroup.Separator />}
              Բան {toArmenian(next)}
              <IconChevronRight />
            </Button>
          )}
        </ButtonGroup>
      )}
      {[...prefetched].map((target) => (
        <link
          key={target}
          rel="prefetch"
          as="fetch"
          href={dataPath(viewPath(mode, edition, target))}
        />
      ))}
    </>
  );
}
