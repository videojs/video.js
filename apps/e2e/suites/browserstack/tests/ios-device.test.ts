import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { getIosDevice } from '../ios-device.ts';

const iphone = (device: string, os_version = '16') => ({ os: 'ios', os_version, device, real_mobile: true });

afterEach(() => vi.unstubAllGlobals());

describe('getIosDevice', () => {
  it('selects the same matching real iPhone regardless of API ordering', async () => {
    const devices = [
      iphone('iPhone 14'),
      iphone('iPhone 15', '17.0'),
      { ...iphone('iPhone 8'), real_mobile: false },
      iphone('iPad Pro'),
      { ...iphone('iPhone 11'), real_mobile: 'true' },
    ];
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json(devices))
      .mockResolvedValueOnce(Response.json([...devices].reverse()));

    vi.stubGlobal('fetch', fetch);

    expect(await getIosDevice('16.4', 'user', 'key')).toBe('iPhone 11');
    expect(await getIosDevice('16.4', 'user', 'key')).toBe('iPhone 11');
    expect(fetch).toHaveBeenCalledWith('https://api.browserstack.com/automate/browsers.json', {
      headers: { Authorization: `Basic ${Buffer.from('user:key').toString('base64')}` },
      signal: expect.any(AbortSignal),
    });
  });

  it('matches an exact minimum against a detailed API version', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([iphone('iPhone 14', '16.4')])));

    expect(await getIosDevice('16.4', 'user', 'key')).toBe('iPhone 14');
  });

  it('rejects a different minor version when the API provides it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([iphone('iPhone 13', '16.3')])));

    await expect(getIosDevice('16.4', 'user', 'key')).rejects.toThrow('no real iPhone');
  });

  it('fails rather than substituting a newer OS', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([iphone('iPhone 14', '17.0')])));

    await expect(getIosDevice('16.4', 'user', 'key')).rejects.toThrow(
      'no real iPhone supporting the browserslist minimum iOS 16.4'
    );
  });

  it('reports rejected credentials without exposing them', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    await expect(getIosDevice('16.4', 'user', 'key')).rejects.toThrow('HTTP 401');
  });

  it('rejects a malformed device list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ devices: [] })));

    await expect(getIosDevice('16.4', 'user', 'key')).rejects.toThrow('invalid device list');
  });
});
