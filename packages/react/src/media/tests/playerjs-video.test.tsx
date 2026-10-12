import { render } from '@testing-library/react';
import { PlayerJsAdapter } from '@videojs/playerjs-video';
import { createRef, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { PlayerJsVideo } from '../playerjs-video';

const SRC = 'https://play.gumlet.io/embed/64bfb0913ed6e5096d66dc1e';

/** Flush the microtask a deferred embed waits on before it is built. */
async function flushDeferredEmbed(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

/** Render and capture the media instance the component attached its iframe to. */
function renderWithMedia(ui: ReactElement) {
  const attach = vi.spyOn(PlayerJsAdapter.prototype, 'attach');
  const result = render(ui);
  const media = attach.mock.contexts[0] as PlayerJsAdapter;

  attach.mockRestore();
  return { ...result, media };
}

describe('PlayerJsVideo', () => {
  it('renders a recognized service from the src prop with its chrome hidden', () => {
    const { container } = render(<PlayerJsVideo src={SRC} />);

    expect(container.querySelector('iframe')!.getAttribute('src')).toBe(
      `${SRC}?autoplay=false&loop=false&disable_player_controls=true`
    );
  });

  it('renders the start mute from either prop, as the adapter builds it', () => {
    const { container } = render(<PlayerJsVideo src="https://streamable.com/e/moo" muted controls loop />);

    expect(container.querySelector('iframe')!.getAttribute('src')).toBe('https://streamable.com/e/moo?muted=1');
  });

  it('renders engine options onto the embed URL and the referrer policy onto the iframe', () => {
    const { container } = render(
      <PlayerJsVideo
        controls
        source={{ src: SRC, engine: { playerJs: { player_color: '#ff0000', referrerPolicy: 'no-referrer' } } }}
      />
    );
    const iframe = container.querySelector('iframe')!;

    expect(iframe.getAttribute('src')).toBe(`${SRC}?autoplay=false&loop=false&player_color=%23ff0000`);
    expect(iframe.getAttribute('referrerpolicy')).toBe('no-referrer');
  });

  it('renders without a source and builds the embed when one arrives', async () => {
    const { container, rerender } = render(<PlayerJsVideo />);
    const iframe = container.querySelector('iframe')!;

    expect(iframe.getAttribute('src')).toBe(null);

    rerender(<PlayerJsVideo src={SRC} />);
    await flushDeferredEmbed();

    expect(iframe.getAttribute('src')).toContain(`${SRC}?`);
    expect(iframe.getAttribute('src')).toContain('disable_player_controls=true');
  });

  it('routes media event props to the media rather than the iframe', () => {
    const onPlay = vi.fn((event: Event) => event.currentTarget);
    const { container, media } = renderWithMedia(<PlayerJsVideo src={SRC} onPlay={onPlay} />);

    media.dispatchEvent(new Event('play'));

    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveReturnedWith(media);
    expect(container.querySelector('iframe')!.hasAttribute('onplay')).toBe(false);
  });

  it('hands the attached media to mediaRef and keeps the iframe on ref', () => {
    const ref = createRef<HTMLIFrameElement>();
    let targetWhenHandedOut: HTMLIFrameElement | null | undefined;
    const mediaRef = vi.fn((adapter: PlayerJsAdapter | null) => {
      targetWhenHandedOut = adapter?.target;
    });
    const { container, media } = renderWithMedia(<PlayerJsVideo src={SRC} ref={ref} mediaRef={mediaRef} />);
    const iframe = container.querySelector('iframe')!;

    expect(ref.current).toBe(iframe);
    expect(mediaRef).toHaveBeenCalledExactlyOnceWith(media);
    // Already attached when handed out, so the embed is reachable from the media.
    expect(targetWhenHandedOut).toBe(iframe);
    expect(iframe.hasAttribute('mediaref')).toBe(false);
  });

  it('delivers the loadstart the media dispatches while attaching', () => {
    const onLoadStart = vi.fn();

    render(<PlayerJsVideo src={SRC} onLoadStart={onLoadStart} />);

    expect(onLoadStart).toHaveBeenCalledTimes(1);
  });
});
