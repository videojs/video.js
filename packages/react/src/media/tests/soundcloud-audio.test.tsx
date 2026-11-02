import { render } from '@testing-library/react';
import { buildSoundCloudIframeSrc, SoundCloudAdapter } from '@videojs/soundcloud-audio';
import { createRef, type ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vite-plus/test';

import { SoundCloudAudio } from '../soundcloud-audio';

const TRACK = 'https://soundcloud.com/forss/flickermood';

/** Flush the microtask a deferred widget waits on before it is built. */
async function flushDeferredWidget(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

/** Render and capture the media instance the component attached its iframe to. */
function renderWithMedia(ui: ReactElement) {
  const attach = vi.spyOn(SoundCloudAdapter.prototype, 'attach');
  const result = render(ui);
  const media = attach.mock.contexts[0] as SoundCloudAdapter;

  attach.mockRestore();
  return { ...result, media };
}

describe('SoundCloudAudio', () => {
  it('renders the widget the way the media builds it, so attaching does not reload it', () => {
    const { container } = render(<SoundCloudAudio src={TRACK} />);

    expect(container.querySelector('iframe')!.getAttribute('src')).toBe(buildSoundCloudIframeSrc(TRACK));
  });

  it('renders engine options onto the widget URL and the referrer policy onto the iframe', () => {
    const { container } = render(
      <SoundCloudAudio
        source={{ src: TRACK, engine: { soundcloud: { color: '#ff5500', referrerPolicy: 'no-referrer' } } }}
      />
    );
    const iframe = container.querySelector('iframe')!;

    expect(new URL(iframe.getAttribute('src')!).searchParams.get('color')).toBe('#ff5500');
    expect(iframe.getAttribute('referrerpolicy')).toBe('no-referrer');
  });

  it('hides the widget unless it is showing as controls', () => {
    const { container, rerender } = render(<SoundCloudAudio src={TRACK} />);
    const iframe = container.querySelector('iframe')!;

    expect(iframe.style.display).toBe('none');

    rerender(<SoundCloudAudio src={TRACK} controls />);

    expect(iframe.style.display).toBe('');
  });

  it('sizes the widget with attributes, so a style or class sizes it instead, merged with nothing it needs', () => {
    const { container, rerender } = render(
      <SoundCloudAudio src={TRACK} controls style={{ height: 20, borderRadius: 8 }} />
    );
    const iframe = container.querySelector('iframe')!;

    expect(iframe.getAttribute('width')).toBe('100%');
    expect(iframe.getAttribute('height')).toBe('166');
    expect(iframe.style.height).toBe('20px');
    expect(iframe.style.borderRadius).toBe('8px');
    expect(iframe.style.pointerEvents).toBe('');
    expect(iframe.style.display).toBe('');

    rerender(<SoundCloudAudio src={TRACK} style={{ height: 20, borderRadius: 8 }} />);

    expect(iframe.style.height).toBe('20px');
    expect(iframe.style.display).toBe('none');
  });

  it('renders without a source and builds the widget when one arrives', async () => {
    const { container, rerender } = render(<SoundCloudAudio />);
    const iframe = container.querySelector('iframe')!;

    expect(iframe.getAttribute('src')).toBe(null);

    rerender(<SoundCloudAudio src={TRACK} />);
    await flushDeferredWidget();

    expect(iframe.getAttribute('src')).toBe(buildSoundCloudIframeSrc(TRACK));
  });

  it('routes media event props to the media rather than the iframe', () => {
    const onPlay = vi.fn((event: Event) => event.currentTarget);
    const { container, media } = renderWithMedia(<SoundCloudAudio src={TRACK} onPlay={onPlay} />);

    media.dispatchEvent(new Event('play'));

    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveReturnedWith(media);
    expect(container.querySelector('iframe')!.hasAttribute('onplay')).toBe(false);
  });

  it('hands the attached media to mediaRef and keeps the iframe on ref', () => {
    const ref = createRef<HTMLIFrameElement>();
    const mediaRef = vi.fn();
    const { container, media } = renderWithMedia(<SoundCloudAudio src={TRACK} ref={ref} mediaRef={mediaRef} />);
    const iframe = container.querySelector('iframe')!;

    expect(ref.current).toBe(iframe);
    expect(mediaRef).toHaveBeenCalledExactlyOnceWith(media);
    expect(media.target).toBe(iframe);
  });

  it('renders the widget on the server and hydrates without reloading it', async () => {
    const ui = <SoundCloudAudio src={TRACK} />;
    const container = document.createElement('div');

    container.innerHTML = renderToString(ui);
    const iframe = container.querySelector('iframe')!;

    expect(iframe.getAttribute('src')).toBe(buildSoundCloudIframeSrc(TRACK));

    const assign = vi.spyOn(HTMLIFrameElement.prototype, 'src', 'set');

    render(ui, { container, hydrate: true });
    await flushDeferredWidget();

    expect(container.querySelector('iframe')).toBe(iframe);
    expect(assign).not.toHaveBeenCalled();
    assign.mockRestore();
  });

  it('accepts the autoPlay spelling of autoplay', () => {
    const { media } = renderWithMedia(<SoundCloudAudio src={TRACK} autoPlay />);

    expect(media.autoplay).toBe(true);
  });
});
