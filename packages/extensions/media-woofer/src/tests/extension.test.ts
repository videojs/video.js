import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { MediaWooferExtension } from '..';

let audioState: AudioContextState = 'running';
let bassLevel = 0;

const createMediaElementSource = vi.fn((_element: HTMLMediaElement) => ({ connect: vi.fn() }));

class FakeAudioContext {
  destination = {};

  get state() {
    return audioState;
  }

  async resume() {}

  createMediaElementSource(element: HTMLMediaElement) {
    return createMediaElementSource(element);
  }

  createAnalyser() {
    return {
      fftSize: 2048,
      frequencyBinCount: 256,
      connect: vi.fn(),
      getByteFrequencyData(levels: Uint8Array) {
        levels.fill(0);
        levels[2] = bassLevel;
      },
    };
  }
}

let frames: FrameRequestCallback[] = [];

/** Run the pending animation frame, as the browser would once per paint. */
function nextFrame() {
  const pending = frames;

  frames = [];
  pending.forEach((callback) => callback(0));
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function createVideo({ src = '/video.mp4', crossOrigin }: { src?: string; crossOrigin?: string } = {}) {
  const video = document.createElement('video');
  const shake = { cancel: vi.fn() };
  const animate = vi.fn(() => shake);

  video.src = src;

  if (crossOrigin !== undefined) video.crossOrigin = crossOrigin;

  Object.assign(video, { animate });
  document.body.append(video);

  return { video, animate, shake };
}

function setPaused(video: HTMLVideoElement, paused: boolean) {
  Object.defineProperty(video, 'paused', { value: paused, configurable: true });
  video.dispatchEvent(new Event(paused ? 'pause' : 'play'));
}

async function play(video: HTMLVideoElement) {
  setPaused(video, false);
  await flush();
}

let vibrate: ReturnType<typeof vi.fn>;
let reducedMotion = false;

beforeEach(() => {
  audioState = 'running';
  bassLevel = 0;
  reducedMotion = false;
  frames = [];
  vibrate = vi.fn();
  createMediaElementSource.mockClear();

  vi.stubGlobal('AudioContext', FakeAudioContext);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback));
  vi.stubGlobal('cancelAnimationFrame', () => {
    frames = [];
  });
  vi.stubGlobal('matchMedia', () => ({ matches: reducedMotion }));
  Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('MediaWooferExtension', () => {
  it('shakes and vibrates while the bass is over the threshold', async () => {
    const { video, animate, shake } = createVideo();
    const extension = new MediaWooferExtension();

    extension.attach({ media: video, container: null });
    await play(video);

    nextFrame();
    expect(animate).not.toHaveBeenCalled();

    bassLevel = 255;
    nextFrame();
    expect(animate).toHaveBeenCalledOnce();
    expect(vibrate).toHaveBeenLastCalledWith(100);

    // Staying loud keeps the one running shake.
    nextFrame();
    expect(animate).toHaveBeenCalledOnce();

    bassLevel = 0;
    nextFrame();
    expect(shake.cancel).toHaveBeenCalledOnce();
    expect(vibrate).toHaveBeenLastCalledWith(0);
  });

  it('starts right away when the media is already playing', async () => {
    const { video, animate } = createVideo();
    const extension = new MediaWooferExtension();

    Object.defineProperty(video, 'paused', { value: false, configurable: true });
    extension.attach({ media: video, container: null });
    await flush();

    bassLevel = 255;
    nextFrame();
    expect(animate).toHaveBeenCalledOnce();
  });

  it('stops when the media pauses', async () => {
    const { video, animate, shake } = createVideo();
    const extension = new MediaWooferExtension();

    extension.attach({ media: video, container: null });
    await play(video);

    bassLevel = 255;
    nextFrame();
    setPaused(video, true);

    expect(shake.cancel).toHaveBeenCalledOnce();
    expect(frames).toHaveLength(0);

    nextFrame();
    expect(animate).toHaveBeenCalledOnce();
  });

  it('stops when detached', async () => {
    const { video, shake } = createVideo();
    const extension = new MediaWooferExtension();

    extension.attach({ media: video, container: null });
    await play(video);

    bassLevel = 255;
    nextFrame();
    extension.detach();

    expect(shake.cancel).toHaveBeenCalledOnce();
    expect(frames).toHaveLength(0);
  });

  it('only counts bass over the threshold', async () => {
    const { video, animate } = createVideo();
    const extension = new MediaWooferExtension({ threshold: 100 });

    extension.attach({ media: video, container: null });
    await play(video);

    bassLevel = 100;
    nextFrame();
    expect(animate).not.toHaveBeenCalled();

    bassLevel = 101;
    nextFrame();
    expect(animate).toHaveBeenCalledOnce();
  });

  it('does not vibrate when vibration is 0', async () => {
    const { video } = createVideo();
    const extension = new MediaWooferExtension({ vibration: 0 });

    extension.attach({ media: video, container: null });
    await play(video);

    bassLevel = 255;
    nextFrame();
    bassLevel = 0;
    nextFrame();

    expect(vibrate).not.toHaveBeenCalled();
  });

  it('vibrates without shaking when the user prefers reduced motion', async () => {
    const { video, animate } = createVideo();
    const extension = new MediaWooferExtension();

    reducedMotion = true;
    extension.attach({ media: video, container: null });
    await play(video);

    bassLevel = 255;
    nextFrame();

    expect(animate).not.toHaveBeenCalled();
    expect(vibrate).toHaveBeenLastCalledWith(100);
  });

  it('leaves cross-origin media without CORS alone', async () => {
    const { video } = createVideo({ src: 'https://example.com/video.mp4' });
    const extension = new MediaWooferExtension();

    extension.attach({ media: video, container: null });
    await play(video);

    expect(createMediaElementSource).not.toHaveBeenCalled();
    expect(frames).toHaveLength(0);
  });

  it('reads cross-origin media loaded with CORS', async () => {
    const { video } = createVideo({ src: 'https://example.com/video.mp4', crossOrigin: 'anonymous' });
    const extension = new MediaWooferExtension();

    extension.attach({ media: video, container: null });
    await play(video);

    expect(createMediaElementSource).toHaveBeenCalledWith(video);
  });

  it('does not take over the media while audio is suspended', async () => {
    const { video } = createVideo();
    const extension = new MediaWooferExtension();

    audioState = 'suspended';
    extension.attach({ media: video, container: null });
    await play(video);

    expect(createMediaElementSource).not.toHaveBeenCalled();

    // The next play after a user gesture can start audio.
    audioState = 'running';
    setPaused(video, true);
    await play(video);

    expect(createMediaElementSource).toHaveBeenCalledOnce();
  });

  it('shares one audio graph per element', async () => {
    const { video } = createVideo();
    const first = new MediaWooferExtension();
    const second = new MediaWooferExtension();

    first.attach({ media: video, container: null });
    second.attach({ media: video, container: null });
    await play(video);
    setPaused(video, true);
    await play(video);

    expect(createMediaElementSource).toHaveBeenCalledOnce();
  });

  it('does nothing without Web Audio', async () => {
    const { video } = createVideo();
    const extension = new MediaWooferExtension();

    vi.stubGlobal('AudioContext', undefined);
    extension.attach({ media: video, container: null });
    await play(video);

    expect(createMediaElementSource).not.toHaveBeenCalled();
  });
});
