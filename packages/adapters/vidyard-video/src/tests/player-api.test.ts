import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { destroyVidyardPlayer, loadVidyardApi, type VidyardApi, type VidyardPlayerApi } from '../player-api';

const loadScript = vi.hoisted(() => vi.fn<(src: string) => Promise<void>>());

vi.mock('@videojs/utils/dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@videojs/utils/dom')>()),
  loadScript,
}));

function fakeApi(): VidyardApi {
  return { api: { renderPlayer: vi.fn(), destroyPlayer: vi.fn() }, players: [] };
}

afterEach(() => {
  delete (globalThis as { VidyardV4?: unknown }).VidyardV4;
  loadScript.mockReset();
});

describe('loadVidyardApi', () => {
  it('reuses an embed script the page already loaded', async () => {
    const api = fakeApi();

    (globalThis as { VidyardV4?: unknown }).VidyardV4 = api;

    await expect(loadVidyardApi()).resolves.toBe(api);
    expect(loadScript).not.toHaveBeenCalled();
  });

  it('loads the embed script once for every caller waiting on it', async () => {
    const api = fakeApi();

    loadScript.mockImplementation(async () => {
      (globalThis as { VidyardV4?: unknown }).VidyardV4 = api;
    });

    const [first, second] = await Promise.all([loadVidyardApi(), loadVidyardApi()]);

    expect(first).toBe(api);
    expect(second).toBe(api);
    expect(loadScript).toHaveBeenCalledOnce();
  });

  it('retries after a failed load', async () => {
    loadScript.mockRejectedValueOnce(new Error('blocked'));

    await expect(loadVidyardApi()).rejects.toThrow('blocked');

    const api = fakeApi();

    loadScript.mockImplementation(async () => {
      (globalThis as { VidyardV4?: unknown }).VidyardV4 = api;
    });

    await expect(loadVidyardApi()).resolves.toBe(api);
  });

  it('fails when the script loads without installing the API', async () => {
    loadScript.mockResolvedValueOnce();

    await expect(loadVidyardApi()).rejects.toThrow('The Vidyard embed script failed to load');
  });
});

describe('destroyVidyardPlayer', () => {
  it('keeps the players registered after the destroyed one, which Vidyard drops', () => {
    const api = fakeApi();
    const [first, second, third] = [{}, {}, {}] as VidyardPlayerApi[];

    api.players.push(first!, second!, third!);
    vi.mocked(api.api.destroyPlayer).mockImplementation((player) => {
      api.players.splice(api.players.indexOf(player));
    });

    destroyVidyardPlayer(api, second!);

    expect(api.api.destroyPlayer).toHaveBeenCalledWith(second);
    expect(api.players).toEqual([first, third]);
  });

  it('survives a player Vidyard fails to destroy', () => {
    const api = fakeApi();
    const player = {} as VidyardPlayerApi;

    api.players.push(player);
    vi.mocked(api.api.destroyPlayer).mockImplementation(() => {
      throw new TypeError('container is null');
    });

    expect(() => destroyVidyardPlayer(api, player)).not.toThrow();
  });
});
