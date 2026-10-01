import { cleanup, render, renderHook, screen } from '@testing-library/react';
import { type ReactNode, useContext } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { I18nContext } from '../../i18n/context';
import { createI18n } from '../../i18n/create-i18n';
import { usePlayerContext, useOptionalContainer } from '../../index';
import { createMockStore } from '../../testing/mocks';
import { Container } from '../container';
import {
  PlayerContextProvider,
  type PlayerContextValue,
  useContainer,
  useContainerAttach,
  useMedia,
  useMediaAttach,
  useOptionalPlayer,
  usePlayer,
} from '../context';
import { useOptionalPopupGroup } from '../popup-group-context';

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('lang');
  document.documentElement.removeAttribute('dir');
});

function createWrapper(value: PlayerContextValue) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <PlayerContextProvider value={value}>{children}</PlayerContextProvider>;
  };
}

function createContextValue(overrides?: Partial<PlayerContextValue>): PlayerContextValue {
  return {
    store: createMockStore() as any,
    media: null,
    setMedia: vi.fn(),
    container: null,
    setContainer: vi.fn(),
    ...overrides,
  };
}

describe('usePlayerContext', () => {
  it('throws outside a Player', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => usePlayerContext());
    }).toThrow('usePlayerContext must be used within a Player');

    consoleSpy.mockRestore();
  });

  it('returns context value inside a Player', () => {
    const store = createMockStore();
    const value = createContextValue({ store: store as any });

    const { result } = renderHook(() => usePlayerContext(), {
      wrapper: createWrapper(value),
    });

    expect(result.current.store).toBe(store);
    expect(result.current.media).toBe(null);
    expect(result.current).not.toHaveProperty('popupGroup');
  });
});

describe('useMediaAttach', () => {
  it('returns undefined outside a Player', () => {
    const { result } = renderHook(() => useMediaAttach());

    expect(result.current).toBeUndefined();
  });

  it('returns setMedia inside a Player', () => {
    const setMedia = vi.fn();
    const value = createContextValue({ setMedia });

    const { result } = renderHook(() => useMediaAttach(), {
      wrapper: createWrapper(value),
    });

    expect(result.current).toBe(setMedia);
  });
});

describe('useContainer', () => {
  it('returns null when no container', () => {
    const value = createContextValue();

    const { result } = renderHook(() => useContainer(), {
      wrapper: createWrapper(value),
    });

    expect(result.current).toBeNull();
  });

  it('returns container from context', () => {
    const container = document.createElement('div');
    const value = createContextValue({ container });

    const { result } = renderHook(() => useContainer(), {
      wrapper: createWrapper(value),
    });

    expect(result.current).toBe(container);
  });
});

describe('useContainerAttach', () => {
  it('returns undefined outside a Player', () => {
    const { result } = renderHook(() => useContainerAttach());

    expect(result.current).toBeUndefined();
  });

  it('returns setContainer inside a Player', () => {
    const setContainer = vi.fn();
    const value = createContextValue({ setContainer });

    const { result } = renderHook(() => useContainerAttach(), {
      wrapper: createWrapper(value),
    });

    expect(result.current).toBe(setContainer);
  });
});

describe('useOptionalContainer', () => {
  it('returns null outside a Player', () => {
    const { result } = renderHook(() => useOptionalContainer());

    expect(result.current).toBeNull();
  });

  it('returns container inside a Player', () => {
    const container = document.createElement('div');
    const value = createContextValue({ container });

    const { result } = renderHook(() => useOptionalContainer(), {
      wrapper: createWrapper(value),
    });

    expect(result.current).toBe(container);
  });
});

describe('usePlayer', () => {
  it('returns store without selector', () => {
    const store = createMockStore();
    const value = createContextValue({ store: store as any });

    const { result } = renderHook(() => usePlayer(), {
      wrapper: createWrapper(value),
    });

    expect(result.current).toBe(store);
  });
});

