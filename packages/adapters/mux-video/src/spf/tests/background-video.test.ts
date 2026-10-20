import { describe, expect, it, vi } from 'vite-plus/test';

// Records what the Mux flavor hands the base, in place of building the engine.
const constructed: unknown[] = [];

vi.mock('@videojs/spf/adapters/hls-background-video', () => ({
  HlsBackgroundVideoAdapter: class {
    constructor(options?: unknown) {
      constructed.push(options);
    }
  },
}));

describe('MuxBackgroundVideoAdapter', () => {
  it('lays the transmux defaults under the consumer config and keeps the consumer keys', async () => {
    const { MuxBackgroundVideoAdapter } = await import('../background-video');
    const { defaultConfig } = await import('@videojs/spf/features/mpeg-ts-transmux');
    const canPlayTrack = () => true;

    new MuxBackgroundVideoAdapter({ config: { canPlayTrack } });

    expect(constructed[0]).toEqual({ config: { ...defaultConfig, canPlayTrack } });
  });
});
