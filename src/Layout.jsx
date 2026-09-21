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
import { useLayoutEffect, useState, ViewTransition } from 'react';
import {
  matchPath,
  Outlet,
  useLocation,
  useNavigate,
  useNavigationType,
  useSearchParams,
} from 'react-router';
import mkMapping from './assets/generated/mapping_mk.json';
import mkColophonMapping from './assets/generated/mapping_mk/colophon.json';
import mkSuperscriptionMapping from './assets/generated/mapping_mk/superscription.json';
import vgMapping from './assets/generated/mapping_vg.json';
import chapters from './assets/generated/original/chapters.json';
import originalColophon from './assets/generated/original/colophon.json';
import originalSuperscription from './assets/generated/original/superscription.json';
import mkChapters from './assets/generated/translation_mk/chapters.json';
import mkColophon from './assets/generated/translation_mk/colophon.json';
import mkSuperscription from './assets/generated/translation_mk/superscription.json';
import vgChapters from './assets/generated/translation_vg/chapters.json';
import { toArmenian } from './shared/utils';

// Keyed by the id in the URL. `mapping` follows the original's chapters, with
// null where the edition lacks one; a partial edition omits the pages it lacks.
const translations = {
  mk: {
    name: 'Մ. Խերանյան',
    chapters: mkChapters,
    mapping: mkMapping,
    superscription: { text: mkSuperscription, mapping: mkSuperscriptionMapping },
    colophon: { text: mkColophon, mapping: mkColophonMapping },
  },
  vg: {
    name: 'Վ. Գևորգյան',
    chapters: vgChapters,
    mapping: vgMapping,
  },
};

// The translated part a route shows, or undefined where the edition lacks it.
function translatedPart(translation, pathname) {
  if (matchPath('/', pathname)) {
    return translation.superscription;
  }

  if (matchPath('/colophon', pathname)) {
    return translation.colophon;
  }

  const number = Number(matchPath('/chapter/:number', pathname)?.params.number);

  return translation.chapters.find(({ chapter }) => chapter === number);
}

// From the URL, so untrusted. A translation always names its translator.
const views = [
  'original',
  ...['translated', 'combined'].flatMap((mode) =>
    Object.keys(translations).map((id) => `${mode}-${id}`),
  ),
];
const defaultView = 'original';

const fontScales = ['sm', 'base', 'lg'];
const defaultFontScale = 'base';

// Literal class names so Tailwind's scanner keeps these utilities; an
// interpolated `text-scale-${fontScale}` would be purged.
const scaleClasses = {
  sm: 'text-scale-sm',
  base: 'text-scale-base',
  lg: 'text-scale-lg',
};

// Every path the drawer lists; anything else selects nothing.
const paths = ['/', ...chapters.map(({ chapter }) => `/chapter/${chapter}`), '/colophon'];

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

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const [searchParams, setSearchParams] = useSearchParams();
  const drawerState = useOverlayState({
    defaultOpen: false,
  });

  const [fontScale, setFontScale] = useState(() => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('fontScale') : null;
    return fontScales.includes(stored) ? stored : defaultFontScale;
  });

  const handleFontScaleChange = (value) => {
    setFontScale(value);
    localStorage.setItem('fontScale', value);
    drawerState.close();
  };

  const mode = searchParams.get('mode');
  const requestedView = views.includes(mode) ? mode : defaultView;
  const [requestedMode, translationId] = requestedView.split('-');
  const requested = translations[translationId];
  // A translation that lacks this page shows the original, and the menu says so;
  // the URL keeps the request for the next page.
  const translation = requested && translatedPart(requested, location.pathname) ? requested : null;
  const selectedView = translation ? requestedView : defaultView;
  const displayMode = translation ? requestedMode : defaultView;
  const drawerTranslation = displayMode === 'translated' ? translation : null;
  const superscription = drawerTranslation?.superscription?.text ?? originalSuperscription;
  const colophon = drawerTranslation?.colophon?.text ?? originalColophon;
  // Rows for a translation that lacks this page.
  const disabledViews = Object.keys(translations)
    .filter((id) => !translatedPart(translations[id], location.pathname))
    .flatMap((id) => [`translated-${id}`, `combined-${id}`]);
  const selectedKeys = paths.includes(location.pathname) ? [location.pathname] : [];

  useLayoutEffect(() => {
    // Leave initial loads and history navigation to browser scroll restoration.
    if (navigationType === 'POP') {
      return;
    }

    // Reset between the old and new snapshots, before the transition is painted.
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname, selectedView, navigationType]);

  // Keep the display mode when moving between pages.
  const goTo = (pathname) => {
    navigate({ pathname, search: location.search });
  };

  // Keyed by path, so the route drives the selection.
  const currentChapter = chapters.findIndex(
    ({ chapter }) => `/chapter/${chapter}` === location.pathname,
  );

  let previous = currentChapter > 0 ? chapters[currentChapter - 1] : null;
  let next =
    currentChapter >= 0 && currentChapter < chapters.length - 1
      ? chapters[currentChapter + 1]
      : null;

  // The superscription and colophon lead into the chapters, not back out.
  if (location.pathname === '/') {
    next = chapters[0];
  }

  if (location.pathname === '/colophon') {
    previous = chapters.at(-1);
  }

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

    setSearchParams(
      (params) => {
        const updated = new URLSearchParams(params);

        // Keep original URLs canonical.
        if (value === defaultView) {
          updated.delete('mode');
        } else {
          updated.set('mode', String(value));
        }

        return updated;
      },
      // Switching the view is not a navigation step.
      { replace: true },
    );
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
                  selectedKeys={selectedKeys}
                  onSelectionChange={handleChapterChange}
                  aria-label="Բովանդակություն"
                >
                  <ListBox.Item id="/" textValue={superscription.content[0]}>
                    <Label>{superscription.content[0]}</Label>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  {chapters.map(({ chapter }) => (
                    <ListBox.Item
                      key={chapter}
                      id={`/chapter/${chapter}`}
                      textValue={`Բան ${toArmenian(chapter)}`}
                    >
                      <Label>Բան {toArmenian(chapter)}</Label>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                  <ListBox.Item id="/colophon" textValue={colophon.heading}>
                    <Label>{colophon.heading}</Label>
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
            {Object.entries(translations).map(([id, { name }]) => (
              <Dropdown.Item key={id} id={`translated-${id}`} textValue={`Թարգմանություն, ${name}`}>
                <Dropdown.ItemIndicator />
                <div className="flex flex-col">
                  <Label>Թարգմանություն</Label>
                  <Description>{name}</Description>
                </div>
              </Dropdown.Item>
            ))}
            <Separator />
            {Object.entries(translations).map(([id, { name }]) => (
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
      <ViewTransition key={`${location.pathname}:${selectedView}`} default="reading-view">
        <main className={`text-book-base max-w-xl font-serif ${scaleClasses[fontScale]} w-full`}>
          <Outlet context={{ displayMode, translation }} />
        </main>
      </ViewTransition>
      {(previous || next) && (
        <ButtonGroup variant="tertiary" className="mt-12">
          {previous && (
            <Button onClick={() => goTo(`/chapter/${previous.chapter}`)}>
              <IconChevronLeft />
              Բան {toArmenian(previous.chapter)}
            </Button>
          )}
          {next && (
            <Button onClick={() => goTo(`/chapter/${next.chapter}`)}>
              {previous && <ButtonGroup.Separator />}
              Բան {toArmenian(next.chapter)}
              <IconChevronRight />
            </Button>
          )}
        </ButtonGroup>
      )}
    </>
  );
}
