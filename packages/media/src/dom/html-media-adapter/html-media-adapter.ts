import type { EventListenerFor, EventType, QueriedElement } from '@videojs/utils/dom';

import { EMPTY_REMOTE, EMPTY_TEXT_TRACKS, EMPTY_TIME_RANGES } from '../../core/constants';
import {
  type EventLike,
  type CommonMedia,
  type MediaStreamType,
  MediaStreamTypes,
  type MediaTargetLike,
  type TextTrackKind,
  type TextTrackLike,
} from '../../core/types';

export interface HTMLMediaTargetLike extends MediaTargetLike, EventTarget {
  querySelector<E extends Element = Element>(selectors: string): E | null;
  querySelectorAll<E extends Element = Element>(selectors: string): NodeListOf<E> | never[];
}

/** An {@link HTMLMediaAdapter} over any target and event map: the shape element façades share. */
export type AnyHTMLMediaAdapter<Target extends HTMLMediaTargetLike = any> = HTMLMediaAdapter<Target, any>;

/**
 * Forwards a media surface to an attached native-like target and re-dispatches the target's events on itself. Every
 * getter, setter, and method reaches the target directly; anything that intercepts media members sits above this
 * adapter, at the player.
 */
export class HTMLMediaAdapter<Target extends HTMLMediaTargetLike, Events extends { [K in keyof Events]: EventLike }>
  extends EventTarget
  implements CommonMedia
{
  #target: Target | null = null;
  #eventTypes = new Set<string>();
  #streamType: MediaStreamType = MediaStreamTypes.UNKNOWN;

  protected get target() {
    return this.#target;
  }

  attach(target: Target) {
    if (!target || this.#target === target) return;

    this.#target = target;

    for (const type of this.#eventTypes) {
      target.addEventListener(type, this.#forwardEvent);
    }
  }

  detach() {
    if (!this.#target) return;

    for (const type of this.#eventTypes) {
      this.#target.removeEventListener(type, this.#forwardEvent);
    }

    this.#target = null;
  }

  destroy() {
    this.detach();
    this.#eventTypes.clear();
  }

  querySelectorAll<E extends Element = Element, S extends string = string>(selectors: S) {
    return (this.target?.querySelectorAll(selectors) ?? []) as NodeListOf<QueriedElement<S, E>> | never[];
  }

  querySelector<E extends Element = Element, S extends string = string>(selectors: S) {
    return (this.target?.querySelector(selectors) ?? null) as QueriedElement<S, E> | null;
  }

  addEventListener<K extends EventType<Events>>(
    type: K,
    listener: EventListenerFor<Events, K>,
    options?: boolean | AddEventListenerOptions
  ) {
    if (!this.#eventTypes.has(type)) {
      this.#eventTypes.add(type);
      this.target?.addEventListener(type, this.#forwardEvent);
    }

    super.addEventListener(type, listener as EventListener, options);
  }

  removeEventListener<K extends EventType<Events>>(
    type: K,
    listener: EventListenerFor<Events, K>,
    options?: boolean | EventListenerOptions
  ) {
    super.removeEventListener(type, listener as EventListener, options);
  }

  #forwardEvent = (event: Event) => {
    this.dispatchEvent(new (event.constructor as typeof Event)(event.type, event));
  };

  /**
   * Current stream type (`'on-demand'`, `'live'`, or `'unknown'`). Defaults to `'unknown'`; detecting hosts update it
   * automatically, and consumers can set it to override detection.
   */
  get streamType() {
    return this.target?.streamType ?? this.#streamType;
  }
  set streamType(value) {
    if (this.streamType === value) return;

    this.#streamType = value;

    if (this.target) this.target.streamType = value;

    this.dispatchEvent(new Event('streamtypechange'));
  }

  get liveEdgeStart() {
    return this.target?.liveEdgeStart ?? Number.NaN;
  }

  get targetLiveWindow() {
    return this.target?.targetLiveWindow ?? Number.NaN;
  }

  get contentData() {
    return this.target?.contentData;
  }

  get title() {
    return this.target?.title ?? '';
  }
  set title(value) {
    if (this.target) this.target.title = value;
  }

  get controls() {
    return this.target?.controls ?? false;
  }
  set controls(value) {
    if (this.target) this.target.controls = value;
  }

  get paused() {
    return this.target?.paused ?? true;
  }

  get ended() {
    return this.target?.ended ?? false;
  }

  get loop() {
    return this.target?.loop ?? false;
  }
  set loop(value) {
    if (this.target) this.target.loop = value;
  }

  play() {
    return this.target?.play?.() ?? Promise.reject(new DOMException('No media is attached.', 'NotSupportedError'));
  }

  pause() {
    this.target?.pause?.();
  }

  get autoplay() {
    return this.target?.autoplay ?? false;
  }
  set autoplay(value) {
    if (this.target) this.target.autoplay = value;
  }

  get currentTime() {
    return this.target?.currentTime ?? 0;
  }
  set currentTime(value) {
    if (this.target) this.target.currentTime = value;
  }

  get duration() {
    return this.target?.duration ?? NaN;
  }

  get seeking() {
    return this.target?.seeking ?? false;
  }

  get src() {
    return this.target?.src ?? '';
  }
  set src(value) {
    if (this.target) this.target.src = value;
  }

  get currentSrc() {
    return this.target?.currentSrc ?? '';
  }

  get readyState() {
    return this.target?.readyState ?? 0;
  }

  get preload() {
    return this.target?.preload ?? 'metadata';
  }
  set preload(value) {
    if (this.target) this.target.preload = value;
  }

  get crossOrigin() {
    return this.target?.crossOrigin ?? null;
  }
  set crossOrigin(value) {
    if (this.target) this.target.crossOrigin = value;
  }

  load() {
    return this.target?.load?.();
  }

  canPlayType(type: string) {
    return this.target?.canPlayType?.(type) ?? '';
  }

  get volume() {
    return this.target?.volume ?? 1;
  }
  set volume(value) {
    if (this.target) this.target.volume = value;
  }

  get muted() {
    return this.target?.muted ?? false;
  }
  set muted(value) {
    if (this.target) this.target.muted = value;
  }

  get defaultMuted() {
    return this.target?.defaultMuted ?? false;
  }
  set defaultMuted(value) {
    if (this.target) this.target.defaultMuted = value;
  }

  get playbackRate() {
    return this.target?.playbackRate ?? 1;
  }
  set playbackRate(value) {
    if (this.target) this.target.playbackRate = value;
  }

  get defaultPlaybackRate() {
    return this.target?.defaultPlaybackRate ?? 1;
  }
  set defaultPlaybackRate(value) {
    if (this.target) this.target.defaultPlaybackRate = value;
  }

  get buffered() {
    return (this.target?.buffered ?? EMPTY_TIME_RANGES) as TimeRanges;
  }

  get seekable() {
    return (this.target?.seekable ?? EMPTY_TIME_RANGES) as TimeRanges;
  }

  get played() {
    return (this.target?.played ?? EMPTY_TIME_RANGES) as TimeRanges;
  }

  get error() {
    return this.target?.error ?? null;
  }

  get textTracks() {
    return (this.target?.textTracks ?? EMPTY_TEXT_TRACKS) as TextTrackList;
  }

  addTextTrack(kind: TextTrackKind, label?: string, language?: string) {
    return this.target?.addTextTrack?.(kind, label, language) as TextTrackLike;
  }

  get remote() {
    return this.target?.remote ?? EMPTY_REMOTE;
  }

  get disableRemotePlayback() {
    return this.target?.disableRemotePlayback ?? false;
  }
  set disableRemotePlayback(value) {
    if (this.target) this.target.disableRemotePlayback = value;
  }
}
