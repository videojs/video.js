import {
  buildMsfCatalog,
  buildMsfEndCatalog,
  createVideoPlayer,
  type MsfCatalogInput,
  type VideoPlayer,
  type VideoPlayerOptions,
} from '@caprid/moq-media';
import type { MoqtObject, SubscribeOk, WantHandlers } from '@caprid/relay';
import { MediaError } from '@videojs/media';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { RelayVideoAdapter } from '../adapter';
import { createFakeSubscriber, type FakeSubscriber } from './fake-subscriber';

const audioInput = { push: vi.fn(), remove: vi.fn() };

vi.mock('@caprid/moq-media', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@caprid/moq-media')>()),
  createVideoPlayer: vi.fn(() => ({
    push: vi.fn(),
    configure: vi.fn(),
    reset: vi.fn(),
    close: vi.fn(),
    stats: { decoded: 0 },
  })),
  canvasRenderer: vi.fn((canvas: HTMLCanvasElement) => (frame: VideoFrame) => {
    canvas.width = frame.displayWidth;
    canvas.height = frame.displayHeight;
  }),
  createAudioPlayer: vi.fn(async () => ({
    output: { gain: { value: 1 }, connect: vi.fn() },
    addInput: vi.fn(() => audioInput),
    close: vi.fn(),
  })),
}));

class FakeAudioContext extends EventTarget {
  state: AudioContextState = 'suspended';
  readonly destination = {};

  async resume() {
    this.state = 'running';
    this.dispatchEvent(new Event('statechange'));
  }

  async close() {
    this.state = 'closed';
  }
}

const namespace = ['live', 'room'];

const ladder: MsfCatalogInput = {
  namespace,
  media: [
    { role: 'video', name: 'video-360', codec: 'vp8', width: 640, height: 360, altGroup: 1 },
    { role: 'video', name: 'video-720', codec: 'vp8', width: 1280, height: 720, altGroup: 1 },
    { role: 'video', name: 'video-1080', codec: 'vp8', width: 1920, height: 1080, altGroup: 1 },
  ],
  audio: { name: 'audio' },
};

let nextGroup = 0;

/** An object in a group after every one made before it, unless the test places it. */
function object(payload: Uint8Array, groupId = nextGroup++): MoqtObject {
  return { groupId, objectId: 0, subgroupId: 0, status: 'normal', properties: [], payload };
}

const subscribed: SubscribeOk = { trackAlias: 1, parameters: {}, trackProperties: [] };

function keysOf(subscriber: FakeSubscriber, adapterWant: (key: string) => boolean = () => true) {
  return [...subscriber.wants.keys()].filter(adapterWant);
}

function wantOf(subscriber: FakeSubscriber, name: 'catalog' | 'video' | 'audio') {
  const entry = [...subscriber.wants].find(([key]) => key.startsWith('relay-video/') && key.endsWith(`/${name}`));

  return entry && { key: entry[0], ...entry[1] };
}

function handlersOf(subscriber: FakeSubscriber, name: 'catalog' | 'video' | 'audio'): WantHandlers {
  const want = wantOf(subscriber, name);
  if (!want) throw new Error(`no ${name} want`);

  return want.handlers;
}

function setup({ canvasHeight = 0 } = {}) {
  const subscriber = createFakeSubscriber();
  const adapter = new RelayVideoAdapter();
  const canvas = document.createElement('canvas');
  const events: string[] = [];

  // As `<relay-video>` renders it: no bitmap until a frame is drawn.
  canvas.width = 0;
  canvas.height = 0;
  Object.defineProperty(canvas, 'clientHeight', { value: canvasHeight });
  adapter.attach(canvas);

  for (const type of [
    'emptied',
    'loadstart',
    'loadedmetadata',
    'loadeddata',
    'canplay',
    'play',
    'playing',
    'pause',
    'ended',
    'error',
    'resize',
    'waiting',
  ]) {
    adapter.addEventListener(type, () => events.push(type));
  }

  const deliverCatalog = (input: MsfCatalogInput = ladder) =>
    handlersOf(subscriber, 'catalog').onObject!(object(buildMsfCatalog(input)));

  return { subscriber, adapter, canvas, events, deliverCatalog };
}

