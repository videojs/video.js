import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { PlayerContextProvider, type PlayerContextValue } from '../../player/context';
import { Audio } from '../audio';

describe('Audio', () => {
  function createMockStore() {
    return {
      state: { volume: 1, muted: false },
      attach: vi.fn(() => vi.fn()),
      subscribe: vi.fn(() => vi.fn()),
      destroy: vi.fn(),
    };
  }

  function createWrapper(value: PlayerContextValue) {
    return function Wrapper({ children }: { children: ReactNode }) {
      return <PlayerContextProvider value={value}>{children}</PlayerContextProvider>;
    };
  }

  describe('standalone (without Provider)', () => {
    it('renders without error', () => {
      const { container } = render(<Audio data-testid="audio" />);
      const audio = container.querySelector('audio');

      expect(audio).toBeTruthy();
      expect(audio?.getAttribute('data-testid')).toBe('audio');
    });

    it('passes props to audio element', () => {
      const { container } = render(<Audio src="test.mp3" controls autoPlay />);

      const audio = container.querySelector('audio') as HTMLAudioElement;

      expect(audio?.getAttribute('src')).toBe('test.mp3');
      expect(audio?.hasAttribute('controls')).toBe(true);
      expect(audio?.hasAttribute('autoplay')).toBe(true);
    });

    it('renders children', () => {
      const { container } = render(
        <Audio>
          <source src="test.mp3" type="audio/mpeg" />
        </Audio>
      );

      const audio = container.querySelector('audio');

      expect(audio?.querySelector('source')).toBeTruthy();
    });

    it('links to the help page as fallback content', () => {
      const { container } = render(<Audio />);
      const link = container.querySelector('audio > a');

      expect(link?.getAttribute('href')).toBe('https://videojs.org/help');
      expect(link?.textContent).toBe('Audio player not working?');
    });

    it('forwards ref correctly', () => {
      const ref = createRef<HTMLAudioElement>();

      render(<Audio ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLAudioElement);
    });
  });

  describe('with Provider', () => {
    it('calls setMedia on mount', () => {
      const setMedia = vi.fn();
      const store = createMockStore();
      const value: PlayerContextValue = {
        store: store as any,
        media: null,
        setMedia,
        container: null,
        setContainer: vi.fn(),
      };

      render(<Audio />, { wrapper: createWrapper(value) });

      expect(setMedia).toHaveBeenCalledWith(expect.any(HTMLAudioElement));
    });

    it('calls setMedia with null on unmount', () => {
      const setMedia = vi.fn();
      const store = createMockStore();
      const value: PlayerContextValue = {
        store: store as any,
        media: null,
        setMedia,
        container: null,
        setContainer: vi.fn(),
      };

      const { unmount } = render(<Audio />, { wrapper: createWrapper(value) });

      setMedia.mockClear();
      unmount();

      expect(setMedia).toHaveBeenCalledWith(null);
    });

    it('forwards ref while also registering media', () => {
      const setMedia = vi.fn();
      const store = createMockStore();
      const value: PlayerContextValue = {
        store: store as any,
        media: null,
        setMedia,
        container: null,
        setContainer: vi.fn(),
      };

      const ref = createRef<HTMLAudioElement>();

      render(<Audio ref={ref} />, { wrapper: createWrapper(value) });

      expect(ref.current).toBeInstanceOf(HTMLAudioElement);
      expect(setMedia).toHaveBeenCalledWith(ref.current);
    });
  });
});
