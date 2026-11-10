import {
  type AudioPlayerInput,
  CATALOG_TRACK,
  canvasRenderer,
  createFrameHold,
  createFrameSequencer,
  createPlayoutClock,
  createVideoPlayer,
  type FrameHold,
  type MsfCatalog,
  type PlayoutClock,
  parseMsfCatalog,
  type SequencedFrame,
  type VideoPlayer,
} from '@caprid/moq-media';
import type { MoqtObject, WantHandlers, WantOptions } from '@caprid/relay';
import { createFrameReader, type FrameReader, mediaSubscribeParameters } from '@caprid/relay/media';
import { MediaError, MediaReadyState, type MediaStreamType, type Video } from '@videojs/media';
import { MediaTracksMixin } from '@videojs/media/media-tracks';

import { createAudioOutput } from './audio-output';
import {
  type AudioChoice,
  choosePresentation,
  findVideo,
  type Presentation,
  pickAutoVideo,
  sameDecoding,
  type VideoChoice,
} from './catalog';
import { createWantScope, type RelaySubscriberView, type WantScope } from './want-scope';

/**
 * A live broadcast on a connection the application holds: its supervised subscriber, and the namespace its catalog is
 * published under. The element borrows the subscriber; the application keeps using it for its own tracks and closes
 * it.
 *
 * @internal
 */
export interface RelaySource {
  readonly subscriber: RelaySubscriberView;
  readonly namespace: readonly string[];
}

/** One source as the element plays it: the wants it holds and the clock its tracks share. */
interface Broadcast {
  readonly source: RelaySource;
  readonly scope: WantScope;
  readonly clock: PlayoutClock;
  /** The timestamp of the first frame shown, which `currentTime` counts from. */
  originUs: number | undefined;
}

interface VideoPlayback {
  /** The rendition wanted, which a move delivers from once it cuts over. */
  choice: VideoChoice;
  /** The rendition delivering now. */
  active: string | null;
  readonly player: VideoPlayer;
  readonly reader: FrameReader;
  readonly handlers: WantHandlers;
}

interface AudioPlayback {
  readonly choice: AudioChoice;
  readonly reader: FrameReader;
  /** Keeps the frames that arrive while the audio player loads. */
  readonly hold: FrameHold<SequencedFrame>;
  input: AudioPlayerInput | null;
}

/** Media flowing to the canvas and the speakers: only while playing, with a canvas attached. */
interface Playback {
  readonly video: VideoPlayback;
  audio: AudioPlayback | null;
  readonly ticker: ReturnType<typeof setInterval>;
}

interface Ready {
  readonly state: 'ready';
  readonly broadcast: Broadcast;
  catalog: MsfCatalog;
  presentation: Presentation;
  /** The rendition auto selection plays, chosen for the canvas size at the latest catalog. */
  auto: VideoChoice;
  playback: Playback | null;
}

type Session =
  | { readonly state: 'idle' }
  | { readonly state: 'loading'; readonly broadcast: Broadcast }
  | Ready
  | { readonly state: 'ended'; readonly broadcast: Broadcast }
  | { readonly state: 'errored'; readonly source: RelaySource; readonly error: MediaError };

const TIME_UPDATE_INTERVAL_MS = 250;
// Playing with no frame shown for this long is a stall.
const STALL_AFTER_MS = 1_000;

function sourceOf(session: Session): RelaySource | null {
  if (session.state === 'idle') return null;

  return session.state === 'errored' ? session.source : session.broadcast.source;
}

function broadcastOf(session: Session): Broadcast | null {
  return session.state === 'idle' || session.state === 'errored' ? null : session.broadcast;
}

function wantOptions(choice: VideoChoice | AudioChoice, kind: 'video' | 'audio'): WantOptions {
  return {
    namespace: choice.track.namespace,
    track: choice.track.name,
    parameters: mediaSubscribeParameters(kind),
    // A rendition switch cuts over at a group's first object, its keyframe, so the new rendition decodes at once.
    ...(kind === 'video' && { until: (object: MoqtObject) => object.objectId === 0 }),
  };
}

