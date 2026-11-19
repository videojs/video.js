import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const loadScript = vi.fn<(src: string) => Promise<void>>();

vi.mock('@videojs/utils/dom', () => ({ loadScript }));

const API = { createPlayer: vi.fn(), events: {} };

// The loader keeps its in-flight load at module level, so each test takes a fresh copy of the module.
async function importLoader() {
  vi.resetModules();
  return (await import('../sdk-api')).loadDailymotionApi;
}

beforeEach(() => {
  loadScript.mockReset();
});

afterEach(() => {
  delete (globalThis as { dailymotion?: unknown }).dailymotion;
});

describe('loadDailymotionApi', () => {
  it('reuses an SDK already on the page', async () => {
    const loadDailymotionApi = await importLoader();

    (globalThis as { dailymotion?: unknown }).dailymotion = API;

    await expect(loadDailymotionApi('x8lr5')).resolves.toBe(API);
    expect(loadScript).not.toHaveBeenCalled();
  });

  it('loads the library over a global that is not the SDK, such as an element with that id', async () => {
    const loadDailymotionApi = await importLoader();

    (globalThis as { dailymotion?: unknown }).dailymotion = { createPlayer: document.createElement('input') };
    loadScript.mockImplementationOnce(async () => {
      (globalThis as { dailymotion?: unknown }).dailymotion = API;
    });

    await expect(loadDailymotionApi('x8lr5')).resolves.toBe(API);
    expect(loadScript).toHaveBeenCalledOnce();
  });

  it('loads one library for hosts naming different player configurations at once', async () => {
    const loadDailymotionApi = await importLoader();

    loadScript.mockImplementation(async () => {
      (globalThis as { dailymotion?: unknown }).dailymotion = API;
    });

    const [first, second] = await Promise.all([loadDailymotionApi('x8lr5'), loadDailymotionApi('xother')]);

    expect(loadScript).toHaveBeenCalledExactlyOnceWith('https://geo.dailymotion.com/libs/player/x8lr5.js');
    expect(first).toBe(API);
    expect(second).toBe(API);
  });

  it('retries a failed load on the next call', async () => {
    const loadDailymotionApi = await importLoader();

    loadScript.mockRejectedValueOnce(new Error('offline'));

    const first = loadDailymotionApi('x8lr5');
    const concurrent = loadDailymotionApi('x8lr5');

    await expect(first).rejects.toThrow('offline');
    await expect(concurrent).rejects.toThrow('offline');

    loadScript.mockImplementationOnce(async () => {
      (globalThis as { dailymotion?: unknown }).dailymotion = API;
    });

    await expect(loadDailymotionApi('x8lr5')).resolves.toBe(API);
    expect(loadScript).toHaveBeenCalledTimes(2);
  });

  it('rejects when the library loads without installing the SDK', async () => {
    const loadDailymotionApi = await importLoader();

    loadScript.mockResolvedValueOnce();

    await expect(loadDailymotionApi('x8lr5')).rejects.toThrow('Dailymotion Web SDK failed to load');
  });
});
