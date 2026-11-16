import { render } from '@testing-library/react';
import { MuxVideoAdapter } from '@videojs/mux-video';
import { MuxVideoAdapter as SpfMuxVideoAdapter } from '@videojs/mux-video/spf';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { MuxVideo } from '../mux-video';
import { MuxVideo as HlsJsMuxVideo } from '../mux-video/hls-js';
import { MuxVideo as SpfMuxVideo } from '../mux-video/spf';

/** Render and capture the Media instance the `source` prop was written to. */
function renderWithMedia(ui: ReactElement) {
  const source = vi.spyOn(MuxVideoAdapter.prototype, 'source', 'set');
  const result = render(ui);
  const media = source.mock.contexts[0] as InstanceType<typeof MuxVideoAdapter>;

  source.mockRestore();
  return { ...result, media };
}

// The SPF-backed Media opens a MediaSource on the attached element and fetches the manifest and the asset metadata as
// soon as a source is assigned. The DOM stand-in has no MSE, and no test here should reach the network. Stubbed for the
// whole file rather than per test: the engine reacts on a microtask, which can land after a test's own teardown.
vi.stubGlobal('MediaSource', class extends EventTarget {});
vi.stubGlobal(
  'fetch',
  vi.fn(async () => new Response('', { status: 404 }))
);
vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mux-video-test');
vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
// jsdom reports the media element's `load()` as unimplemented each time the engine resets the element.
vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});

describe('MuxVideo', () => {
  it('is the SPF-backed flavor by default', () => {
    expect(MuxVideo).toBe(SpfMuxVideo);
    expect(MuxVideo).not.toBe(HlsJsMuxVideo);
    expect(MuxVideoAdapter).toBe(SpfMuxVideoAdapter);

    const { media } = renderWithMedia(<MuxVideo source={{ playbackId: 'abc123' }} />);

    expect(media).toBeInstanceOf(SpfMuxVideoAdapter);
  });

  it('does not spread the source prop onto the element', () => {
    const { container } = render(<MuxVideo source={{ playbackId: 'abc123' }} />);

    expect(container.querySelector('video')!.hasAttribute('source')).toBe(false);
  });

  it('applies the customDomain and playback params to src', () => {
    const { media } = renderWithMedia(
      <MuxVideo source={{ playbackId: 'abc123', customDomain: 'example.com', playback: { maxResolution: '1080p' } }} />
    );

    const url = new URL(media.src);

    expect(url.host).toBe('stream.example.com');
    expect(url.searchParams.get('max_resolution')).toBe('1080p');
  });

  it('adds a storyboard track inferred from the source prop', async () => {
    const { container } = render(<MuxVideo source={{ playbackId: 'abc123' }} />);

    await vi.waitFor(() => {
      expect(container.querySelector('track')?.getAttribute('src')).toBe(
        'https://image.mux.com/abc123/storyboard.vtt?format=webp'
      );
    });
  });
});