function relayError(message: string, error: unknown): MediaError {
  const mediaError = new MediaError(message, MediaError.MEDIA_ERR_NETWORK, true);

  mediaError.data = { cause: error };
  return mediaError;
}

function warnRecoverable(error: unknown) {
  if (__DEV__) console.warn('<relay-video> recovered from a decoder error.', error);
}

function errorName(error: unknown): string | undefined {
  return error instanceof Error ? error.name : undefined;
}

// The media-tracks mixin defines its properties on the prototype it is given, so it gets one of its own.
class RelayVideoAdapterBase extends EventTarget {}

/**
 * Plays a live Mux Relay broadcast onto a canvas from a subscriber the application holds. The Relay SDK paces video and
 * audio on one playout clock and plays the audio; this adapter decodes and draws the video, picks a rendition, and
 * reports it all as a media element would.
 *
 * @internal
 */
export class RelayVideoAdapter extends MediaTracksMixin(RelayVideoAdapterBase) implements Partial<Video> {
  /** Engine this media plays through, reported to analytics such as Mux Data. */
  static readonly engineName: string = 'relay';

  readonly #prefix = `relay-video/${Math.random().toString(36).slice(2)}/`;
  readonly #audio = createAudioOutput({ onChange: () => this.#reconcile() });
  #canvas: HTMLCanvasElement | null = null;
  #session: Session = { state: 'idle' };
  #paused = true;
  #autoplay = false;
  #defaultMuted = false;
  #muted = false;
  #volume = 1;
  #readyState: number = MediaReadyState.HAVE_NOTHING;
  #currentTime = 0;
  #lastShownAt = 0;

