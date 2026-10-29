import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import '../../define/media/lazy-audio';

function create(src: string): HTMLElement {
  const element = document.createElement('lazy-audio');

  element.setAttribute('src', src);
  document.body.append(element);

  return element;
}

describe('LazyAudio', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders a native audio for a file', async () => {
    const element = create('/song.mp3');

    await vi.waitFor(() => expect(element.querySelector('audio')).not.toBeNull());

    expect(element.querySelector('audio')!.getAttribute('preload')).toBe('none');
  });

  it('loads Mux audio for a Mux stream', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {}))
    );
    const element = create('https://stream.mux.com/a4nOgmxGWg6gULfcBbAa00gXyfcwPnAFldF8RdsNyk8M.m3u8');

    // The first import of an engine can be slow under a full test run.
    await vi.waitFor(() => expect(element.querySelector('mux-audio')).not.toBeNull(), { timeout: 5000 });

    expect(customElements.get('mux-audio')).toBeDefined();
  });

  it('loads SoundCloud audio for a SoundCloud URL', async () => {
    const element = create('https://soundcloud.com/forss/flickermood');

    await vi.waitFor(() => expect(element.querySelector('soundcloud-audio')).not.toBeNull(), { timeout: 5000 });

    expect(customElements.get('soundcloud-audio')).toBeDefined();
  });

  it('loads Mixcloud audio for a Mixcloud URL', async () => {
    const element = create('https://www.mixcloud.com/spartacus/lambiance/');

    await vi.waitFor(() => expect(element.querySelector('mixcloud-audio')).not.toBeNull(), { timeout: 5000 });

    expect(customElements.get('mixcloud-audio')).toBeDefined();
  });

  it('reports a source no audio media plays', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const element = create('https://vimeo.com/76979871');

    await vi.waitFor(() => expect(error).toHaveBeenCalledWith(expect.stringContaining('[lazy-audio]')));
    expect(element.children).toHaveLength(0);
  });
});