function lastPlayer() {
  const { results, calls } = vi.mocked(createVideoPlayer).mock;
  const options = calls.at(-1)![0] as VideoPlayerOptions;

  return { options, player: results.at(-1)!.value as VideoPlayer & { stats: { decoded: number } } };
}

describe('RelayVideoAdapter', () => {
  beforeEach(() => {
    vi.stubGlobal('VideoDecoder', class {});
    vi.mocked(createVideoPlayer).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps its wants apart from another element and the app on the same subscriber, and releases only its own', () => {
    const subscriber = createFakeSubscriber();
    const first = new RelayVideoAdapter();
    const second = new RelayVideoAdapter();

    subscriber.want('chat', { namespace, track: 'chat' });
    first.source = { subscriber, namespace };
    second.source = { subscriber, namespace };

    const [, firstCatalog, secondCatalog] = keysOf(subscriber);

    expect(firstCatalog).not.toBe(secondCatalog);
    expect(subscriber.wants.get(firstCatalog!)?.options).toMatchObject({ namespace, track: 'catalog' });
    expect(subscriber.wants.get(secondCatalog!)?.options).toMatchObject({ namespace, track: 'catalog' });

    first.destroy();

    expect(keysOf(subscriber)).toEqual(['chat', secondCatalog]);

    second.source = null;

    expect(keysOf(subscriber)).toEqual(['chat']);
    expect(subscriber.unwant.mock.calls).toEqual([[firstCatalog], [secondCatalog]]);
    expect(subscriber.close).not.toHaveBeenCalled();
    expect(subscriber.rotate).not.toHaveBeenCalled();
  });

  it('reports metadata and lists the renditions once the catalog arrives', () => {
    const { subscriber, adapter, events, deliverCatalog } = setup();

    adapter.source = { subscriber, namespace };

    expect(events).toEqual(['loadstart']);
    expect(adapter.streamType).toBe('live');

    deliverCatalog();

    expect(events).toEqual(['loadstart', 'loadedmetadata']);
    expect(adapter.readyState).toBe(1);
    expect(adapter.duration).toBe(Number.POSITIVE_INFINITY);
    expect([...adapter.videoRenditions].map(({ id, height }) => [id, height])).toEqual([
      ['video-360', 360],
      ['video-720', 720],
      ['video-1080', 1080],
    ]);
    expect(adapter.videoRenditions.selectedIndex).toBe(-1);
  });

  it('plays the smallest rendition at least as tall as the canvas while on auto', async () => {
    const { subscriber, adapter, deliverCatalog } = setup({ canvasHeight: 500 });

    adapter.source = { subscriber, namespace };
    deliverCatalog();
    await adapter.play();

    expect(wantOf(subscriber, 'video')?.options).toMatchObject({ namespace, track: 'video-720' });
  });

  it('plays the tallest rendition when none is as tall as the canvas', async () => {
    const { subscriber, adapter, deliverCatalog } = setup({ canvasHeight: 2000 });

    adapter.source = { subscriber, namespace };
    deliverCatalog();
    await adapter.play();

    expect(wantOf(subscriber, 'video')?.options.track).toBe('video-1080');
  });

  it('moves the video want to a selected rendition without releasing it, and marks it active at the cutover', async () => {
    const { subscriber, adapter, deliverCatalog } = setup();

    adapter.source = { subscriber, namespace };
    deliverCatalog();
    await adapter.play();

    const { key } = wantOf(subscriber, 'video')!;
    const { player } = lastPlayer();

    subscriber.log.length = 0;
    adapter.videoRenditions.selectedIndex = 2;
    await Promise.resolve();

    expect(subscriber.log).toEqual([`want ${key} video-1080`]);
    expect([...adapter.videoRenditions].map((rendition) => rendition.active)).toEqual([false, false, false]);

    handlersOf(subscriber, 'video').onSwitched!({
      from: { namespace, track: 'video-360' },
      to: { namespace, track: 'video-1080' },
      subscribed,
    });

    expect(player.configure).toHaveBeenCalledWith(expect.objectContaining({ codedHeight: 1080 }));
    expect([...adapter.videoRenditions].map((rendition) => rendition.active)).toEqual([false, false, true]);
  });

  it('releases the media tracks on pause but keeps the catalog, and wants them again on play', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);

    const { subscriber, adapter, deliverCatalog } = setup();

    subscriber.want('chat', { namespace, track: 'chat' });
    adapter.source = { subscriber, namespace };
    deliverCatalog();
    await adapter.play();
    await vi.waitFor(() => expect(wantOf(subscriber, 'audio')).toBeDefined());

    const tracks = () => [...subscriber.wants.values()].map(({ options }) => options.track);

    expect(tracks()).toEqual(['chat', 'catalog', 'video-360', 'audio']);

    adapter.pause();

    expect(tracks()).toEqual(['chat', 'catalog']);

    await adapter.play();

    expect(tracks()).toEqual(['chat', 'catalog', 'video-360', 'audio']);
  });

  it('shows the first frame as playable and resizes to it', async () => {
    const { subscriber, adapter, events, deliverCatalog } = setup();

    adapter.source = { subscriber, namespace };
    deliverCatalog();
    await adapter.play();
    lastPlayer().options.render({ timestamp: 1_000_000, displayWidth: 640, displayHeight: 360 } as VideoFrame);

    expect(events).toEqual(['loadstart', 'loadedmetadata', 'play', 'resize', 'loadeddata', 'canplay', 'playing']);
    expect(adapter.readyState).toBe(4);
    expect([adapter.videoWidth, adapter.videoHeight]).toEqual([640, 360]);
  });

  it('marks the rendition it subscribed to as active', async () => {
    const { subscriber, adapter, deliverCatalog } = setup();

    adapter.source = { subscriber, namespace };
    deliverCatalog();
    await adapter.play();
    handlersOf(subscriber, 'video').onSubscribed!(subscribed, { namespace });

    expect([...adapter.videoRenditions].map((rendition) => rendition.active)).toEqual([true, false, false]);
  });

  it('keeps the delivering rendition active when a later catalog adds one', async () => {
    const { subscriber, adapter, deliverCatalog } = setup();
    const [first, second] = ladder.media!;

    adapter.source = { subscriber, namespace };
    deliverCatalog({ namespace, media: [first!] });
    await adapter.play();
    handlersOf(subscriber, 'video').onSubscribed!(subscribed, { namespace });
    deliverCatalog({ namespace, media: [first!, second!] });

    expect([...adapter.videoRenditions].map(({ id, active }) => [id, active])).toEqual([
      ['video-360', true],
      ['video-720', false],
    ]);
  });

  it('moves to the track a later catalog lists in place of the one playing', async () => {
    const { subscriber, adapter, deliverCatalog } = setup();

    adapter.source = { subscriber, namespace };
    deliverCatalog({ namespace, video: { name: 'video', codec: 'vp8', width: 640, height: 360 } });
    await adapter.play();

    const { key } = wantOf(subscriber, 'video')!;

    subscriber.log.length = 0;
    deliverCatalog({ namespace, video: { name: 'video-2', codec: 'vp8', width: 1280, height: 720 } });

    expect(subscriber.log).toEqual([`want ${key} video-2`]);
    expect([...adapter.videoRenditions].map((rendition) => rendition.id)).toEqual(['video-2']);
  });

  it('reconfigures the decoder when a later catalog changes the playing track', async () => {
    const { subscriber, adapter, deliverCatalog } = setup();

    adapter.source = { subscriber, namespace };
    deliverCatalog({ namespace, video: { name: 'video', codec: 'vp8', width: 640, height: 360 } });
    await adapter.play();
    deliverCatalog({ namespace, video: { name: 'video', codec: 'vp8', width: 1280, height: 720 } });

    expect(lastPlayer().player.configure).toHaveBeenCalledWith(expect.objectContaining({ codedHeight: 720 }));
  });

  it('drops the frames waiting to be shown when the video subscription restarts', async () => {
    const { subscriber, adapter, deliverCatalog } = setup();

    adapter.source = { subscriber, namespace };
    deliverCatalog();
    await adapter.play();
    handlersOf(subscriber, 'video').onRestarted!({ reason: 'catch-up', namespace });

    expect(lastPlayer().player.reset).toHaveBeenCalledOnce();
  });

  it('reports a decoder that cannot take the rendition as a decode error and releases its wants', async () => {
    const { subscriber, adapter, events, deliverCatalog } = setup();

    adapter.source = { subscriber, namespace };
    deliverCatalog();
    await adapter.play();
    lastPlayer().options.onError!(new DOMException('Unsupported configuration.', 'NotSupportedError'));

    expect(events.at(-1)).toBe('error');
    expect(adapter.error?.code).toBe(MediaError.MEDIA_ERR_DECODE);
    expect(lastPlayer().player.close).toHaveBeenCalledOnce();
    expect(subscriber.wants.size).toBe(0);
  });

  it('keeps playing after a decoder error the player recovers from', async () => {
    const { subscriber, adapter, events, deliverCatalog } = setup();

    adapter.source = { subscriber, namespace };
    deliverCatalog();
    await adapter.play();

    const { options, player } = lastPlayer();

    player.stats.decoded = 30;
    options.onError!(new DOMException('Decoding error.', 'EncodingError'));

    expect(events).not.toContain('error');
    expect(wantOf(subscriber, 'video')).toBeDefined();
  });

  it('reports the stream as live to a listener told the stream type changed', () => {
    const { subscriber, adapter } = setup();
    const seen: string[] = [];

    adapter.addEventListener('streamtypechange', () => seen.push(adapter.streamType));
    adapter.source = { subscriber, namespace };
    adapter.source = null;

    expect(seen).toEqual(['live', 'unknown']);
  });

  it('holds the current time while it waits for frames', async () => {
    vi.useFakeTimers();

    const { subscriber, adapter, events, deliverCatalog } = setup();

    adapter.source = { subscriber, namespace };
    deliverCatalog();
    await adapter.play();
    lastPlayer().options.render({ timestamp: 1_000_000, displayWidth: 640, displayHeight: 360 } as VideoFrame);
    vi.advanceTimersByTime(1_500);

    expect(events.at(-1)).toBe('waiting');

    const stalledAt = adapter.currentTime;

    vi.advanceTimersByTime(2_000);

    expect(adapter.currentTime).toBe(stalledAt);

    vi.useRealTimers();
  });

  it('reports a replacement decoder that fails before it decodes anything as a decode error', async () => {
    const { subscriber, adapter, events, deliverCatalog } = setup();

    adapter.source = { subscriber, namespace };
    deliverCatalog();
    await adapter.play();

    const { options, player } = lastPlayer();

    player.stats.decoded = 30;
    options.onError!(new DOMException('Decoding error.', 'EncodingError'));

    expect(events).not.toContain('error');

    options.onError!(new DOMException('Decoding error.', 'EncodingError'));

    expect(adapter.error?.code).toBe(MediaError.MEDIA_ERR_DECODE);
  });

  it('moves the video want when a later catalog lists the track under another namespace', async () => {
    const { subscriber, adapter, deliverCatalog } = setup();
    const input: MsfCatalogInput = { namespace, video: { name: 'video', codec: 'vp8', width: 640, height: 360 } };
    const moved = JSON.parse(new TextDecoder().decode(buildMsfCatalog(input)));

    moved.tracks[0].namespace = 'live/backup';
    adapter.source = { subscriber, namespace };
    deliverCatalog(input);
    await adapter.play();
    handlersOf(subscriber, 'catalog').onObject!(object(new TextEncoder().encode(JSON.stringify(moved))));

    expect(wantOf(subscriber, 'video')?.options).toMatchObject({ namespace: ['live', 'backup'], track: 'video' });
  });

  it('ignores a catalog older than the one it has, even after the broadcast ended', async () => {
    const { subscriber, adapter } = setup();

    adapter.source = { subscriber, namespace };

    const { onObject } = handlersOf(subscriber, 'catalog');

    onObject!(object(buildMsfCatalog(ladder), 5));
    onObject!(object(buildMsfCatalog({ namespace, media: [ladder.media![0]!] }), 4));

    expect(adapter.videoRenditions.length).toBe(3);

    onObject!(object(buildMsfEndCatalog(), 7));
    onObject!(object(buildMsfCatalog(ladder), 6));

    expect(adapter.ended).toBe(true);
  });

  it('ends when the catalog says the broadcast is complete, keeping the catalog want', async () => {
    const { subscriber, adapter, events, deliverCatalog } = setup();

    adapter.source = { subscriber, namespace };
    deliverCatalog();
    await adapter.play();
    handlersOf(subscriber, 'catalog').onObject!(object(buildMsfEndCatalog()));

    expect(events.slice(-2)).toEqual(['pause', 'ended']);
    expect(adapter.ended).toBe(true);
    expect(adapter.paused).toBe(true);
    expect([...subscriber.wants.values()].map(({ options }) => options.track)).toEqual(['catalog']);
  });

  it('reports a want the relay refused as a network error and releases its wants', () => {
    const { subscriber, adapter, events } = setup();

    adapter.source = { subscriber, namespace };
    handlersOf(subscriber, 'catalog').onError!(new Error('unauthorized'));

    expect(events).toEqual(['loadstart', 'error']);
    expect(adapter.error?.code).toBe(MediaError.MEDIA_ERR_NETWORK);
    expect(subscriber.wants.size).toBe(0);
  });

  it('reports an unreadable catalog as an unsupported source', () => {
    const { subscriber, adapter, events } = setup();

    adapter.source = { subscriber, namespace };
    handlersOf(subscriber, 'catalog').onObject!(object(new TextEncoder().encode('not json')));

    expect(events).toEqual(['loadstart', 'error']);
    expect(adapter.error?.code).toBe(MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
  });

  it('reports the subscriber stopping as a network error', async () => {
    const { subscriber, adapter, events } = setup();

    adapter.source = { subscriber, namespace };
    subscriber.end(new Error('token expired'));

    await vi.waitFor(() => expect(events).toContain('error'));
    expect(adapter.error?.code).toBe(MediaError.MEDIA_ERR_NETWORK);
  });

  it('keeps playing when given the same subscriber and namespace again as a new object', () => {
    const { subscriber, adapter, events } = setup();
    const source = { subscriber, namespace };

    adapter.source = source;
    adapter.source = { subscriber, namespace: [...namespace] };

    expect(events).toEqual(['loadstart']);
    expect(adapter.source).toBe(source);
    expect(subscriber.want).toHaveBeenCalledOnce();
  });

  it('clears the error and starts over when given a new source', () => {
    const { subscriber, adapter, events } = setup();

    adapter.source = { subscriber, namespace };
    handlersOf(subscriber, 'catalog').onError!(new Error('unauthorized'));
    adapter.source = { subscriber, namespace: ['live', 'other'] };

    expect(events.slice(-2)).toEqual(['emptied', 'loadstart']);
    expect(adapter.error).toBeNull();
    expect(wantOf(subscriber, 'catalog')?.options.namespace).toEqual(['live', 'other']);
  });
});
