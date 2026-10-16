// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

describe('SSR-safe define imports', () => {
  it('imports the package API without browser-only globals', async () => {
    await expect(import('../../index')).resolves.toBeDefined();
  });

  it('imports video skin without browser-only globals', async () => {
    await expect(import('../video/skin')).resolves.toBeDefined();
  });

  it('imports preset APIs without browser-only globals', async () => {
    await expect(
      Promise.all([
        import('../../presets/video'),
        import('../../presets/audio'),
        import('../../presets/live-video'),
        import('../../presets/live-audio'),
        import('../../presets/background'),
      ])
    ).resolves.toHaveLength(5);
  });

  it('imports hls-video without browser-only globals', async () => {
    await expect(import('../media/hls-video')).resolves.toBeDefined();
  });

  it('imports soundcloud-audio without browser-only globals', async () => {
    await expect(import('../media/soundcloud-audio')).resolves.toBeDefined();
  });

  it('imports background videos without browser-only globals', async () => {
    await expect(import('../background/video')).resolves.toBeDefined();
    await expect(import('../media/hls-background-video')).resolves.toBeDefined();
  });

  it('imports extensions without browser-only globals', async () => {
    await expect(import('../extensions/google-cast')).resolves.toBeDefined();
    await expect(import('../extensions/mux-data')).resolves.toBeDefined();
  });
});
