/**
 * In-memory stand-in for the `VideoJSEngineStore` TurboModule.
 *
 * Vitest redirects `NativeEngineStore` here so player tests can construct `ReactNativeMedia` without a native runtime.
 * The shape matches the calls the adapter makes: create and destroy a handle, subscribe to events, and read or write
 * the snapshot getters the media element surface uses.
 */

interface PlayerSnapshot {
  paused: boolean;
  ended: boolean;
  currentTime: number;
  duration: number;
  buffered: { start: number; end: number }[];
  seekable: { start: number; end: number }[];
  playbackRate: number;
  error: { code: number; message: string } | null;
  seeking: boolean;
  source: string;
  readyState: number;
  contentData: { title?: string; poster?: string };
  loop: boolean;
}

interface PlayerEvent {
  handle: number;
  type: string;
}

type PlayerListener = (event: PlayerEvent) => void;

function createSnapshot(source: string | null): PlayerSnapshot {
  return {
    paused: true,
    ended: false,
    currentTime: 0,
    duration: Number.NaN,
    buffered: [],
    seekable: [],
    playbackRate: 1,
    error: null,
    seeking: false,
    source: source ?? '',
    readyState: 0,
    contentData: {},
    loop: false,
  };
}

let nextHandle = 1;
const players = new Map<number, PlayerSnapshot>();
const listeners = new Set<PlayerListener>();

function snapshot(handle: number): PlayerSnapshot | undefined {
  return players.get(handle);
}

const NativeEngineStore = {
  createPlayer(source: string | null) {
    const handle = nextHandle;

    nextHandle += 1;
    players.set(handle, createSnapshot(source));
    return handle;
  },
  destroyPlayer(handle: number) {
    players.delete(handle);
  },
  setSource(handle: number, source: string) {
    const player = snapshot(handle);
    if (!player) return false;

    player.source = source;
    return true;
  },
  load(handle: number) {
    return players.has(handle);
  },
  play(handle: number) {
    const player = snapshot(handle);
    if (!player) return false;

    player.paused = false;
    player.ended = false;
    return true;
  },
  pause(handle: number) {
    const player = snapshot(handle);
    if (!player) return false;

    player.paused = true;
    return true;
  },
  setCurrentTime(handle: number, time: number) {
    const player = snapshot(handle);
    if (!player) return false;

    player.currentTime = time;
    player.seeking = true;
    return true;
  },
  setPlaybackRate(handle: number, rate: number) {
    const player = snapshot(handle);
    if (!player || rate <= 0) return false;

    player.playbackRate = rate;
    return true;
  },
  setLoop(handle: number, loop: boolean) {
    const player = snapshot(handle);
    if (!player) return false;

    player.loop = loop;
    return true;
  },
  getCurrentTime(handle: number) {
    return snapshot(handle)?.currentTime ?? 0;
  },
  getDuration(handle: number) {
    return snapshot(handle)?.duration ?? Number.NaN;
  },
  getBuffered(handle: number) {
    return snapshot(handle)?.buffered ?? [];
  },
  getSeekable(handle: number) {
    return snapshot(handle)?.seekable ?? [];
  },
  getError(handle: number) {
    return snapshot(handle)?.error ?? null;
  },
  isPaused(handle: number) {
    return snapshot(handle)?.paused ?? true;
  },
  isEnded(handle: number) {
    return snapshot(handle)?.ended ?? false;
  },
  isSeeking(handle: number) {
    return snapshot(handle)?.seeking ?? false;
  },
  getSource(handle: number) {
    return snapshot(handle)?.source ?? '';
  },
  getReadyState(handle: number) {
    return snapshot(handle)?.readyState ?? 0;
  },
  getContentData(handle: number) {
    return snapshot(handle)?.contentData ?? {};
  },
  getPlaybackRate(handle: number) {
    return snapshot(handle)?.playbackRate ?? 1;
  },
  onPlayerEvent(listener: PlayerListener) {
    listeners.add(listener);

    return {
      remove() {
        listeners.delete(listener);
      },
    };
  },
};

export default NativeEngineStore;