describe('useOptionalPlayer', () => {
  it('returns undefined outside a Player', () => {
    const { result } = renderHook(() => useOptionalPlayer());

    expect(result.current).toBeUndefined();
  });

  it('does not run selector outside a Player', () => {
    const selector = vi.fn(() => true);
    const { result } = renderHook(() => useOptionalPlayer(selector));

    expect(result.current).toBeUndefined();
    expect(selector).not.toHaveBeenCalled();
  });

  it('returns store inside a Player', () => {
    const store = createMockStore();
    const value = createContextValue({ store: store as any });

    const { result } = renderHook(() => useOptionalPlayer(), {
      wrapper: createWrapper(value),
    });

    expect(result.current).toBe(store);
  });

  it('returns selected state inside a Player', () => {
    const store = createMockStore({ paused: true });
    const value = createContextValue({ store: store as any });

    const { result } = renderHook(() => useOptionalPlayer((state: any) => state.paused), {
      wrapper: createWrapper(value),
    });

    expect(result.current).toBe(true);
  });
});

describe('useMedia', () => {
  it('returns media from context', () => {
    const media = document.createElement('video');
    const value = createContextValue({ media });

    const { result } = renderHook(() => useMedia(), {
      wrapper: createWrapper(value),
    });

    expect(result.current).toBe(media);
  });

  it('returns null when no media', () => {
    const value = createContextValue();

    const { result } = renderHook(() => useMedia(), {
      wrapper: createWrapper(value),
    });

    expect(result.current).toBeNull();
  });
});

