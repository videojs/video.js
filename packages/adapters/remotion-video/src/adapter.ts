import type { CallbackListener, EventTypes, PlayerRef } from '@remotion/player';
import {
  EMPTY_TEXT_TRACKS,
  EMPTY_TIME_RANGES,
  MediaError,
  type MediaPreloadType,
  MediaReadyState,
  type TextTrackListLike,
  type Video,
} from '@videojs/media';
import { createTimeRange, MediaPlayedRangesMixin } from '@videojs/media/dom';

import type { RemotionAdapterProps, RemotionPlayerProps } from './props';
import { isSameChapters, isSameSource, isSameSubtitles, type RemotionSource, resolveChapterSpans } from './source';

/**
 * A Video.js Media over Remotion's `<Player>` and its `PlayerRef`. It implements the capabilities a composition can
 * honor, opts out of the rest with the shared sentinels, and speaks standard media event names, so the default store
 * features attach unchanged. The target it attaches to is a `PlayerRef`, not a DOM node.
 *
 * Frame ↔ time: Remotion counts integer frames at a fixed `fps`, while the media contract speaks seconds. `duration` is
 * `durationInFrames / fps`, `currentTime` is `frame / fps`, and seeks round to the nearest frame.
 */
export class RemotionAdapter extends MediaPlayedRangesMixin(EventTarget) implements Partial<Video> {
  static readonly defaultProps: RemotionAdapterProps = {
    source: null,
    autoplay: false,
    defaultMuted: false,
    muted: false,
    volume: 1,
    loop: false,
    playbackRate: 1,
    controls: false,
    playsInline: true,
    poster: '',
  };

  static PLAYER_SOFTWARE_NAME = 'remotion-video';

  #player: PlayerRef | null = null;
  #unbind: (() => void) | null = null;

  #source: RemotionSource | null = null;
  #autoplay = RemotionAdapter.defaultProps.autoplay;
  #defaultMuted = RemotionAdapter.defaultProps.defaultMuted;
  #controls = RemotionAdapter.defaultProps.controls;
  #playsInline = RemotionAdapter.defaultProps.playsInline;
  #poster = RemotionAdapter.defaultProps.poster;

  #paused = true;
  #ended = false;
  #seeking = false;
  #buffering = false;
  #currentTime = 0;
  #volume = RemotionAdapter.defaultProps.volume;
  #muted = RemotionAdapter.defaultProps.muted;
  #playbackRate = RemotionAdapter.defaultProps.playbackRate;
  #loop = RemotionAdapter.defaultProps.loop;
  #readyState: number = MediaReadyState.HAVE_NOTHING;
  #error: MediaError | null = null;

  // Remotion's `seekTo` while playing pauses, seeks, then resumes in an effect, emitting `pause` and `play` around the
  // seek. Those are mechanics, not state changes the store should see, so a seek from a playing state swallows one of
  // each. Seeking onto the last frame pauses without resuming, so its `pause` has no matching `play`; `ended` zeroes
  // both counters rather than decrementing, leaving no debt for the next real event to absorb.
  #swallowPause = 0;
  #swallowPlay = 0;
  #seekTargetFrame = -1;

  // The React façade subscribes here for the values that only reach Remotion as `<Player>` props.
  #propListeners = new Set<() => void>();
  #propsSnapshot: RemotionPlayerProps = this.#snapshotPlayerProps();

  /** The Remotion `PlayerRef`, or null until a `<Player>` mounts. */
  get engine(): PlayerRef | null {
    return this.#player;
  }

  /** Subscribe to `<Player>` prop changes; the React façade feeds this to `useSyncExternalStore`. */
  subscribePlayerProps = (listener: () => void): (() => void) => {
    this.#propListeners.add(listener);
    return () => this.#propListeners.delete(listener);
  };

  getPlayerProps = (): RemotionPlayerProps => this.#propsSnapshot;

