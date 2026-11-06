import type { PlayoutDecision } from '@caprid/moq-media';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { canvasRenderer, createVideoPlayer, type VideoPlayerFrame } from '../video-player';

class FakeVideoFrame {
  closed = false;
  displayWidth = 640;
  displayHeight = 360;

  constructor(readonly timestamp: number) {}

  close() {
    this.closed = true;
  }
}

class FakeEncodedVideoChunk {
  readonly type: 'key' | 'delta';
  readonly timestamp: number;

  constructor(init: { type: 'key' | 'delta'; timestamp: number }) {
    this.type = init.type;
    this.timestamp = init.timestamp;
  }
}

class FakeVideoDecoder {
  static instances: FakeVideoDecoder[] = [];

  state: CodecState = 'unconfigured';
  readonly configs: VideoDecoderConfig[] = [];
  readonly chunks: FakeEncodedVideoChunk[] = [];

  constructor(readonly init: VideoDecoderInit) {
    FakeVideoDecoder.instances.push(this);
  }

  configure(config: VideoDecoderConfig) {
    this.state = 'configured';
    this.configs.push(config);
  }

  decode(chunk: FakeEncodedVideoChunk) {
    this.chunks.push(chunk);
  }

  reset() {
    this.state = 'unconfigured';
  }

  close() {
    this.state = 'closed';
  }

  /** The decoder outputs the frame for this timestamp. */
  output(timestamp: number): FakeVideoFrame {
    const frame = new FakeVideoFrame(timestamp);

    this.init.output(frame as unknown as VideoFrame);
    return frame;
  }

  fail(error: Error) {
    this.state = 'closed';
    this.init.error(error as DOMException);
  }
}

const configA: VideoDecoderConfig = { codec: 'vp8', codedWidth: 640, codedHeight: 360 };
const configB: VideoDecoderConfig = { codec: 'vp8', codedWidth: 1280, codedHeight: 720 };

function frame(timestampUs: number, key: boolean, discontinuity?: VideoPlayerFrame['discontinuity']): VideoPlayerFrame {
  return { timestampUs, key, payload: new Uint8Array([timestampUs]), discontinuity };
}

/** A clock whose decision for each timestamp the test sets; unset timestamps are due now. */
function createClock() {
  const decisions = new Map<number, PlayoutDecision>();

  return {
    decisions,
    due: vi.fn((timestampUs: number): PlayoutDecision => decisions.get(timestampUs) ?? { action: 'show', offsetUs: 0 }),
    localNow: () => 0,
  };
}

function setup() {
  const clock = createClock();
  const render = vi.fn<(frame: VideoFrame) => void>();
  const onError = vi.fn();
  const player = createVideoPlayer({ clock, decoderConfig: configA, render, onError });
  const decoder = () => FakeVideoDecoder.instances.at(-1)!;

  return { clock, render, onError, player, decoder };
}

