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

  it('does not send queued loads after disconnect or sender replacement', async () => {
    const { sender, extension } = setup();
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const load = vi.spyOn(sender, 'load').mockReturnValueOnce(pending);

    await extension.toggle();
    await vi.waitFor(() => expect(load).toHaveBeenCalledOnce());
    extension.src = 'https://example.com/stale.mp4';
    const stale = extension.load();
    const replacement = new TestSender();

    extension.sender = replacement;
    await extension.toggle();
    await extension.load();

    expect(replacement.loads).toHaveLength(1);
    finish();
    await stale;
    expect(load).toHaveBeenCalledOnce();
    extension.destroy();
  });

  it('preserves remote volume and speed across sources and restores the last audible volume', async () => {
    const { sender, extension } = setup();

    await extension.toggle();
    await extension.load();
    sender.update({ volume: 0.35, speed: 1.5 });
    extension.mediaOverride!.muted = true;
    sender.update({ volume: 0, muted: true });
    extension.mediaOverride!.muted = false;
    expect(sender.setVolume).toHaveBeenLastCalledWith(0.35);

    extension.src = 'https://example.com/next.mp4';
    await extension.load();
    expect(sender.loads.at(-1)).toMatchObject({ volume: 0, speed: 1.5 });
    extension.destroy();
  });

  it('replays from zero even when local playback was handed off mid-stream', async () => {
    const { sender, video, extension } = setup();

    video.currentTime = 45;
    await extension.toggle();
    await extension.load();
    sender.update({ ended: true, currentTime: 120, volume: 0.4, speed: 2 });
    await extension.mediaOverride!.play!();
    expect(sender.loads.at(-1)).toMatchObject({ time: 0, paused: false, volume: 0.4, speed: 2 });
    extension.destroy();
  });

  it('does not take over media that disables remote playback', async () => {
    const { sender, video, extension } = setup();

    video.disableRemotePlayback = true;
    sender.update({ connection: 'connected' });
    await extension.load();
    expect(sender.loads).toHaveLength(0);
    expect(extension.mediaOverride).toBeNull();
    expect(video.pause).not.toHaveBeenCalled();
    await expect(extension.toggle()).rejects.toMatchObject({ name: 'InvalidStateError' });
    extension.destroy();
  });

  it('cancels a pending connection when destroyed', () => {
    const { sender, extension } = setup();

    sender.update({ connection: 'connecting' });
    extension.destroy();
    expect(sender.snapshot.connection).toBe('disconnected');
  });

  it('publishes command failures and retries a failed initial load with its original playing state', async () => {
    const { sender, video, extension } = setup();

    vi.spyOn(video, 'paused', 'get').mockReturnValue(false);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const failure = new Error('Receiver unavailable');

    vi.spyOn(sender, 'load').mockRejectedValueOnce(failure);
    const onError = vi.fn();

    extension.addEventListener('error', onError);
    await extension.toggle();
    await expect(extension.load()).rejects.toThrow(failure);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ detail: failure }));
    await extension.load();
    expect(sender.loads.at(-1)?.paused).toBe(false);
    extension.destroy();
  });

  it('emits playing only for resumed playback, including after buffering', async () => {
    const { sender, video, extension } = setup();
    const playing = vi.fn();

    video.addEventListener('playing', playing);
    await extension.toggle();
    await extension.load();
    sender.update({ buffering: true });
    sender.update({ buffering: false });
    expect(playing).not.toHaveBeenCalled();
    sender.update({ paused: false });
    expect(playing).toHaveBeenCalledOnce();
    sender.update({ buffering: true });
    sender.update({ buffering: false });
    expect(playing).toHaveBeenCalledTimes(2);
    extension.destroy();
  });

  it('forwards bridge errors and removes listeners from replaced senders', () => {
    const { sender, extension } = setup();

    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();

    extension.addEventListener('error', onError);
    const error = new Error('Transport lost');

    sender.dispatchEvent(new CustomEvent('error', { detail: error }));
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ detail: error }));
    extension.sender = undefined;
    sender.dispatchEvent(new CustomEvent('error', { detail: error }));
    expect(onError).toHaveBeenCalledOnce();
    extension.destroy();
  });
});