  #snapshotPlayerProps(): RemotionPlayerProps {
    return {
      source: this.#source,
      loop: this.#loop,
      playbackRate: this.#playbackRate,
      initiallyMuted: this.#muted || this.#defaultMuted,
      initialVolume: this.#volume,
    };
  }

  #notifyPlayerProps() {
    this.#propsSnapshot = this.#snapshotPlayerProps();

    for (const listener of this.#propListeners) listener();
  }

  attach(player: PlayerRef | null): void {
    if (!player || this.#player === player) return;

    if (this.#player) this.detach();

    this.#player = player;
    this.#bindPlayerEvents(player);

    // Mirror what the mounted Player already holds; `initiallyMuted`/`initialVolume` only apply at mount.
    this.#volume = player.getVolume();
    this.#muted = player.isMuted();
    this.#paused = !player.isPlaying();
    this.#currentTime = this.#frameToTime(player.getCurrentFrame());

    this.#announceLoaded();
  }

  detach(): void {
    if (!this.#player) return;

    this.#unbind?.();
    this.#unbind = null;
    this.#player = null;
    this.#resetPlaybackState();
  }

  override destroy() {
    this.detach();
    this.#propListeners.clear();
    super.destroy();
  }

  // ----------------------------------------
  // Source
  // ----------------------------------------

  get source(): RemotionSource | null {
    return this.#source;
  }
  set source(value: RemotionSource | null) {
    const source = value ?? null;
    if (source === this.#source) return;

    const previous = this.#source;
    const previousDuration = this.duration;

    this.#source = source;
    this.#notifyPlayerProps();

    // Same `id`, so the mounted `<Player>` keeps playing and takes the rest as props. Nothing reloads, but what the
    // adapter reports has to follow what the new object says.
    if (previous && source && isSameSource(previous, source)) {
      // Only when the tracks really changed: rewriting cues walks the track's `mode`, which the store's text-track
      // feature listens to, and an `inputProps` edit arrives on every keystroke.
      if (!isSameChapters(previous.chapters, source.chapters)) this.#syncChapters();

      if (!isSameSubtitles(previous.subtitles, source.subtitles)) this.#syncSubtitles();

      // `currentTime` is seconds derived from a frame, so a new `fps` remaps it and a shorter composition can leave it
      // past the end. Re-read the frame the Player is actually on rather than wait for the next `frameupdate`.
      if (this.#player) {
        const currentTime = this.#frameToTime(this.#player.getCurrentFrame());

        if (currentTime !== this.#currentTime) {
          this.#currentTime = currentTime;
          this.dispatchEvent(new Event('timeupdate'));
        }
      }

      if (this.duration !== previousDuration) this.dispatchEvent(new Event('durationchange'));

      return;
    }

    this.dispatchEvent(new Event('sourcechange'));
    // A new `id` remounts `<Player>`, and the one on its way out has nothing to say about a composition it never
    // rendered. Let go of it now so `load()` neither rewinds it nor announces readiness on its behalf; the remount
    // re-attaches and announces once.
    this.detach();
    void this.load();
  }

  get src() {
    return this.#source ? `remotion:${this.#source.id}` : '';
  }
  set src(_value: string) {
    // A composition cannot be named by URL; `source` is the one way to set what plays.
  }

  get currentSrc() {
    return this.src;
  }

  get readyState() {
    return this.#readyState;
  }

  get preload(): MediaPreloadType {
    return 'auto';
  }
  set preload(_value: MediaPreloadType) {}

  get crossOrigin() {
    return null;
  }
  set crossOrigin(_value: string | null) {}

  canPlayType(type: string) {
    return type === 'video/remotion' ? ('probably' as const) : ('' as const);
  }

  /**
   * Start the current source over. A new `id` arrives here with no Player attached and leaves announcing to the remount
   * the façade's key forces; a direct call leaves the same one mounted, so take it back to a paused first frame rather
   * than let it play on under a state that says otherwise.
   */
  async load() {
    this.#resetPlaybackState();

    if (this.#player) {
      this.#player.pause();
      this.#player.seekTo(0);
    }

    // A `TextTrack` cannot be removed from its list and its label and language are fixed at creation, so the host that
    // owns them is replaced instead. The store re-reads the list on `loadstart`.
    this.#resetTextTracks();
    this.dispatchEvent(new Event('emptied'));

    if (!this.#source) return;

    // Tracks are in place before `loadstart`, which is when the text-track feature re-reads the list.
    this.#syncChapters();
    this.#syncSubtitles();
    this.dispatchEvent(new Event('loadstart'));

    if (this.#player) this.#announceLoaded();
  }

  #announceLoaded() {
    if (!this.#source) return;

    // Compositions are code: once the Player is mounted every frame is renderable, so metadata and "enough data"
    // arrive together. `waiting`/`resume` from embedded media lower and restore `readyState` afterwards.
    this.#readyState = MediaReadyState.HAVE_ENOUGH_DATA;

    for (const type of [
      'loadedmetadata',
      'durationchange',
      'loadeddata',
      'canplay',
      'canplaythrough',
      'volumechange',
    ]) {
      this.dispatchEvent(new Event(type));
    }
  }

  #resetPlaybackState() {
    this.#paused = true;
    this.#ended = false;
    this.#seeking = false;
    this.#buffering = false;
    this.#currentTime = 0;
    this.#readyState = MediaReadyState.HAVE_NOTHING;
    this.#error = null;
    this.#swallowPause = 0;
    this.#swallowPlay = 0;
    this.#seekTargetFrame = -1;
  }

  // ----------------------------------------
  // Playback
  // ----------------------------------------

  get paused() {
    return this.#paused;
  }

  get ended() {
    return this.#ended;
  }

  get seeking() {
    return this.#seeking;
  }

  async play() {
    // A deliberate play must never be swallowed as a seek-resume.
    this.#swallowPlay = 0;

    if (!this.#player) {
      // Nothing mounted yet; the store reads `paused` optimistically and the Player autoplays on mount.
      this.#autoplay = true;
      return;
    }

    this.#player.play();
  }

  pause() {
    this.#swallowPause = 0;

    // A play before the Player mounted only armed `autoplay`; pausing before it mounts has to disarm it again, or the
    // façade still mounts with `autoPlay` and playback starts anyway.
    this.#autoplay = false;

    // A seek from a playing state left Remotion paused with a resume pending, and one `play` owed here. Its `pause()`
    // cancels that resume, but it is already paused so it emits nothing: the owed `play` never comes, and the pause is
    // reported from here.
    if (this.#swallowPlay > 0) {
      this.#swallowPlay = 0;
      this.#paused = true;
      this.dispatchEvent(new Event('pause'));
    }

    this.#player?.pause();
  }

  get currentTime() {
    return this.#currentTime;
  }
  set currentTime(value) {
    const frame = this.#timeToFrame(value);
    const snapped = this.#frameToTime(frame);
    // Already on that frame, or already on the way to it. Re-running would tell Remotion to seek where it is going
    // anyway and leave a second pause/play pair owed, which the next real one would then be swallowed to repay.
    if (this.#seeking ? frame === this.#seekTargetFrame : snapped === this.#currentTime) return;

    this.#seeking = true;
    // Like a media element, leaving the end clears `ended`.
    this.#ended = false;
    this.#currentTime = snapped;
    this.dispatchEvent(new Event('seeking'));

    const player = this.#player;

    if (!player) {
      this.#seeking = false;
      this.dispatchEvent(new Event('timeupdate'));
      this.dispatchEvent(new Event('seeked'));
      return;
    }

    if (player.isPlaying()) {
      this.#swallowPause++;
      this.#swallowPlay++;
    }

    this.#seekTargetFrame = frame;
    player.seekTo(frame);
  }

  #finishSeek() {
    if (!this.#seeking) return;

    this.#seeking = false;
    this.#seekTargetFrame = -1;
    this.dispatchEvent(new Event('seeked'));
  }

  get duration() {
    const source = this.#source;

    return source ? source.composition.durationInFrames / source.composition.fps : Number.NaN;
  }

  get loop() {
    return this.#loop;
  }
  set loop(value) {
    if (this.#loop === value) return;

    this.#loop = value;
    this.#notifyPlayerProps();
  }

  get autoplay() {
    return this.#autoplay;
  }
  set autoplay(value) {
    this.#autoplay = value;
  }

  // ----------------------------------------
  // Volume
  // ----------------------------------------

  get volume() {
    return this.#volume;
  }
  set volume(value) {
    if (this.#volume === value) return;

    this.#volume = value;

    if (this.#player) this.#player.setVolume(value);
    else {
      this.#notifyPlayerProps();
      this.dispatchEvent(new Event('volumechange'));
    }
  }

  get muted() {
    return this.#muted;
  }
  set muted(value) {
    if (this.#muted === value) return;

    this.#muted = value;

    if (this.#player) {
      if (value) this.#player.mute();
      else this.#player.unmute();
    } else {
      this.#notifyPlayerProps();
      this.dispatchEvent(new Event('volumechange'));
    }
  }

  get defaultMuted() {
    return this.#defaultMuted;
  }
  set defaultMuted(value) {
    if (this.#defaultMuted === value) return;

    this.#defaultMuted = value;
    this.#notifyPlayerProps();
  }

  // ----------------------------------------
  // Rate
  // ----------------------------------------

  get playbackRate() {
    return this.#playbackRate;
  }
  set playbackRate(value) {
    if (this.#playbackRate === value) return;

    // Remotion takes the rate as a `<Player>` prop and answers with `ratechange` once it applies.
    this.#playbackRate = value;
    this.#notifyPlayerProps();
  }

  get defaultPlaybackRate() {
    return 1;
  }
  set defaultPlaybackRate(_value: number) {}

  // ----------------------------------------
  // Ranges, tracks, and other opt-outs
  // ----------------------------------------

  // A composition is fully addressable once mounted; there is no byte buffer to report.
  get buffered() {
    return this.#player && this.duration > 0 ? createTimeRange(0, this.duration) : EMPTY_TIME_RANGES;
  }

  get seekable() {
    return this.duration > 0 ? createTimeRange(0, this.duration) : EMPTY_TIME_RANGES;
  }

  // A composition has no native track list, so a detached `<video>` hosts one (the YouTube adapter does the same for
  // caption metadata). Chapters are the one track a composition can vouch for: its scenes are known up front.
  #textTracksHost: HTMLVideoElement | null = null;
  #chaptersTrack: TextTrack | null = null;
  #subtitlesTrack: TextTrack | null = null;

  // Null wherever a host cannot carry tracks — no document, or a stand-in whose `addTextTrack` is a no-op, as jsdom's
  // is. Both track syncs then do nothing rather than throwing.
  #hostTextTrack(kind: TextTrackKind, label?: string, language?: string): TextTrack | null {
    const host = (this.#textTracksHost ??= globalThis.document?.createElement('video') ?? null);

    return host?.addTextTrack?.(kind, label, language) ?? null;
  }

  /** Drop the host so the next source builds its own tracks, with its own labels and languages. */
  #resetTextTracks() {
    this.#textTracksHost = null;
    this.#chaptersTrack = null;
    this.#subtitlesTrack = null;
  }

  #syncSubtitles() {
    const subtitles = this.#source?.subtitles;
    // Created on first use, so a composition without captions leaves the captions menu empty.
    if (!subtitles && !this.#subtitlesTrack) return;

    const track = (this.#subtitlesTrack ??= this.#hostTextTrack('subtitles', subtitles?.label, subtitles?.language));
    if (!track) return;

    // Cues are only enumerable while the track is not disabled, so a disabled one is lifted to `hidden` for the
    // rewrite and put back. Any other mode is left alone: each write fires `change`, which the store reads.
    const mode = track.mode;

    if (mode === 'disabled') track.mode = 'hidden';

    for (const cue of Array.from(track.cues ?? [])) track.removeCue(cue);

    for (const cue of subtitles?.cues ?? []) track.addCue(new VTTCue(cue.startMs / 1000, cue.endMs / 1000, cue.text));

    if (track.mode !== mode) track.mode = mode;
  }

  get textTracks() {
    this.#textTracksHost ??= globalThis.document?.createElement('video') ?? null;

    return (this.#textTracksHost?.textTracks as TextTrackListLike | undefined) ?? EMPTY_TEXT_TRACKS;
  }

  #syncChapters() {
    const source = this.#source;
    const spans = source ? resolveChapterSpans(source) : [];
    // Created on first use, so a composition without scenes leaves no empty track behind in the list.
    if (!spans.length && !this.#chaptersTrack) return;

    const track = (this.#chaptersTrack ??= this.#hostTextTrack('chapters', 'Scenes'));
    if (!track) return;

    // Cues are only readable while the track is not disabled.
    if (track.mode !== 'hidden') track.mode = 'hidden';

    for (const cue of Array.from(track.cues ?? [])) track.removeCue(cue);

    for (const span of spans) track.addCue(new VTTCue(span.startTime, span.endTime, span.title));
  }

  get error() {
    return this.#error;
  }

  get videoWidth() {
    return this.#source?.composition.compositionWidth ?? 0;
  }

  get videoHeight() {
    return this.#source?.composition.compositionHeight ?? 0;
  }

  get controls() {
    return this.#controls;
  }
  set controls(value) {
    this.#controls = value;
  }

  get playsInline() {
    return this.#playsInline;
  }
  set playsInline(value) {
    this.#playsInline = value;
  }

  get poster() {
    return this.#poster;
  }
  set poster(value) {
    this.#poster = value;
  }

  // Fullscreen and picture-in-picture are deliberately absent: the player's container owns fullscreen, and a
  // composition is a `<div>`, so PiP reports as unsupported and its button hides.

  // ----------------------------------------
  // Remotion → media events
  // ----------------------------------------

  #bindPlayerEvents(player: PlayerRef) {
    const emit = (type: string) => this.dispatchEvent(new Event(type));
    const on = <T extends EventTypes>(type: T, listener: CallbackListener<T>) => {
      player.addEventListener(type, listener);
      return () => player.removeEventListener(type, listener);
    };

    const offs = [
      on('play', () => {
        if (this.#swallowPlay > 0) {
          this.#swallowPlay--;
          return;
        }

        this.#paused = false;
        this.#ended = false;
        emit('play');

        if (!this.#buffering) emit('playing');
      }),
      on('pause', () => {
        if (this.#swallowPause > 0) {
          this.#swallowPause--;
          return;
        }

        this.#paused = true;
        emit('pause');
      }),
      on('ended', () => {
        this.#swallowPause = 0;
        this.#swallowPlay = 0;
        this.#paused = true;
        this.#ended = true;
        // Seeking onto the last frame emits `ended` before Remotion's own `seeked`; a media element finishes the seek
        // first, so the seek ends here and the `seeked` that follows is a no-op.
        this.#finishSeek();
        emit('ended');
      }),
      on('seeked', (event) => {
        this.#currentTime = this.#frameToTime(event.detail.frame);
        emit('timeupdate');
        this.#finishSeek();
      }),
      on('frameupdate', (event) => {
        const time = this.#frameToTime(event.detail.frame);

        if (time !== this.#currentTime) {
          this.#currentTime = time;
          emit('timeupdate');
        }

        // The frame we asked for has rendered; whether Remotion announced it as a seek or not, it is done.
        if (this.#seeking && event.detail.frame === this.#seekTargetFrame) this.#finishSeek();
      }),
      on('waiting', () => {
        this.#buffering = true;
        this.#readyState = MediaReadyState.HAVE_CURRENT_DATA;
        emit('waiting');
      }),
      on('resume', () => {
        this.#buffering = false;
        this.#readyState = MediaReadyState.HAVE_ENOUGH_DATA;

        if (!this.#paused) emit('playing');
      }),
      on('volumechange', (event) => {
        this.#volume = event.detail.volume;
        emit('volumechange');
      }),
      on('mutechange', (event) => {
        this.#muted = event.detail.isMuted;
        emit('volumechange');
      }),
      on('ratechange', (event) => {
        this.#playbackRate = event.detail.playbackRate;
        emit('ratechange');
      }),
      on('error', (event) => {
        this.#error = new MediaError(event.detail.error.message, MediaError.MEDIA_ERR_CUSTOM, true);
        emit('error');
      }),
    ];

    this.#unbind = () => {
      for (const off of offs) off();
    };
  }

  #frameToTime(frame: number) {
    const fps = this.#source?.composition.fps ?? 30;

    return frame / fps;
  }

  #timeToFrame(time: number) {
    const source = this.#source;
    if (!source) return 0;

    const frame = Math.round(time * source.composition.fps);

    return Math.min(Math.max(frame, 0), source.composition.durationInFrames - 1);
  }
}
