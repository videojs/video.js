import '@videojs/html/media/background-video';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vite-plus/test';

describe('BasicUsage', () => {
  let preference: MediaQueryList;
  let addListener: MockInstance<typeof document.addEventListener>;

  beforeEach(() => {
    vi.resetModules();
    // SAFETY: The demo uses only `matches` and the standard EventTarget methods supplied here.
    preference = Object.assign(new window.EventTarget(), { matches: false }) as MediaQueryList;
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => preference)
    );
    addListener = vi.spyOn(document, 'addEventListener');
  });

  afterEach(() => {
    document.dispatchEvent(new Event('astro:before-swap'));

    for (const [type, listener] of addListener.mock.calls) document.removeEventListener(type, listener);

    document.body.innerHTML = '';
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function addDemo() {
    const hero = document.createElement('section');

    hero.className = 'add-background-video-html-demo';
    hero.innerHTML = '<background-video noautoplay></background-video><button data-motion-toggle></button>';
    document.body.append(hero);

    const video = hero.querySelector('background-video')!.target!;
    const play = vi.spyOn(video, 'play').mockResolvedValue();
    const pause = vi.spyOn(video, 'pause').mockImplementation(() => {});

    return { hero, video, play, pause, button: hero.querySelector('button')! };
  }

  it('does nothing when the HTML demo is absent', async () => {
    await expect(import('../BasicUsage')).resolves.toBeDefined();
    expect(window.matchMedia).not.toHaveBeenCalled();
  });

  it('initializes the demo when client navigation adds its markup', async () => {
    await import('../BasicUsage');
    const { hero, play, button } = addDemo();

    document.dispatchEvent(new Event('astro:page-load'));

    expect(play).toHaveBeenCalledOnce();
    expect(hero).toHaveAttribute('data-motion-enabled');
    expect(button).toHaveTextContent('Hide background motion');
  });

  it('initializes each host once and keeps their controls independent', async () => {
    const first = addDemo();
    const second = addDemo();

    await import('../BasicUsage');

    document.dispatchEvent(new Event('astro:page-load'));
    first.button.click();

    expect(first.play).toHaveBeenCalledOnce();
    expect(second.play).toHaveBeenCalledOnce();
    expect(first.hero).not.toHaveAttribute('data-motion-enabled');
    expect(second.hero).toHaveAttribute('data-motion-enabled');
  });

  it('stops playback and removes the preference listener before navigation', async () => {
    const { hero, play, pause } = addDemo();

    await import('../BasicUsage');

    document.dispatchEvent(new Event('astro:before-swap'));
    preference.dispatchEvent(new Event('change'));

    expect(pause).toHaveBeenCalledOnce();
    expect(play).toHaveBeenCalledOnce();
    expect(hero).not.toHaveAttribute('data-motion-enabled');
  });

  it.each(['AbortError', 'NotAllowedError'])('ignores a stale %s after motion is enabled again', async (name) => {
    const { hero, play, button } = addDemo();
    let rejectPlay!: (reason: DOMException) => void;
    const pendingPlay = new Promise<void>((_resolve, reject) => {
      rejectPlay = reject;
    });

    play.mockReturnValueOnce(pendingPlay);
    await import('../BasicUsage');

    button.click();
    button.click();
    rejectPlay(new DOMException('Playback interrupted', name));
    await Promise.resolve();

    expect(play).toHaveBeenCalledTimes(2);
    expect(hero).toHaveAttribute('data-motion-enabled');
    expect(button).toHaveTextContent('Hide background motion');
  });

  it('shows the poster when the current play request fails', async () => {
    const { hero, play, button } = addDemo();

    play.mockRejectedValueOnce(new DOMException('Playback blocked', 'NotAllowedError'));

    await import('../BasicUsage');

    expect(hero).not.toHaveAttribute('data-motion-enabled');
    expect(button).toHaveTextContent('Show background motion');
  });
});