describe('Container', () => {
  it('scopes popup coordination to container children', () => {
    const value = createContextValue();
    let outsideGroup: unknown;
    let insideGroup: unknown;

    function OutsideProbe() {
      outsideGroup = useOptionalPopupGroup();
      return null;
    }

    function InsideProbe() {
      insideGroup = useOptionalPopupGroup();
      return null;
    }

    render(
      <PlayerContextProvider value={value}>
        <OutsideProbe />
        <Container>
          <InsideProbe />
        </Container>
      </PlayerContextProvider>
    );

    expect(outsideGroup).toBeUndefined();
    expect(insideGroup).toBeDefined();
  });

  it.each([
    { controlsVisible: true, expected: '' },
    { controlsVisible: false, expected: null },
  ])('reflects controls visibility on the container', ({ controlsVisible, expected }) => {
    const store = createMockStore({ controlsVisible, userActive: true });
    const value = createContextValue({ store: store as any });

    const { container } = render(
      <PlayerContextProvider value={value}>
        <Container />
      </PlayerContextProvider>
    );

    expect(container.firstElementChild?.getAttribute('data-controls-visible')).toBe(expected);
  });

  it('provides a default accessible name', () => {
    const value = createContextValue();

    const { container } = render(
      <PlayerContextProvider value={value}>
        <Container />
      </PlayerContextProvider>
    );

    const el = container.firstElementChild;

    expect(el?.getAttribute('role')).toBe('group');
    expect(el?.getAttribute('aria-label')).toBe('Media player');
  });

  it('translates the default accessible name', () => {
    const value = createContextValue();
    const { I18nProvider } = createI18n();
    const { container } = render(
      <I18nProvider locale="fr" translations={{ container: { label: 'Lecteur multimédia' } }}>
        <PlayerContextProvider value={value}>
          <Container />
        </PlayerContextProvider>
      </I18nProvider>
    );

    expect(container.firstElementChild?.getAttribute('aria-label')).toBe('Lecteur multimédia');
  });

  it('applies the provider locale and direction to the container', () => {
    const value = createContextValue();
    const { I18nProvider } = createI18n();
    const { container } = render(
      <I18nProvider locale="ar">
        <PlayerContextProvider value={value}>
          <Container />
        </PlayerContextProvider>
      </I18nProvider>
    );

    expect(container.firstElementChild?.getAttribute('lang')).toBe('ar');
    expect(container.firstElementChild?.getAttribute('dir')).toBe('rtl');
  });

  it('applies an explicit locale through a translations-only provider', () => {
    const value = createContextValue();
    const { I18nProvider } = createI18n();
    const { container } = render(
      <I18nProvider locale="ar">
        <I18nProvider translations={{}}>
          <PlayerContextProvider value={value}>
            <Container />
          </PlayerContextProvider>
        </I18nProvider>
      </I18nProvider>
    );

    expect(container.firstElementChild?.getAttribute('lang')).toBe('ar');
    expect(container.firstElementChild?.getAttribute('dir')).toBe('rtl');
  });

  it('inherits ambient language and direction without adding attributes', () => {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'ltr';
    const value = createContextValue();
    const { I18nProvider } = createI18n();
    const { container } = render(
      <I18nProvider>
        <PlayerContextProvider value={value}>
          <Container />
        </PlayerContextProvider>
      </I18nProvider>
    );

    expect(container.firstElementChild?.hasAttribute('lang')).toBe(false);
    expect(container.firstElementChild?.hasAttribute('dir')).toBe(false);
  });

  it('derives direction from an explicit container language', () => {
    const value = createContextValue();
    const { I18nProvider } = createI18n();
    const { container } = render(
      <I18nProvider locale="ar">
        <PlayerContextProvider value={value}>
          <Container lang="en" />
        </PlayerContextProvider>
      </I18nProvider>
    );

    expect(container.firstElementChild?.getAttribute('lang')).toBe('en');
    expect(container.firstElementChild?.getAttribute('dir')).toBe('ltr');
  });

  it('preserves explicit container language and direction', () => {
    const value = createContextValue();
    const { I18nProvider } = createI18n();
    const { container } = render(
      <I18nProvider locale="ar">
        <PlayerContextProvider value={value}>
          <Container lang="en" dir="ltr" />
        </PlayerContextProvider>
      </I18nProvider>
    );

    expect(container.firstElementChild?.getAttribute('lang')).toBe('en');
    expect(container.firstElementChild?.getAttribute('dir')).toBe('ltr');
  });

  it('does not add language attributes without a provider', () => {
    const value = createContextValue();
    const { container } = render(
      <PlayerContextProvider value={value}>
        <Container />
      </PlayerContextProvider>
    );

    expect(container.firstElementChild?.hasAttribute('lang')).toBe(false);
    expect(container.firstElementChild?.hasAttribute('dir')).toBe(false);
  });

  it('preserves explicit accessible naming', () => {
    const value = createContextValue();

    const { container } = render(
      <PlayerContextProvider value={value}>
        <Container aria-label="Video player" role="region" />
      </PlayerContextProvider>
    );

    const el = container.firstElementChild;

    expect(el?.getAttribute('role')).toBe('region');
    expect(el?.getAttribute('aria-label')).toBe('Video player');
  });

  it('uses aria-labelledby instead of the default label when provided', () => {
    const value = createContextValue();

    const { container } = render(
      <PlayerContextProvider value={value}>
        <Container aria-labelledby="player-title" />
      </PlayerContextProvider>
    );

    const el = container.firstElementChild;

    expect(el?.getAttribute('aria-labelledby')).toBe('player-title');
    expect(el?.hasAttribute('aria-label')).toBe(false);
  });

  it('registers container element via setContainer', () => {
    const setContainer = vi.fn();
    const value = createContextValue({ setContainer });

    render(
      <PlayerContextProvider value={value}>
        <Container />
      </PlayerContextProvider>
    );

    expect(setContainer).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  it('deregisters container on unmount', () => {
    const setContainer = vi.fn();
    const value = createContextValue({ setContainer });

    const { unmount } = render(
      <PlayerContextProvider value={value}>
        <Container />
      </PlayerContextProvider>
    );

    setContainer.mockClear();
    unmount();

    expect(setContainer).toHaveBeenCalledWith(null);
  });

  it('does not call store.attach directly', () => {
    const store = createMockStore();
    const media = document.createElement('video');
    const value = createContextValue({ store: store as any, media });

    render(
      <PlayerContextProvider value={value}>
        <Container />
      </PlayerContextProvider>
    );

    expect(store.attach).not.toHaveBeenCalled();
  });

  it('does not create an i18n provider by default', () => {
    const value = createContextValue();
    let context: unknown;

    function Probe() {
      context = useContext(I18nContext);
      return null;
    }

    render(
      <PlayerContextProvider value={value}>
        <Container>
          <Probe />
        </Container>
      </PlayerContextProvider>
    );

    expect(context).toBeNull();
  });

  it('does not derive locale from container lang through an ancestor provider', async () => {
    const value = createContextValue();
    const loader = vi.fn(async (tag: string) => (tag === 'x-container' ? { Play: 'Container play' } : undefined));
    const { I18nProvider, useTranslator } = createI18n({
      loader,
    });

    function Label() {
      const t = useTranslator();

      return <span>{t('Play')}</span>;
    }

    render(
      <I18nProvider>
        <div lang="x-container">
          <PlayerContextProvider value={value}>
            <Container>
              <Label />
            </Container>
          </PlayerContextProvider>
        </div>
      </I18nProvider>
    );

    expect(screen.queryByText('Play')).not.toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByText('Container play')).toBeNull();
    expect(loader).not.toHaveBeenCalledWith('x-container');
  });
});
