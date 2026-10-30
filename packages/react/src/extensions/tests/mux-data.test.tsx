import { render } from '@testing-library/react';
import { MuxDataExtension } from '@videojs/mux-data';
import { type ReactNode, startTransition, useLayoutEffect, useState } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { createPlayerWrapper } from '../../testing/mocks';
import { MuxData } from '../mux-data';

function createSdk() {
  const emit = vi.fn();
  const updateData = vi.fn();

  const sdk = {
    monitor: vi.fn((target: HTMLVideoElement) => {
      Object.assign(target, { mux: { deleted: false, emit, updateData, destroy: vi.fn() } });
    }),
    utils: { now: () => 0, generateUUID: () => 'uuid' },
  } as unknown as NonNullable<MuxDataExtension['MuxDataSdk']>;

  return { sdk, emit, updateData };
}

/** Stands in for a media component, which syncs its `src` to the media during render like `MuxData` does. */
function Source({ media, src }: { media: HTMLVideoElement; src: string }): ReactNode {
  media.src = src;
  return null;
}

const settle = () => new Promise<void>((resolve) => setTimeout(resolve));

describe('MuxData', () => {
  it('registers a MuxDataExtension with the surrounding player', () => {
    const { extensions, Wrapper } = createPlayerWrapper();

    render(<MuxData />, { wrapper: Wrapper });

    expect(extensions.get(MuxDataExtension)).toBeInstanceOf(MuxDataExtension);
  });

  it('names React as the framework for the default player software name', () => {
    const { extensions, Wrapper } = createPlayerWrapper();

    render(<MuxData />, { wrapper: Wrapper });

    expect(extensions.get(MuxDataExtension)!.framework).toBe('react');
  });

  it('syncs props to the extension', () => {
    const { extensions, Wrapper } = createPlayerWrapper();

    const metadata = { video_title: 'Video A' };

    render(<MuxData envKey="test-key" playerSoftwareName="mux-video" disableCookies metadata={metadata} />, {
      wrapper: Wrapper,
    });

    const extension = extensions.get(MuxDataExtension)!;

    expect(extension.metadata).toBe(metadata);
    expect(extension.envKey).toBe('test-key');
    expect(extension.playerSoftwareName).toBe('mux-video');
    expect(extension.disableCookies).toBe(true);
  });

  it('disables monitoring when MuxDataSdk is explicitly undefined', () => {
    const { extensions, Wrapper } = createPlayerWrapper();
    const MuxDataSdk = {
      monitor: vi.fn(),
      utils: { now: () => 0 },
    } as unknown as NonNullable<MuxDataExtension['MuxDataSdk']>;

    const { rerender } = render(<MuxData MuxDataSdk={MuxDataSdk} />, { wrapper: Wrapper });
    const extension = extensions.get(MuxDataExtension)!;

    expect(extension.MuxDataSdk).toBe(MuxDataSdk);

    rerender(<MuxData MuxDataSdk={undefined} />);
    expect(extension.MuxDataSdk).toBeUndefined();

    rerender(<MuxData />);
    expect(extension.MuxDataSdk).toBeDefined();
  });

  it('resets a removed prop to its default', () => {
    const { extensions, Wrapper } = createPlayerWrapper();

    const { rerender } = render(<MuxData disableCookies />, { wrapper: Wrapper });

    rerender(<MuxData />);

    expect(extensions.get(MuxDataExtension)!.disableCookies).toBe(false);
  });

  it.each([
    ['before', 'MuxData'],
    ['after', 'source'],
  ])('carries metadata rendered %s the source into the new view only', async (_, first) => {
    const { extensions, Wrapper } = createPlayerWrapper();
    const { sdk, emit, updateData } = createSdk();
    const video = document.createElement('video');

    const Tree = ({ src, title }: { src: string; title: string }) => {
      const muxData = <MuxData MuxDataSdk={sdk} metadata={{ video_title: title }} />;
      const source = <Source media={video} src={src} />;

      return first === 'MuxData' ? (
        <>
          {muxData}
          {source}
        </>
      ) : (
        <>
          {source}
          {muxData}
        </>
      );
    };

    const { rerender } = render(<Tree src="https://stream.mux.com/abc123.m3u8" title="Video A" />, {
      wrapper: Wrapper,
    });

    extensions.attach({ media: video, container: null });
    await settle();
    updateData.mockClear();

    rerender(<Tree src="https://stream.mux.com/def456.m3u8" title="Video B" />);
    await settle();
    video.dispatchEvent(new Event('loadstart'));
    await settle();

    expect(updateData).not.toHaveBeenCalled();
    expect(emit).toHaveBeenCalledExactlyOnceWith(
      'videochange',
      expect.objectContaining({ video_id: 'def456', video_title: 'Video B' })
    );
  });

  it('carries metadata into the new view when a transition yields before the source renders', async () => {
    const { extensions, Wrapper } = createPlayerWrapper();
    const { sdk, emit, updateData } = createSdk();
    const video = document.createElement('video');
    let setVideo!: (video: { src: string; title: string }) => void;
    let committedSrc = '';

    // Outlasts React's time slice, so a transition yields to the event loop before rendering the source.
    const Slow = (): ReactNode => {
      const end = performance.now() + 20;

      while (performance.now() < end);

      return null;
    };

    const Tree = () => {
      const [current, setCurrent] = useState({ src: 'https://stream.mux.com/abc123.m3u8', title: 'Video A' });

      setVideo = setCurrent;
      useLayoutEffect(() => void (committedSrc = current.src));

      return (
        <>
          <MuxData MuxDataSdk={sdk} metadata={{ video_title: current.title }} />
          <Slow />
          <Source media={video} src={current.src} />
        </>
      );
    };

    render(<Tree />, { wrapper: Wrapper });

    extensions.attach({ media: video, container: null });
    await settle();
    updateData.mockClear();

    // Real scheduling: `act()` would render the transition without yielding.
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', false);

    try {
      startTransition(() => setVideo({ src: 'https://stream.mux.com/def456.m3u8', title: 'Video B' }));
      await vi.waitFor(() => expect(committedSrc).toContain('def456'));
    } finally {
      vi.unstubAllGlobals();
    }

    await settle();
    video.dispatchEvent(new Event('loadstart'));
    await settle();

    expect(updateData).not.toHaveBeenCalled();
    expect(emit).toHaveBeenCalledExactlyOnceWith(
      'videochange',
      expect.objectContaining({ video_id: 'def456', video_title: 'Video B' })
    );
  });

  it('keeps the extension alive across media changes while mounted', () => {
    const { extensions, Wrapper } = createPlayerWrapper();
    const destroy = vi.spyOn(MuxDataExtension.prototype, 'destroy');
    const first = document.createElement('video');
    const second = document.createElement('video');

    render(<MuxData MuxDataSdk={undefined} />, { wrapper: Wrapper });

    const extension = extensions.get(MuxDataExtension)!;

    extensions.attach({ media: first, container: null });
    extensions.attach({ media: second, container: null });

    // The player moves the extension between media; only unmount destroys it.
    expect(destroy).not.toHaveBeenCalled();
    expect(extensions.get(MuxDataExtension)).toBe(extension);

    destroy.mockRestore();
  });

  it('releases the extension on unmount', () => {
    const { extensions, Wrapper } = createPlayerWrapper();

    const { unmount } = render(<MuxData />, { wrapper: Wrapper });

    unmount();

    expect(extensions.get(MuxDataExtension)).toBeUndefined();
  });
});
