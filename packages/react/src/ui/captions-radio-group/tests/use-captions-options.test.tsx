import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { registerI18n, resetI18nRegistry } from '@videojs/core/i18n';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { I18nProvider } from '../../../i18n';
import { PlayerContextProvider, type PlayerContextValue } from '../../../player/context';
import { createPlayerWrapper } from '../../../testing/mocks';
import { Menu } from '../../menu';
import { useCaptionsOptions } from '../use-captions-options';

afterEach(() => {
  resetI18nRegistry();
  cleanup();
});

function renderCaptionsMenu({
  textTrackList = [
    { id: 'subtitles-en', kind: 'subtitles', label: 'English', language: 'en', mode: 'disabled' },
    { id: 'subtitles-es', kind: 'subtitles', label: 'Spanish', language: 'es', mode: 'showing' },
  ] as const,
  subtitlesShowing = true,
  selectSubtitlesTrack = vi.fn(),
  locale,
}: {
  textTrackList?: readonly { id: string; kind: string; label: string; language: string; mode: string }[];
  subtitlesShowing?: boolean;
  selectSubtitlesTrack?: (id: string | null) => void;
  locale?: string | undefined;
} = {}) {
  const { Wrapper } = createPlayerWrapper({
    textTrackList,
    subtitlesShowing,
    selectSubtitlesTrack,
    chaptersCues: [],
    thumbnailsTrack: null,
    toggleSubtitles: vi.fn(),
  });
  const content = (
    <Menu.Root defaultOpen align="center">
      <Menu.Popup data-testid="popup">
        <Menu.Content data-testid="content">
          <CaptionsRadioGroup />
        </Menu.Content>
      </Menu.Popup>
    </Menu.Root>
  );

  render(locale ? <I18nProvider locale={locale}>{content}</I18nProvider> : content, { wrapper: Wrapper });

  return { selectSubtitlesTrack };
}

function createReactiveTextTrackWrapper(initialState: Record<string, unknown>) {
  const listeners = new Set<() => void>();
  const store = {
    state: initialState,
    subscribe: (callback: () => void) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    attach: vi.fn(() => vi.fn()),
    destroy: vi.fn(),
  };

  const value: PlayerContextValue = {
    store: store as unknown as PlayerContextValue['store'],
    media: null,
    setMedia: vi.fn(),
    container: null,
    setContainer: vi.fn(),
  };

  return {
    updateState(next: Record<string, unknown>) {
      store.state = next;

      for (const listener of listeners) listener();
    },
    Wrapper({ children }: { children: ReactNode }) {
      return <PlayerContextProvider value={value}>{children}</PlayerContextProvider>;
    },
  };
}

function CaptionsAvailability(): ReactNode {
  const captions = useCaptionsOptions();

  return (
    <div data-testid="availability">
      {captions ? `${captions.state.availability}:${captions.hidden ? 'hidden' : 'visible'}` : 'missing'}
    </div>
  );
}

function CaptionsRadioGroup(): ReactNode {
  const captions = useCaptionsOptions();
  if (!captions?.showMenu) return null;

  const { options, selectedLabel, setValue, value } = captions;

  return (
    <>
      <span data-testid="selected-label">{selectedLabel}</span>
      <Menu.RadioGroup value={value} onValueChange={setValue} aria-label="Captions">
        {options.map((option) => (
          <Menu.RadioItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </Menu.RadioItem>
        ))}
      </Menu.RadioGroup>
    </>
  );
}

describe('useCaptionsOptions', () => {
  it('renders radio items for off and available tracks', () => {
    renderCaptionsMenu();

    expect(screen.getByRole('menuitemradio', { name: 'Off' }).getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('menuitemradio', { name: 'English' }).getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('menuitemradio', { name: 'Spanish' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByTestId('selected-label').textContent).toBe('Spanish');
  });

  it('center aligns the popup by default', () => {
    renderCaptionsMenu();

    expect(screen.getByTestId('popup').getAttribute('data-align')).toBe('center');
  });

  it('selects a captions track', () => {
    const selectSubtitlesTrack = vi.fn();

    renderCaptionsMenu({ selectSubtitlesTrack });

    fireEvent.click(screen.getByRole('menuitemradio', { name: 'English' }));

    expect(selectSubtitlesTrack).toHaveBeenCalledWith('subtitles-en');
  });

  it('translates default track labels', () => {
    registerI18n('xx', {
      'menu.captions': 'Captions translated',
    });

    renderCaptionsMenu({
      textTrackList: [
        { id: 'captions', kind: 'captions', label: '', language: '', mode: 'disabled' },
        { id: 'subtitles-es', kind: 'subtitles', label: 'Spanish', language: 'es', mode: 'showing' },
      ],
      locale: 'xx',
    });

    expect(screen.getByRole('menuitemradio', { name: 'Captions translated' })).toBeTruthy();
  });

  it('turns captions off', () => {
    const selectSubtitlesTrack = vi.fn();

    renderCaptionsMenu({ selectSubtitlesTrack });

    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Off' }));

    expect(selectSubtitlesTrack).toHaveBeenCalledWith(null);
  });

  it('updates when caption tracks become available', () => {
    const { Wrapper, updateState } = createReactiveTextTrackWrapper({
      chaptersCues: [],
      thumbnailsTrack: null,
      textTrackList: [],
      subtitlesShowing: false,
      selectSubtitlesTrack: vi.fn(),
      toggleSubtitles: vi.fn(),
    });

    render(<CaptionsAvailability />, { wrapper: Wrapper });

    expect(screen.getByTestId('availability').textContent).toBe('unavailable:hidden');

    act(() => {
      updateState({
        chaptersCues: [],
        thumbnailsTrack: null,
        textTrackList: [
          { id: 'subtitles-en', kind: 'subtitles', label: 'English', language: 'en', mode: 'disabled' },
          { id: 'subtitles-es', kind: 'subtitles', label: 'Spanish', language: 'es', mode: 'showing' },
        ],
        subtitlesShowing: true,
        selectSubtitlesTrack: vi.fn(),
        toggleSubtitles: vi.fn(),
      });
    });

    expect(screen.getByTestId('availability').textContent).toBe('available:visible');
  });
});
