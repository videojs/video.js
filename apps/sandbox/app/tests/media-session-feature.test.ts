import type { PlayerTarget } from '@videojs/core/dom';
import { combine, createStore } from '@videojs/store';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { mediaSessionFeature } from '../usecases/audiobook/features';
import { FakeAudio } from './helpers/fake-audio';

class FakeMediaMetadata {
  title: string;
  artist: string;
  album: string;
  artwork: readonly { src: string }[];

  constructor(init: { title?: string; artist?: string; album?: string; artwork?: readonly { src: string }[] } = {}) {
    this.title = init.title ?? '';
    this.artist = init.artist ?? '';
    this.album = init.album ?? '';
    this.artwork = init.artwork ?? [];
  }
}

interface FakeSession {
  metadata: FakeMediaMetadata | null;
  playbackState: string;
  handlers: Map<string, ((details: Record<string, number | undefined>) => void) | null>;
  positions: { duration: number; position: number; playbackRate: number }[];
  setActionHandler(action: string, handler: ((details: Record<string, number | undefined>) => void) | null): void;
  setPositionState(state: { duration: number; position: number; playbackRate: number }): void;
}

function installSession(): FakeSession {
  const session: FakeSession = {
    metadata: null,
    playbackState: 'none',
    handlers: new Map(),
    positions: [],
    setActionHandler(action, handler) {
      if (action === 'stop') throw new TypeError('not supported');

      this.handlers.set(action, handler);
    },
    setPositionState(state) {
      this.positions.push(state);
    },
  };

  Object.defineProperty(globalThis, 'navigator', { value: { mediaSession: session }, configurable: true });
  Object.defineProperty(globalThis, 'MediaMetadata', { value: FakeMediaMetadata, configurable: true });

  return session;
}

describe('mediaSessionFeature', () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  let session: FakeSession;

  beforeEach(() => {
    session = installSession();
  });

  afterEach(() => {
    if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
    else Reflect.deleteProperty(globalThis, 'navigator');

    Reflect.deleteProperty(globalThis, 'MediaMetadata');
  });

  it('registers the keys, mirrors playback state and position, and survives an unsupported action', () => {
    const media = new FakeAudio();
    const store = createStore<PlayerTarget>()(combine(mediaSessionFeature));

    store.attach({ media, container: null });
    expect(store.sessionAvailability).toBe('available');
    expect(session.playbackState).toBe('paused');
    expect(session.handlers.has('stop')).toBe(false);

    media.loadMetadata(600);
    session.handlers.get('play')?.({});
    expect(media.paused).toBe(false);
    expect(session.playbackState).toBe('playing');

    session.handlers.get('seekforward')?.({});
    expect(media.currentTime).toBe(15);
    session.handlers.get('seekbackward')?.({ seekOffset: 5 });
    expect(media.currentTime).toBe(10);
    session.handlers.get('seekto')?.({ seekTime: 300 });
    expect(media.currentTime).toBe(300);

    media.seekTo(300);
    expect(session.positions.at(-1)).toEqual({ duration: 600, position: 300, playbackRate: 1 });
  });

  it('publishes metadata from the store and clears everything on detach', async () => {
    const media = new FakeAudio();
    const store = createStore<PlayerTarget>()(combine(mediaSessionFeature));

    store.setSessionMetadata({ title: 'Alice', artist: 'Lewis Carroll', artwork: [{ src: 'cover.jpg' }] });
    store.attach({ media, container: null });
    expect(session.metadata?.title).toBe('Alice');
    expect(session.metadata?.artwork).toEqual([{ src: 'cover.jpg' }]);

    store.setSessionMetadata({ title: 'Frankenstein' });
    // Store subscribers hear about a change on the next microtask.
    await Promise.resolve();
    expect(session.metadata?.title).toBe('Frankenstein');

    store.destroy();
    expect(session.metadata).toBeNull();
    expect(session.playbackState).toBe('none');
    expect(session.handlers.get('play')).toBeNull();
  });

  it('reports unsupported where there is no session', () => {
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });

    const store = createStore<PlayerTarget>()(combine(mediaSessionFeature));

    store.attach({ media: new FakeAudio(), container: null });
    expect(store.sessionAvailability).toBe('unsupported');
  });
});
