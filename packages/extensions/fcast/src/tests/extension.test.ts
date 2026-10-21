import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { FCastExtension } from '../extension';
import type { FCastLoadRequest, FCastSender, FCastSnapshot } from '../sender';

class TestSender extends EventTarget implements FCastSender {
  snapshot: FCastSnapshot = {
    availability: 'available',
    connection: 'disconnected',
    playbackState: 'idle',
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
    this.update({
      playbackState: request.paused ? 'paused' : 'playing',
      paused: request.paused,
      mediaUrl: request.url,
    });
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

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('FCastExtension', () => {
  it('completes player seeks from receiver progress and releases failed or interrupted seeks', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { sender, video, extension } = setup();
    const coordinator = new PlayerExtensionCoordinator(() => {});

    coordinator.register(extension);
    coordinator.attach({ media: video, container: null });
    await extension.toggle();
    await extension.load();
    const store = createStore<PlayerTarget>()(timeFeature);
    const detach = store.attach({ media: coordinator.getStoreMedia(video), container: null });

    const seeking = store.seek(42);

    expect(store.state.seeking).toBe(true);
    sender.update({ currentTime: 1 });
    expect(store.state.seeking).toBe(true);
    sender.update({ currentTime: 42.2 });
    await expect(seeking).resolves.toBe(42.2);
    expect(store.state.seeking).toBe(false);

    sender.seek.mockRejectedValueOnce(new Error('Seek failed'));
    await store.seek(60);
    expect(store.state.seeking).toBe(false);
    expect(store.state.currentTime).toBe(42.2);

    let rejectOld!: (error: Error) => void;

    sender.seek.mockReturnValueOnce(
      new Promise<void>((_resolve, reject) => {
        rejectOld = reject;
      })
    );
    const oldSeek = store.seek(20);
    const newSeek = store.seek(60);

    rejectOld(new Error('Superseded'));
    await oldSeek;
    expect(store.state.seeking).toBe(true);
    sender.update({ currentTime: 60 });
    await newSeek;
    expect(store.state.seeking).toBe(false);

    await store.seek(60);
    expect(store.state.seeking).toBe(false);

    const timeout = store.seek(80);

    await vi.advanceTimersByTimeAsync(10_000);
    await timeout;
    expect(store.state.seeking).toBe(false);

    const disconnected = store.seek(90);

    await extension.toggle();
    await disconnected;
    expect(store.state.seeking).toBe(false);
    detach();
    extension.destroy();
  });

  it('keeps controls visible for FCast without replacing the native remote picker', async () => {
    vi.useFakeTimers();
    const { sender, video, extension } = setup();
    const remote = Object.assign(new EventTarget(), { state: 'disconnected', prompt: vi.fn() });

    Object.defineProperty(video, 'remote', { value: remote });
    const coordinator = new PlayerExtensionCoordinator(() => {});

    coordinator.register(extension);
    coordinator.attach({ media: video, container: null });
    const media = coordinator.getStoreMedia(video);
    const container = document.createElement('div');
    const store = createStore<PlayerTarget>()(controlsFeature);
    const detach = store.attach({ media, container });

    await extension.toggle();
    await extension.load();
    sender.update({ playbackState: 'playing', paused: false });
    container.dispatchEvent(new Event('mouseleave'));
    vi.advanceTimersByTime(2000);
    expect(store.state.controlsVisible).toBe(true);
    expect(media.remote).toBe(remote);
    detach();
    extension.destroy();
  });

  it('adopts matching receiver media without restarting it and loads a different source', async () => {
    const { sender, video, extension } = setup();

    sender.update({
      connection: 'connected',
      mediaUrl: video.src,
      playbackState: 'playing',
      paused: false,
      currentTime: 75,
    });
    await extension.load();
    expect(sender.loads).toHaveLength(0);
    expect(extension.mediaOverride?.currentTime).toBe(75);
    expect(extension.mediaOverride?.readyState).toBe(3);

    extension.src = 'https://example.com/other.mp4';
    await extension.load();
    expect(sender.loads).toHaveLength(1);
    expect(sender.loads[0]?.url).toBe('https://example.com/other.mp4');
    extension.destroy();
  });

  it('reports media readiness independently of connection and load command completion', async () => {
    const { sender, video, extension } = setup();
    const metadata = vi.fn();

    video.addEventListener('loadedmetadata', metadata);
    vi.spyOn(sender, 'load').mockResolvedValue(undefined);
    await extension.toggle();
    await extension.load();
    expect(extension.mediaOverride?.readyState).toBe(0);
    expect(metadata).not.toHaveBeenCalled();

    sender.update({ playbackState: 'buffering', mediaUrl: video.src });
    expect(extension.mediaOverride?.readyState).toBe(2);
    expect(metadata).toHaveBeenCalledOnce();
    sender.update({ playbackState: 'playing', paused: false });
    expect(extension.mediaOverride?.readyState).toBe(3);
    sender.update({ playbackState: 'ended' });
    expect(extension.mediaOverride?.ended).toBe(true);
    expect(extension.mediaOverride?.paused).toBe(true);
    sender.update({ playbackState: 'idle' });
    expect(extension.mediaOverride?.readyState).toBe(0);
    extension.destroy();
  });

  it('forwards external captions and metadata and synchronizes receiver selection', async () => {
    const { sender, video, extension } = setup();
    const setSubtitle = vi.fn(async () => {});

    Object.assign(sender, { setSubtitle });
    const tracks = new EventTarget();

    Object.defineProperty(video, 'textTracks', { value: tracks });
    const track = document.createElement('track');
    const textTrack = { mode: 'showing' };

    track.kind = 'subtitles';
    track.src = 'https://example.com/en.vtt';
    track.label = 'English';
    track.srclang = 'en';
    Object.defineProperty(track, 'track', { value: textTrack });
    video.append(track);
    video.title = 'Example';
    video.poster = 'https://example.com/poster.jpg';
    await extension.toggle();
    await extension.load();
    expect(sender.loads[0]).toMatchObject({
      metadata: { title: 'Example', thumbnailUrl: video.poster },
      subtitles: [{ url: track.src, label: 'English', language: 'en', kind: 'subtitles' }],
      selectedSubtitle: track.src,
    });

    textTrack.mode = 'disabled';
    tracks.dispatchEvent(new Event('change'));
    expect(setSubtitle).toHaveBeenLastCalledWith(null);
    sender.update({ selectedSubtitle: track.src });
    expect(textTrack.mode).toBe('showing');
    tracks.dispatchEvent(new Event('change'));
    expect(setSubtitle).toHaveBeenCalledOnce();
    extension.detach();
    textTrack.mode = 'disabled';
    tracks.dispatchEvent(new Event('change'));
    expect(setSubtitle).toHaveBeenCalledOnce();
    extension.destroy();
  });

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

    sender.update({ currentTime: 37, playbackState: 'playing', paused: false, volume: 0.4 });
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

    sender.update({ playbackState: 'ended', ended: true, paused: true });
    await extension.mediaOverride?.play?.();

    expect(sender.loads).toHaveLength(2);
    expect(sender.loads.at(-1)?.paused).toBe(false);

    extension.destroy();
  });

  it('restores local playback when the control is removed', async () => {
    const { sender, video, extension } = setup();

    await extension.toggle();
    sender.update({ currentTime: 29, playbackState: 'playing', paused: false });
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
    sender.update({ playbackState: 'ended', ended: true, currentTime: 120, volume: 0.4, speed: 2 });
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
    sender.update({ playbackState: 'buffering', buffering: true });
    sender.update({ playbackState: sender.snapshot.paused ? 'paused' : 'playing', buffering: false });
    expect(playing).not.toHaveBeenCalled();
    sender.update({ playbackState: 'playing', paused: false });
    expect(playing).toHaveBeenCalledOnce();
    sender.update({ playbackState: 'buffering', buffering: true });
    sender.update({ playbackState: sender.snapshot.paused ? 'paused' : 'playing', buffering: false });
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
import { controlsFeature, PlayerExtensionCoordinator, type PlayerTarget, timeFeature } from '@videojs/core/dom';
import { createStore } from '@videojs/store';
