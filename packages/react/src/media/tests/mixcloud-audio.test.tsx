import { render } from '@testing-library/react';
import { buildMixcloudIframeSrc, MixcloudAdapter } from '@videojs/mixcloud-audio';
import { createRef, type ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vite-plus/test';

import { MixcloudAudio } from '../mixcloud-audio';

const SHOW = 'https://www.mixcloud.com/spartacus/lambiance/';

/** Flush the microtask a deferred widget waits on before it is built. */
async function flushDeferredWidget(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

/** Render and capture the media instance the component attached its iframe to. */
function renderWithMedia(ui: ReactElement) {
  const attach = vi.spyOn(MixcloudAdapter.prototype, 'attach');
  const result = render(ui);
  const media = attach.mock.contexts[0] as MixcloudAdapter;

  attach.mockRestore();
  return { ...result, media };
}

describe('MixcloudAudio', () => {
  it('renders the widget the way the media builds it, so attaching does not reload it', () => {
    const { container } = render(<MixcloudAudio src={SHOW} />);

    expect(container.querySelector('iframe')!.getAttribute('src')).toBe(buildMixcloudIframeSrc(SHOW));
  });

  it('renders engine options onto the widget URL and the referrer policy onto the iframe', () => {
    const { container } = render(
      <MixcloudAudio source={{ src: SHOW, engine: { mixcloud: { light: true, referrerPolicy: 'no-referrer' } } }} />
    );
    const iframe = container.querySelector('iframe')!;

    expect(new URL(iframe.getAttribute('src')!).searchParams.get('light')).toBe('1');
    expect(iframe.getAttribute('referrerpolicy')).toBe('no-referrer');
  });

  it('hides the widget unless it is showing as controls', () => {
    const { container, rerender } = render(<MixcloudAudio src={SHOW} />);
    const iframe = container.querySelector('iframe')!;

    expect(iframe.style.display).toBe('none');

    rerender(<MixcloudAudio src={SHOW} controls />);

    expect(iframe.style.display).toBe('');
  });

  it('sizes the widget with attributes, so a style or class sizes it instead, merged with nothing it needs', () => {
    const { container, rerender } = render(
      <MixcloudAudio src={SHOW} controls style={{ height: 60, borderRadius: 8 }} />
    );
    const iframe = container.querySelector('iframe')!;

    expect(iframe.getAttribute('width')).toBe('100%');
    expect(iframe.getAttribute('height')).toBe('120');
    expect(iframe.style.height).toBe('60px');
    expect(iframe.style.borderRadius).toBe('8px');
    expect(iframe.style.display).toBe('');

    rerender(<MixcloudAudio src={SHOW} style={{ height: 60, borderRadius: 8 }} />);

    expect(iframe.style.height).toBe('60px');
    expect(iframe.style.display).toBe('none');
  });

  it('renders an empty frame under preload="none" and loads the widget on play()', async () => {
    const { container, media } = renderWithMedia(<MixcloudAudio src={SHOW} preload="none" />);
    const iframe = container.querySelector('iframe')!;

    await flushDeferredWidget();

    expect(iframe.getAttribute('src')).toBe(null);

    await media.play();

    expect(iframe.getAttribute('src')).toBe(buildMixcloudIframeSrc(SHOW));
  });

  it('renders without a source and builds the widget when one arrives', async () => {
    const { container, rerender } = render(<MixcloudAudio />);
    const iframe = container.querySelector('iframe')!;

    expect(iframe.getAttribute('src')).toBe(null);

    rerender(<MixcloudAudio src={SHOW} />);
    await flushDeferredWidget();

    expect(iframe.getAttribute('src')).toBe(buildMixcloudIframeSrc(SHOW));
  });

  it('routes media event props to the media rather than the iframe', () => {
    const onPlay = vi.fn((event: Event) => event.currentTarget);
    const { container, media } = renderWithMedia(<MixcloudAudio src={SHOW} onPlay={onPlay} />);

    media.dispatchEvent(new Event('play'));

    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveReturnedWith(media);
    expect(container.querySelector('iframe')!.hasAttribute('onplay')).toBe(false);
  });

  it('hands the attached media to mediaRef and keeps the iframe on ref', () => {
    const ref = createRef<HTMLIFrameElement>();
    const mediaRef = vi.fn();
    const { container, media } = renderWithMedia(<MixcloudAudio src={SHOW} ref={ref} mediaRef={mediaRef} />);
    const iframe = container.querySelector('iframe')!;

    expect(ref.current).toBe(iframe);
    expect(mediaRef).toHaveBeenCalledExactlyOnceWith(media);
    expect(media.target).toBe(iframe);
  });

  it('renders the widget on the server and hydrates without reloading it', async () => {
    const ui = <MixcloudAudio src={SHOW} />;
    const container = document.createElement('div');

    container.innerHTML = renderToString(ui);
    const iframe = container.querySelector('iframe')!;

    expect(iframe.getAttribute('src')).toBe(buildMixcloudIframeSrc(SHOW));

    const assign = vi.spyOn(HTMLIFrameElement.prototype, 'src', 'set');

    render(ui, { container, hydrate: true });
    await flushDeferredWidget();

    expect(container.querySelector('iframe')).toBe(iframe);
    expect(assign).not.toHaveBeenCalled();
    assign.mockRestore();
  });

  it('accepts the autoPlay spelling of autoplay', () => {
    const { media } = renderWithMedia(<MixcloudAudio src={SHOW} autoPlay />);

    expect(media.autoplay).toBe(true);
  });
});
