import { render } from '@testing-library/react';
import { VimeoAdapter } from '@videojs/vimeo-video';
import { createRef, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { VimeoVideo } from '../vimeo-video';

/** Flush the microtask a deferred embed waits on before it is built. */
async function flushDeferredEmbed(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

/** Render and capture the media instance the component attached its iframe to. */
function renderWithMedia(ui: ReactElement) {
  const attach = vi.spyOn(VimeoAdapter.prototype, 'attach');
  const result = render(ui);
  const media = attach.mock.contexts[0] as VimeoAdapter;

  attach.mockRestore();
  return { ...result, media };
}

describe('VimeoVideo', () => {
  it('builds the embed from the src prop', () => {
    const { container } = render(<VimeoVideo src="https://vimeo.com/1181503036" />);

    expect(container.querySelector('iframe')!.getAttribute('src')).toContain(
      'https://player.vimeo.com/video/1181503036'
    );
  });

  it('renders without a source and builds the embed when one arrives', async () => {
    // The iframe has no embed to point the player at until a source resolves.
    const { container, rerender } = render(<VimeoVideo />);
    const iframe = container.querySelector('iframe')!;

    expect(iframe.getAttribute('src')).toBe(null);

    rerender(<VimeoVideo src="https://vimeo.com/1181503036" />);
    await flushDeferredEmbed();

    expect(iframe.getAttribute('src')).toContain('https://player.vimeo.com/video/1181503036');
  });

  it('routes media event props to the media rather than the iframe', () => {
    const onPlay = vi.fn((event: Event) => event.currentTarget);
    const onTimeUpdate = vi.fn();
    const { container, media } = renderWithMedia(
      <VimeoVideo src="https://vimeo.com/1181503036" onPlay={onPlay} onTimeUpdate={onTimeUpdate} />
    );

    media.dispatchEvent(new Event('play'));
    media.dispatchEvent(new Event('timeupdate'));

    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveReturnedWith(media);
    expect(onTimeUpdate).toHaveBeenCalledTimes(1);
    expect(container.querySelector('iframe')!.hasAttribute('onplay')).toBe(false);
  });

  it('hands the attached media to mediaRef and keeps the iframe on ref', () => {
    const ref = createRef<HTMLIFrameElement>();
    let targetWhenHandedOut: HTMLIFrameElement | null | undefined;
    const mediaRef = vi.fn((adapter: VimeoAdapter | null) => {
      targetWhenHandedOut = adapter?.target;
    });
    const { container, media } = renderWithMedia(
      <VimeoVideo src="https://vimeo.com/1181503036" ref={ref} mediaRef={mediaRef} />
    );
    const iframe = container.querySelector('iframe')!;

    expect(ref.current).toBe(iframe);
    expect(mediaRef).toHaveBeenCalledExactlyOnceWith(media);
    // Already attached when handed out, so the embed is reachable from the media.
    expect(targetWhenHandedOut).toBe(iframe);
    expect(iframe.hasAttribute('mediaref')).toBe(false);
  });

  it('does not re-attach the media when the parent re-renders with a new inline mediaRef', () => {
    const attach = vi.spyOn(VimeoAdapter.prototype, 'attach');
    const detach = vi.spyOn(VimeoAdapter.prototype, 'detach');
    const received: (VimeoAdapter | null)[] = [];
    const record = (adapter: VimeoAdapter | null) => {
      received.push(adapter);
    };

    const { rerender } = render(<VimeoVideo src="https://vimeo.com/1181503036" mediaRef={(a) => record(a)} />);

    rerender(<VimeoVideo src="https://vimeo.com/1181503036" mediaRef={(a) => record(a)} />);

    expect(detach).not.toHaveBeenCalled();
    expect(attach).toHaveBeenCalledTimes(1);
    expect(received.at(-1)).toBe(attach.mock.contexts[0]);

    vi.restoreAllMocks();
  });

  it('delivers the loadstart the media dispatches while attaching', () => {
    const onLoadStart = vi.fn();

    render(<VimeoVideo src="https://vimeo.com/1181503036" onLoadStart={onLoadStart} />);

    expect(onLoadStart).toHaveBeenCalledTimes(1);
  });
});
