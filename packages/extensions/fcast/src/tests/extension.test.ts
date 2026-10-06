import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { FCastExtension } from '../extension';
import type { FCastLoadRequest, FCastSender, FCastSnapshot } from '../sender';

class TestSender extends EventTarget implements FCastSender {
  snapshot: FCastSnapshot = {
    availability: 'available',
    connection: 'disconnected',
    paused: true,
    currentTime: 0,
    duration: 120,
    volume: 1,
    muted: false,
    speed: 1,
  };

  loads: FCastLoadRequest[] = [];
  play = vi.fn(async () => {});
  pause = vi.fn(async () => {});
  seek = vi.fn(async (_time: number) => {});
  setVolume = vi.fn(async (_volume: number) => {});
  setSpeed = vi.fn(async (_speed: number) => {});

  async prompt() {
    this.update({ connection: 'connected', deviceName: 'Living room' });
  }

  async disconnect() {
    this.update({ connection: 'disconnected' });
  }

  async load(request: FCastLoadRequest) {
    this.loads.push(request);
  }

  update(patch: Partial<FCastSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.dispatchEvent(new Event('change'));
  }
}

function setup() {
  const sender = new TestSender();
  const video = document.createElement('video');

  video.src = 'https://example.com/video.mp4';
  video.pause = vi.fn();
  video.play = vi.fn(async () => {});

  const extension = new FCastExtension({ sender });

  extension.attach({ media: video, container: null });

  return { sender, video, extension };
}

afterEach(() => vi.restoreAllMocks());

describe('FCastExtension', () => {
  it('loads the attached media on a selected receiver and routes playback controls', async () => {
    const { sender, video, extension } = setup();

    await extension.toggle();
    await extension.load();

    expect(video.pause).toHaveBeenCalledOnce();
    expect(sender.loads).toEqual([
      {
        url: 'https://example.com/video.mp4',
        contentType: 'video/mp4',
        time: 0,
        paused: true,
        volume: 1,
        speed: 1,
      },
    ]);

    await extension.mediaOverride?.play?.();
    extension.mediaOverride!.currentTime = 42;
    extension.mediaOverride!.volume = 0.5;

    expect(sender.play).toHaveBeenCalledOnce();
    expect(sender.seek).toHaveBeenCalledWith(42);
    expect(sender.setVolume).toHaveBeenCalledWith(0.5);

    extension.destroy();
  });

  it('follows a new source and restores local playback after disconnect', async () => {
    const { sender, video, extension } = setup();

    await extension.toggle();
    await extension.load();

    video.src = 'https://example.com/next.m3u8';
    video.dispatchEvent(new Event('loadstart'));
    await extension.load();

    expect(sender.loads.at(-1)).toMatchObject({
      url: 'https://example.com/next.m3u8',
      contentType: 'application/x-mpegurl',
    });

    sender.update({ currentTime: 37, paused: false, volume: 0.4 });
    await extension.toggle();

    expect(extension.mediaOverride).toBeNull();
    expect(video.currentTime).toBe(37);
    expect(video.volume).toBe(0.4);
    expect(video.play).toHaveBeenCalledOnce();

    extension.destroy();
  });

  it('keeps the player local until a sender is connected', () => {
    const { extension } = setup();

    expect(extension.mediaOverride).toBeNull();
    expect(extension.snapshot.availability).toBe('available');

    extension.destroy();
  });

  it('pauses local media when attached to an already connected sender', async () => {
    const sender = new TestSender();

    sender.update({ connection: 'connected' });

    const video = document.createElement('video');

    video.src = 'https://example.com/video.mp4';
    video.pause = vi.fn();

    const extension = new FCastExtension({ sender });

    extension.attach({ media: video, container: null });
    await extension.load();

    expect(video.pause).toHaveBeenCalledOnce();
    expect(sender.loads).toHaveLength(1);

    extension.destroy();
  });

  it('reloads ended media when the player requests play again', async () => {
    const { sender, extension } = setup();

    await extension.toggle();
    await extension.load();

    sender.update({ ended: true, paused: true });
    await extension.mediaOverride?.play?.();

    expect(sender.loads).toHaveLength(2);
    expect(sender.loads.at(-1)?.paused).toBe(false);

    extension.destroy();
  });

  it('restores local playback when the control is removed', async () => {
    const { sender, video, extension } = setup();

    await extension.toggle();
    sender.update({ currentTime: 29, paused: false });
    extension.detach();
    extension.disconnect();

    expect(video.currentTime).toBe(29);
    expect(video.play).toHaveBeenCalledOnce();
    expect(sender.snapshot.connection).toBe('disconnected');

    extension.destroy();
  });
});
