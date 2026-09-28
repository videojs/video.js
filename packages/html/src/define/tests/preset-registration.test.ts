import { afterAll, beforeAll, describe, expect, it, type MockInstance, vi } from 'vite-plus/test';

describe('preset registration boundaries', () => {
  let define: MockInstance;

  function registeredSince(offset: number): string[] {
    return define.mock.calls.slice(offset).map(([tag]) => String(tag));
  }

  beforeAll(() => {
    define = vi.spyOn(customElements, 'define');
  });

  afterAll(() => {
    define.mockRestore();
  });

  it('video/ui registers the container and UI without the player or skin', async () => {
    const before = define.mock.calls.length;

    await import('../video/ui');
    const registered = registeredSince(before);

    expect(registered).toContain('media-container');
    expect(registered).toContain('media-play-button');
    expect(registered).not.toContain('video-player');
    expect(registered).not.toContain('video-skin');
  });

  it('video/skin adds the skin without the player', async () => {
    const before = define.mock.calls.length;

    await import('../video/skin');

    const registered = registeredSince(before);

    expect(registered).toContain('video-skin');
    expect(registered).not.toContain('video-player');
  });

  it('video/player registers only the player', async () => {
    const before = define.mock.calls.length;

    await import('../video/player');

    expect(registeredSince(before)).toEqual(['video-player']);
  });

  it.each([
    ['audio', 'audio-skin', 'audio-player', () => import('../audio/skin')],
    ['live-video', 'live-video-skin', 'live-video-player', () => import('../live-video/skin')],
    ['live-audio', 'live-audio-skin', 'live-audio-player', () => import('../live-audio/skin')],
    ['background', 'background-video-skin', 'background-video-player', () => import('../background/skin')],
  ])('%s/skin registers the skin without the player', async (_, skinTag, playerTag, load) => {
    const before = define.mock.calls.length;

    await load();
    const registered = registeredSince(before);

    expect(registered).toContain(skinTag);
    expect(registered).not.toContain(playerTag);
  });

  it.each([
    ['video/minimal-skin', 'video-minimal-skin', () => import('../video/minimal-skin')],
    ['audio/minimal-skin', 'audio-minimal-skin', () => import('../audio/minimal-skin')],
    ['live-video/minimal-skin', 'live-video-minimal-skin', () => import('../live-video/minimal-skin')],
    ['live-audio/minimal-skin', 'live-audio-minimal-skin', () => import('../live-audio/minimal-skin')],
  ])('%s registers its exact UI closure and skin without the player', async (entry, skinTag, load) => {
    const before = define.mock.calls.length;

    await load();

    const registered = registeredSince(before);

    expect(registered).toContain(skinTag);
    expect(registered).not.toContain(`${entry.split('/')[0]}-player`);
  });

  it.each([
    ['audio', 'audio-player', () => import('../audio/player')],
    ['live-video', 'live-video-player', () => import('../live-video/player')],
    ['live-audio', 'live-audio-player', () => import('../live-audio/player')],
    ['background', 'background-video-player', () => import('../background/player')],
  ])('%s/player registers only the player', async (_, playerTag, load) => {
    const before = define.mock.calls.length;

    await load();

    expect(registeredSince(before)).toEqual([playerTag]);
  });
});
