import {
  Button,
  ButtonGroup,
  Description,
  Drawer,
  Dropdown,
  IconChevronLeft,
  IconChevronRight,
  Label,
  ListBox,
} from '@heroui/react';
import { useOverlayState } from '@heroui/react';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router';
import chapters from './assets/generated/original/chapters.json';
import colophon from './assets/generated/original/colophon.json';
import superscription from './assets/generated/original/superscription.json';
import { toArmenian } from './shared/utils';

// From the URL, so untrusted.
const displayModes = ['original', 'translated', 'combined'];
const defaultDisplayMode = 'original';

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
  const displayMode = displayModes.includes(mode) ? mode : defaultDisplayMode;
  const selectedKeys = paths.includes(location.pathname) ? [location.pathname] : [];

  // Keep the display mode when moving between pages.
  const goTo = (pathname) => {
    navigate({ pathname, search: location.search });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

        // The default mode stays out of the URL.
        if (value === defaultDisplayMode) {
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
                  <ListBox.Item id="/" textValue={superscription.heading}>
                    <Label>{superscription.heading}</Label>
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
              <Drawer.Footer>
                <ButtonGroup variant="tertiary" fullWidth>
                  <Button
                    className="text-xs"
                    aria-pressed={fontScale === 'sm'}
                    aria-label="Փոքր տառաչափ"
                    onClick={() => handleFontScaleChange('sm')}
                  >
                    {fontScale === 'sm' && <CheckIcon className="size-2.5" />}
                    Աբգ
                  </Button>
                  <Button
                    className="text-base"
                    aria-pressed={fontScale === 'base'}
                    aria-label="Միջին տառաչափ"
                    onClick={() => handleFontScaleChange('base')}
                  >
                    <ButtonGroup.Separator />
                    {fontScale === 'base' && <CheckIcon className="size-2.5" />}
                    Աբգ
                  </Button>
                  <Button
                    className="text-lg"
                    aria-pressed={fontScale === 'lg'}
                    aria-label="Մեծ տառաչափ"
                    onClick={() => handleFontScaleChange('lg')}
                  >
                    <ButtonGroup.Separator />
                    {fontScale === 'lg' && <CheckIcon className="size-2.5" />}
                    Աբգ
                  </Button>
                </ButtonGroup>
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
      {/* Only the chapters are translated. */}
      {currentChapter >= 0 && (
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
              selectedKeys={[displayMode]}
              selectionMode="single"
              onSelectionChange={handleDisplayChange}
            >
              <Dropdown.Item id="original">
                <Dropdown.ItemIndicator />
                <div className="flex flex-col">
                  <Label>Բնագիր</Label>
                  <Description>Գրաբար</Description>
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="translated">
                <Dropdown.ItemIndicator />
                <div className="flex flex-col">
                  <Label>Թարգմանություն</Label>
                  <Description>Մ․ Խերանյան</Description>
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="combined">
                <Dropdown.ItemIndicator />
                <div className="flex flex-col">
                  <Label>Համատեղ</Label>
                  <Description>Բնագիր + թարգմանություն</Description>
                </div>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      )}
      <main className={`text-book-base max-w-xl font-serif ${scaleClasses[fontScale]}`}>
        <Outlet context={{ displayMode }} />
      </main>
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