  constructor() {
    super();
    this.videoRenditions.addEventListener('change', () => this.#reconcile());
  }

  // No `target` getter: the media-tracks mixin reads `target` as an `HTMLMediaElement`, and Safari throws when its
  // native track getters run on a canvas.
  attach(target: EventTarget | null): void {
    if (!(target instanceof HTMLCanvasElement) || target === this.#canvas) return;

    this.#canvas = target;
    this.#reconcile();
  }

  detach(): void {
    this.#canvas = null;
    this.#reconcile();
  }

  destroy(): void {
    this.#setSession({ state: 'idle' });
    this.#removeRenditions();
    this.#audio.close();
    this.#canvas = null;
  }

  /** The broadcast to play. Assigning a new one releases the previous one's tracks first. */
  get source(): RelaySource | null {
    return sourceOf(this.#session);
  }
  set source(value: RelaySource | null) {
    if (value === this.source) return;

    this.#load(value);
  }

  get src(): string {
    return this.source?.namespace.join('/') ?? '';
  }

  get currentSrc(): string {
    return this.src;
  }

  /** Start the current broadcast over: its tracks are released and wanted again. */
  load(): void {
    this.#load(this.source);
  }

  get readyState(): number {
    return this.#readyState;
  }

  get error(): MediaError | null {
    return this.#session.state === 'errored' ? this.#session.error : null;
  }

  get paused(): boolean {
    return this.#paused;
  }

  get ended(): boolean {
    return this.#session.state === 'ended';
  }

  get seeking(): boolean {
    return false;
  }

  /** Seconds since the first frame was shown. Playing is always at the live edge, so seeking is a no-op. */
  get currentTime(): number {
    const session = this.#session;

    if (session.state === 'ready' && session.playback) {
      const { clock, originUs } = session.broadcast;
      const position = clock.position();

      if (originUs !== undefined && position !== undefined) {
        this.#currentTime = Math.max(this.#currentTime, (position - originUs) / 1_000_000);
      }
    }

    return this.#currentTime;
  }
  set currentTime(_value: number) {
    queueMicrotask(() => this.#dispatch('seeked'));
  }

  get duration(): number {
    return this.#readyState >= MediaReadyState.HAVE_METADATA ? Number.POSITIVE_INFINITY : Number.NaN;
  }

  get streamType(): MediaStreamType {
    return this.#session.state === 'idle' ? 'unknown' : 'live';
  }

  get liveEdgeStart(): number {
    return this.#session.state === 'idle' ? Number.NaN : 0;
  }

  get targetLiveWindow(): number {
    return this.#session.state === 'idle' ? Number.NaN : 0;
  }

  get videoWidth(): number {
    return this.#canvas?.width ?? 0;
  }

  get videoHeight(): number {
    return this.#canvas?.height ?? 0;
  }

  get autoplay(): boolean {
    return this.#autoplay;
  }
  set autoplay(value: boolean) {
    this.#autoplay = value;
  }

  get defaultMuted(): boolean {
    return this.#defaultMuted;
  }
  set defaultMuted(value: boolean) {
    this.#defaultMuted = value;
  }

  get muted(): boolean {
    return this.#muted;
  }
  set muted(value: boolean) {
    if (value === this.#muted) return;

    this.#muted = value;
    this.#applyGain();
    this.#dispatch('volumechange');
  }

  get volume(): number {
    return this.#volume;
  }
  set volume(value: number) {
    if (value === this.#volume) return;

    this.#volume = value;
    this.#applyGain();
    this.#dispatch('volumechange');
  }

  async play(): Promise<void> {
    // Called from a user gesture, this is where the audio context can start.
    if (this.#wantsAudio()) this.#audio.request();

    if (!this.#paused) return;

    this.#paused = false;
    this.#dispatch('play');
    this.#reconcile();
  }

  /** Pausing a live broadcast leaves it: the media tracks are released and playing again rejoins at the live edge. */
  pause(): void {
    if (this.#paused) return;

    this.#paused = true;
    this.#reconcile();
    this.#dispatch('pause');
  }

  #load(source: RelaySource | null): void {
    const hadSource = this.#session.state !== 'idle';
    const wasPaused = this.#paused;

    this.#setSession({ state: 'idle' });
    this.#removeRenditions();
    this.#readyState = MediaReadyState.HAVE_NOTHING;
    this.#currentTime = 0;
    this.#paused = !(source && this.#autoplay);

    const resized = !!(this.#canvas?.width || this.#canvas?.height);

    // Zero dimensions clear the last frame, and read as no video, as on a media element with nothing loaded.
    if (this.#canvas) {
      this.#canvas.width = 0;
      this.#canvas.height = 0;
    }

    if (hadSource) this.#dispatch('emptied');

    if (resized) this.#dispatch('resize');

    if (!wasPaused && this.#paused) this.#dispatch('pause');

    this.#dispatch('streamtypechange');
    this.#dispatch('targetlivewindowchange');

    if (!source) return;

    const broadcast: Broadcast = {
      source,
      scope: createWantScope(source.subscriber, this.#prefix),
      clock: createPlayoutClock(),
      originUs: undefined,
    };

    this.#setSession({ state: 'loading', broadcast });
    this.#dispatch('loadstart');

    if (wasPaused && !this.#paused) this.#dispatch('play');

    void source.subscriber.closed.then(({ error }) => {
      if (broadcastOf(this.#session) === broadcast) this.#fail(relayError('The relay connection closed.', error));
    });

    if (typeof VideoDecoder === 'undefined') {
      this.#fail(
        new MediaError('This browser cannot decode video with WebCodecs.', MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED, true)
      );
      return;
    }

    try {
      broadcast.scope.want(
        'catalog',
        { namespace: source.namespace, track: CATALOG_TRACK },
        {
          onObject: (object) => this.#onCatalog(broadcast, object),
          onError: (error) => this.#fail(relayError('The relay refused the broadcast catalog.', error)),
        }
      );
    } catch (error) {
      this.#fail(relayError('The relay subscriber cannot take the broadcast.', error));
    }
  }

  #onCatalog(broadcast: Broadcast, object: MoqtObject): void {
    if (broadcastOf(this.#session) !== broadcast || object.payload.length === 0) return;

    let catalog: MsfCatalog;

    try {
      catalog = parseMsfCatalog(object.payload, { catalogNamespace: broadcast.source.namespace });
    } catch (error) {
      const mediaError = new MediaError(
        'The broadcast catalog could not be read.',
        MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED,
        true
      );

      mediaError.data = { cause: error };
      this.#fail(mediaError);
      return;
    }

    if (catalog.isComplete) {
      this.#end(broadcast);
      return;
    }

    const presentation = choosePresentation(catalog);

    if (!presentation) {
      this.#fail(
        new MediaError(
          'The broadcast has no video this browser can decode.',
          MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED,
          true
        )
      );
      return;
    }

    this.#present(broadcast, catalog, presentation);
  }

  #present(broadcast: Broadcast, catalog: MsfCatalog, presentation: Presentation): void {
    const session = this.#session;
    const auto = pickAutoVideo(presentation.video, this.#targetHeight());

    if (session.state === 'ready') {
      const previous = session.presentation;

      session.catalog = catalog;
      session.presentation = presentation;
      session.auto = auto;
      this.#updateRenditions(presentation, catalog, previous);
      this.#reconcile();

      const video = session.playback?.video;

      // A rebuilt list starts with no rendition active, while the one delivering carries on.
      if (video?.active) this.#activate(video, video.active);

      return;
    }

    this.#setSession({ state: 'ready', broadcast, catalog, presentation, auto, playback: null });
    this.#updateRenditions(presentation, catalog, null);

    if (this.#readyState < MediaReadyState.HAVE_METADATA) {
      this.#readyState = MediaReadyState.HAVE_METADATA;
      this.#dispatch('loadedmetadata');
      this.#dispatch('durationchange');
    }

    this.#reconcile();
  }

  #end(broadcast: Broadcast): void {
    this.#setSession({ state: 'ended', broadcast });
    this.#removeRenditions();

    if (!this.#paused) {
      this.#paused = true;
      this.#dispatch('pause');
    }

    this.#dispatch('ended');
  }

  #fail(error: MediaError): void {
    const source = sourceOf(this.#session);
    if (!source) return;

    this.#setSession({ state: 'errored', source, error });
    this.#removeRenditions();
    this.#dispatch('error');
  }

  #setSession(next: Session): void {
    const previous = this.#session;

    if (previous.state === 'ready') this.#stopPlayback(previous);

    const broadcast = broadcastOf(previous);

    if (broadcast && broadcast !== broadcastOf(next)) broadcast.scope.clear();

    this.#session = next;
  }

  /** Bring the media tracks in line with the session, the play state and the canvas. Safe to call at any time. */
  #reconcile(): void {
    const session = this.#session;
    if (session.state !== 'ready') return;

    const canvas = this.#canvas;

    if (this.#paused || !canvas) {
      this.#stopPlayback(session);
      return;
    }

    try {
      session.playback ??= this.#startPlayback(session, canvas);
    } catch (error) {
      const mediaError = new MediaError('The broadcast could not start.', MediaError.MEDIA_ERR_DECODE, true);

      mediaError.data = { cause: error };
      this.#fail(mediaError);
      return;
    }

    this.#syncVideo(session, session.playback);
    this.#syncAudio(session, session.playback);
  }

  #startPlayback(session: Ready, canvas: HTMLCanvasElement): Playback {
    session.broadcast.clock.reset();

    const video = this.#startVideo(session, canvas, this.#desiredVideo(session));

    if (this.#readyState >= MediaReadyState.HAVE_FUTURE_DATA) {
      this.#readyState = MediaReadyState.HAVE_CURRENT_DATA;
      this.#dispatch('waiting');
    }

    if (this.#wantsAudio()) this.#audio.request();

    return { video, audio: null, ticker: setInterval(() => this.#tick(), TIME_UPDATE_INTERVAL_MS) };
  }

  #stopPlayback(session: Ready): void {
    const { playback } = session;
    if (!playback) return;

    const { scope } = session.broadcast;

    clearInterval(playback.ticker);
    scope.unwant('video');
    playback.video.reader.close();
    playback.video.player.close();

    if (playback.audio) this.#stopAudio(scope, playback.audio);

    session.playback = null;
    this.#audio.cancelRequest();

    for (const rendition of this.videoRenditions) rendition.active = false;
  }

  #startVideo(session: Ready, canvas: HTMLCanvasElement, choice: VideoChoice): VideoPlayback {
    const { broadcast } = session;
    const { clock, scope } = broadcast;
    const draw = canvasRenderer(canvas);
    const player = createVideoPlayer({
      clock,
      decoderConfig: choice.config,
      render: (frame) => {
        const { width, height } = canvas;

        draw(frame);
        broadcast.originUs ??= frame.timestamp;

        if (canvas.width !== width || canvas.height !== height) this.#dispatch('resize');

        this.#onFrameShown();
      },
      onError: (error) => this.#onVideoError(player, error),
    });
    const reader = createFrameReader(createFrameSequencer({ clock }), {
      onFrame: player.push,
      onCatchUp: () => scope.catchUp('video'),
    });
    const video: VideoPlayback = {
      choice,
      active: null,
      player,
      reader,
      handlers: {
        ...reader,
        onSubscribed: (info) => {
          reader.onSubscribed(info);
          this.#activate(video, video.choice.track.name);
        },
        onRestarted: () => {
          reader.onRestarted();
          // The frames still waiting belong to the subscription that ended, and would look due once the clock moves.
          player.reset();
        },
        onSwitched: (info) => {
          reader.onSwitched(info);

          if (info.to.track === video.choice.track.name) player.configure(video.choice.config);

          this.#activate(video, info.to.track);
        },
        onError: (error) => this.#fail(relayError('The relay refused the video track.', error)),
      },
    };

    scope.want('video', wantOptions(choice, 'video'), video.handlers);
    return video;
  }

  #onVideoError(player: VideoPlayer, error: unknown): void {
    const name = errorName(error);
    // The player stops for good when its decoder rejects the config or fails before it decodes anything: the same
    // config would fail the same way. After any other error it decodes again from the next keyframe.
    const fatal = name === 'NotSupportedError' || (player.stats.decoded === 0 && name !== 'DataError');
    const session = this.#session;

    if (!fatal || session.state !== 'ready' || session.playback?.video.player !== player) {
      warnRecoverable(error);
      return;
    }

    const mediaError = new MediaError('The video could not be decoded.', MediaError.MEDIA_ERR_DECODE, true);

    mediaError.data = { cause: error };
    this.#fail(mediaError);
  }

  #syncVideo(session: Ready, { video }: Playback): void {
    const desired = this.#desiredVideo(session);
    const current = video.choice;

    video.choice = desired;

    if (desired.track.name !== current.track.name) {
      session.broadcast.scope.want('video', wantOptions(desired, 'video'), video.handlers);
    } else if (!sameDecoding(desired.track, current.track)) {
      video.player.configure(desired.config);
    }
  }

  #syncAudio(session: Ready, playback: Playback): void {
    const { scope, clock } = session.broadcast;
    const choice = session.presentation.audio;
    const status = this.#audio.status;
    const current = playback.audio;

    if (current && (status.state === 'off' || !choice || !sameDecoding(choice.track, current.choice.track))) {
      this.#stopAudio(scope, current);
      playback.audio = null;
    }

    if (!choice || status.state === 'off') return;

    const audio = (playback.audio ??= this.#startAudio(session, choice));
    if (audio.input || status.state !== 'ready') return;

    audio.input = status.player.addInput({ clock, decoderConfig: choice.config, onError: warnRecoverable });
    audio.hold.release(audio.input.push);
  }

  #startAudio(session: Ready, choice: AudioChoice): AudioPlayback {
    const { scope, clock } = session.broadcast;
    const hold = createFrameHold<SequencedFrame>();
    const reader = createFrameReader(createFrameSequencer({ clock, grouping: 'frame' }), {
      onFrame: hold.push,
      onCatchUp: () => scope.catchUp('audio'),
    });

    scope.want('audio', wantOptions(choice, 'audio'), {
      ...reader,
      onError: (error) => this.#fail(relayError('The relay refused the audio track.', error)),
    });

    return { choice, reader, hold, input: null };
  }

  #stopAudio(scope: WantScope, audio: AudioPlayback): void {
    scope.unwant('audio');
    audio.reader.close();
    audio.hold.clear();
    audio.input?.remove();
  }

  #desiredVideo(session: Ready): VideoChoice {
    const selected = this.videoRenditions[this.videoRenditions.selectedIndex];
    const manual = selected && session.presentation.video.find((choice) => choice.track.name === selected.id);

    return manual ?? session.auto;
  }

  #wantsAudio(): boolean {
    const session = this.#session;

    return session.state === 'loading' || (session.state === 'ready' && session.presentation.audio !== undefined);
  }

  #onFrameShown(): void {
    this.#lastShownAt = performance.now();

    if (this.#readyState >= MediaReadyState.HAVE_FUTURE_DATA) return;

    const firstFrame = this.#readyState < MediaReadyState.HAVE_CURRENT_DATA;

    this.#readyState = MediaReadyState.HAVE_ENOUGH_DATA;

    if (firstFrame) this.#dispatch('loadeddata');

    this.#dispatch('canplay');
    this.#dispatch('canplaythrough');

    if (!this.#paused) this.#dispatch('playing');
  }

  #tick(): void {
    const stalled =
      this.#readyState >= MediaReadyState.HAVE_FUTURE_DATA && performance.now() - this.#lastShownAt > STALL_AFTER_MS;

    if (stalled) {
      this.#readyState = MediaReadyState.HAVE_CURRENT_DATA;
      this.#dispatch('waiting');
    }

    this.#dispatch('timeupdate');
  }

  #updateRenditions(presentation: Presentation, catalog: MsfCatalog, previous: Presentation | null): void {
    const listed = [...this.videoRenditions].map(({ id, width, height, codec, bitrate }) => [
      id,
      width,
      height,
      codec,
      bitrate,
    ]);
    const offered = presentation.video.map(({ track }) => [
      track.name,
      track.width,
      track.height,
      track.codec,
      track.bitrate,
    ]);
    if (JSON.stringify(listed) === JSON.stringify(offered)) return;

    const selected = this.videoRenditions[this.videoRenditions.selectedIndex];
    const selectedTrack = previous?.video.find((choice) => choice.track.name === selected?.id)?.track;
    const keep = selectedTrack && findVideo(presentation, catalog, selectedTrack)?.track.name;

    this.#removeRenditions();

    const videoTrack = this.addVideoTrack('main');

    // Selecting the track first is what lists its renditions in `videoRenditions`.
    videoTrack.selected = true;

    for (const { track } of presentation.video) {
      const rendition = videoTrack.addRendition(
        '',
        track.width,
        track.height,
        track.codec,
        track.bitrate,
        track.framerate
      );

      rendition.id = track.name;
      rendition.selected = track.name === keep;
    }
  }

  #removeRenditions(): void {
    for (const track of [...this.videoTracks]) this.removeVideoTrack(track);
  }

  #activate(video: VideoPlayback, trackName: string): void {
    video.active = trackName;

    for (const rendition of this.videoRenditions) rendition.active = rendition.id === trackName;
  }

  #targetHeight(): number {
    return (this.#canvas?.clientHeight ?? 0) * (globalThis.devicePixelRatio || 1);
  }

  #applyGain(): void {
    this.#audio.gain = this.#muted ? 0 : this.#volume;
  }

  #dispatch(type: string): void {
    this.dispatchEvent(new Event(type));
  }
}