describe('createVideoPlayer', () => {
  beforeEach(() => {
    FakeVideoDecoder.instances = [];
    vi.stubGlobal('VideoDecoder', FakeVideoDecoder);
    vi.stubGlobal('EncodedVideoChunk', FakeEncodedVideoChunk);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows a decoded frame the clock says is due, then closes it', () => {
    const { player, render, decoder } = setup();

    player.push(frame(1, true));

    const shown = decoder().output(1);

    expect(render).toHaveBeenCalledWith(shown);
    expect(shown.closed).toBe(true);
  });

  it('holds a frame the clock says is early and shows it once it is due', () => {
    vi.useFakeTimers();

    const { player, render, clock, decoder } = setup();

    clock.decisions.set(1, { action: 'wait', offsetUs: 20_000, waitUs: 20_000 });
    player.push(frame(1, true));

    const held = decoder().output(1);

    expect(render).not.toHaveBeenCalled();
    expect(held.closed).toBe(false);

    clock.decisions.delete(1);
    vi.advanceTimersByTime(20);

    expect(render).toHaveBeenCalledWith(held);
    expect(held.closed).toBe(true);
  });

  it('closes a frame the clock says is late without showing it', () => {
    const { player, render, clock, decoder } = setup();

    clock.decisions.set(1, { action: 'drop', offsetUs: -80_000 });
    player.push(frame(1, true));

    const late = decoder().output(1);

    expect(render).not.toHaveBeenCalled();
    expect(late.closed).toBe(true);
  });

  it('skips deltas until a keyframe', () => {
    const { player, decoder } = setup();

    player.push(frame(1, false));
    player.push(frame(2, true));
    player.push(frame(3, false));

    expect(decoder().chunks.map((chunk) => [chunk.timestamp, chunk.type])).toEqual([
      [2, 'key'],
      [3, 'delta'],
    ]);
  });

  it('after a gap, skips deltas until the next keyframe', () => {
    const { player, decoder } = setup();

    player.push(frame(1, true));
    player.push(frame(5, false, 'gap'));
    player.push(frame(6, false));
    player.push(frame(7, true));

    expect(decoder().chunks.map((chunk) => chunk.timestamp)).toEqual([1, 7]);
  });

  it('at a restart, drops the frames waiting to be shown and starts again from a keyframe', () => {
    vi.useFakeTimers();

    const { player, render, clock, decoder } = setup();

    clock.decisions.set(1, { action: 'wait', offsetUs: 500_000, waitUs: 500_000 });
    player.push(frame(1, true));

    const stale = decoder().output(1);

    player.push(frame(10, false, 'restart'));
    player.push(frame(11, true));
    vi.advanceTimersByTime(1_000);

    expect(stale.closed).toBe(true);
    expect(render).not.toHaveBeenCalled();
    expect(decoder().chunks.map((chunk) => chunk.timestamp)).toEqual([1, 11]);
  });

  it('after a decoder error, reports it and decodes from the next keyframe with a new decoder', () => {
    const { player, onError, decoder } = setup();
    const error = new Error('decode failed');

    player.push(frame(1, true));

    const failed = decoder();

    failed.fail(error);
    player.push(frame(2, false));
    player.push(frame(3, true));

    expect(onError).toHaveBeenCalledWith(error);
    expect(decoder()).not.toBe(failed);
    expect(decoder().chunks.map((chunk) => chunk.timestamp)).toEqual([3]);
  });

  it('applies a new decoder config from the next keyframe on', () => {
    const { player, decoder } = setup();

    player.push(frame(1, true));
    player.configure(configB);
    player.push(frame(2, false));
    player.push(frame(3, true));

    expect(decoder().configs).toEqual([configA, configB]);
    expect(decoder().chunks.map((chunk) => chunk.timestamp)).toEqual([1, 2, 3]);
  });

  it('reports an exception from render and still closes the frame', () => {
    const { player, render, onError, decoder } = setup();
    const error = new Error('draw failed');

    render.mockImplementation(() => {
      throw error;
    });
    player.push(frame(1, true));

    const shown = decoder().output(1);

    expect(onError).toHaveBeenCalledWith(error);
    expect(shown.closed).toBe(true);
  });

  it('on close, closes the decoder and every frame waiting, and ignores later frames', () => {
    vi.useFakeTimers();

    const { player, render, clock, decoder } = setup();

    clock.decisions.set(1, { action: 'wait', offsetUs: 20_000, waitUs: 20_000 });
    player.push(frame(1, true));

    const waiting = decoder().output(1);

    player.close();
    player.push(frame(2, true));

    const late = decoder().output(2);

    vi.advanceTimersByTime(100);

    expect(decoder().state).toBe('closed');
    expect(waiting.closed).toBe(true);
    expect(late.closed).toBe(true);
    expect(render).not.toHaveBeenCalled();
    expect(decoder().chunks.map((chunk) => chunk.timestamp)).toEqual([1]);
  });
});

describe('canvasRenderer', () => {
  it("sizes the canvas to each frame's display size and draws the frame over it", () => {
    const drawImage = vi.fn();
    const canvas = { width: 0, height: 0, getContext: () => ({ drawImage }) };
    const render = canvasRenderer(canvas);
    const shown = new FakeVideoFrame(1) as unknown as VideoFrame;

    render(shown);

    expect(canvas).toMatchObject({ width: 640, height: 360 });
    expect(drawImage).toHaveBeenCalledWith(shown, 0, 0, 640, 360);
  });

  it('throws for a canvas that has another kind of context', () => {
    expect(() => canvasRenderer({ width: 0, height: 0, getContext: () => null })).toThrow();
  });
});
