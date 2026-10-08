import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vite-plus/test';

import { PlayerContextProvider, type PlayerContextValue } from '../../player/context';
import { Video } from '../video';

describe('Video', () => {
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
      const { container } = render(<Video data-testid="video" />);
      const video = container.querySelector('video');

      expect(video).toBeTruthy();
      expect(video?.getAttribute('data-testid')).toBe('video');
    });

    it('passes props to video element', () => {
      const { container } = render(<Video src="test.mp4" controls autoPlay playsInline />);

      const video = container.querySelector('video') as HTMLVideoElement;

      expect(video?.getAttribute('src')).toBe('test.mp4');
      expect(video?.hasAttribute('controls')).toBe(true);
      expect(video?.hasAttribute('autoplay')).toBe(true);
      expect(video?.hasAttribute('playsinline')).toBe(true);
    });

    it('renders children', () => {
      const { container } = render(
        <Video>
          <source src="test.mp4" type="video/mp4" />
          <track kind="captions" src="captions.vtt" />
        </Video>
      );

      const video = container.querySelector('video');

      expect(video?.querySelector('source')).toBeTruthy();
      expect(video?.querySelector('track')).toBeTruthy();
    });

    it('links to the help page as fallback content after children', () => {
      const { container } = render(
        <Video>
          <track kind="captions" src="captions.vtt" />
        </Video>
      );
      const link = container.querySelector('video')?.lastElementChild;

      expect(link?.previousElementSibling?.tagName).toBe('TRACK');
      expect(link?.getAttribute('href')).toBe('https://videojs.org/help');
      expect(link?.textContent).toBe('Video player not working?');
    });

    it('server-renders the fallback link', () => {
      expect(renderToString(<Video src="test.mp4" />)).toBe(
        '<video src="test.mp4"><a href="https://videojs.org/help">Video player not working?</a></video>'
      );
    });

    it('replaces or removes the fallback content through fallback', () => {
      const custom = render(<Video fallback={<p>Download the video instead.</p>} />);
      const none = render(<Video fallback={null} />);

      expect(custom.container.querySelector('video')?.innerHTML).toBe('<p>Download the video instead.</p>');
      expect(none.container.querySelector('video')?.childNodes).toHaveLength(0);
      expect(none.container.querySelector('video')?.hasAttribute('fallback')).toBe(false);
    });

    it('forwards ref correctly', () => {
      const ref = createRef<HTMLVideoElement>();

      render(<Video ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLVideoElement);
    });

    it('hands the element itself to mediaRef', () => {
      const ref = createRef<HTMLVideoElement>();
      const mediaRef = createRef<HTMLVideoElement>();

      const { container } = render(<Video ref={ref} mediaRef={mediaRef} />);

      expect(mediaRef.current).toBeInstanceOf(HTMLVideoElement);
      expect(mediaRef.current).toBe(ref.current);
      expect(container.querySelector('video')?.hasAttribute('mediaref')).toBe(false);
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

      render(<Video />, { wrapper: createWrapper(value) });

      expect(setMedia).toHaveBeenCalledWith(expect.any(HTMLVideoElement));
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

      const { unmount } = render(<Video />, { wrapper: createWrapper(value) });

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

      const ref = createRef<HTMLVideoElement>();

      render(<Video ref={ref} />, { wrapper: createWrapper(value) });

      expect(ref.current).toBeInstanceOf(HTMLVideoElement);
      expect(setMedia).toHaveBeenCalledWith(ref.current);
    });
  });
});
