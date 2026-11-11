/** Receiver display metadata. Bridges omit fields unsupported by the negotiated protocol. @experimental */
export interface FCastMetadata {
  title?: string | undefined;
  thumbnailUrl?: string | undefined;
}

/** An external caption or subtitle resource reachable by the receiver. @experimental */
export interface FCastSubtitle {
  url: string;
  label: string;
  language: string;
  kind: 'captions' | 'subtitles';
}

/** A media load request passed to an application-provided FCast bridge. @experimental */
export interface FCastLoadRequest {
  /** Absolute media URL reachable by the receiver, not a browser blob URL or embed page. */
  url: string;
  /** Media MIME type. An empty string means the bridge must infer it or reject the load. */
  contentType: string;
  /** Initial playback position in seconds. */
  time: number;
  /** Desired state after loading; the bridge pauses after loading if the protocol starts playback automatically. */
  paused: boolean;
  /** Initial volume between zero and one. Zero represents muted playback. */
  volume: number;
  /** Positive playback rate multiplier. */
  speed: number;
  metadata?: FCastMetadata | undefined;
  /** Included only when the bridge implements setSubtitle. */
  subtitles?: readonly FCastSubtitle[] | undefined;
  /** URL of the selected external subtitle, or null to disable subtitles. */
  selectedSubtitle?: string | null | undefined;
}

/** Normalized receiver state published by an application-provided FCast bridge. @experimental */
export interface FCastSnapshot {
  /** Unsupported means no usable bridge; unavailable means discovery currently has no receivers. */
  availability: 'available' | 'unavailable' | 'unsupported';
  connection: 'disconnected' | 'connecting' | 'connected';
  deviceName?: string | undefined;
  /** Receiver media state, independent of whether a transport is connected. */
  playbackState: 'idle' | 'buffering' | 'playing' | 'paused' | 'ended';
  /** Currently loaded URL, when known. A matching non-idle source is adopted without reloading on connection. */
  mediaUrl?: string | undefined;
  /** Selected external subtitle URL, or null for off. Omit when the bridge cannot report selection. */
  selectedSubtitle?: string | null | undefined;
  paused: boolean;
  /** Playback position in seconds, irrespective of the negotiated protocol's time units. */
  currentTime: number;
  /** Duration in seconds, NaN when unknown, or Infinity for an unbounded live stream. */
  duration: number;
  /** Receiver volume between zero and one. */
  volume: number;
  /** True when receiver volume is zero; FCast has no independent mute command. */
  muted: boolean;
  /** Positive playback rate multiplier. */
  speed: number;
  /** Compatibility hint; playbackState is authoritative. */
  buffering?: boolean | undefined;
  /** Compatibility hint; playbackState is authoritative. */
  ended?: boolean | undefined;
}

/**
 * Standard browser-facing contract for an application-provided native sender or local FCast bridge.
 *
 * The bridge owns discovery, permissions, receiver selection, protocol negotiation, transport, and heartbeat handling.
 * It publishes a complete `snapshot` before dispatching `change`, including on connection loss. Discovery availability
 * is independent of an existing connection. Playback state comes from receiver updates, not command completion. Publish
 * idle before media is loaded, buffering while loading, and the receiver's resulting state afterward. Keep paused
 * consistent with playbackState (buffering retains the intended paused state).
 *
 * Commands reject on failure and when disconnected. A resolved command means it was sent, not acknowledged by the
 * receiver. Asynchronous receiver or transport errors dispatch `CustomEvent<unknown>('error', { detail: error })`. The
 * bridge serializes commands, and disconnect cancels pending selection and unsent commands before stopping receiver
 * playback and closing the session. No updates from an old session may overwrite a subsequent session's state.
 *
 * The application creates and disposes the bridge and owns its discovery resources. One bridge controls one player
 * session at a time. Video.js only subscribes, issues commands, and disconnects on removal; it does not destroy the
 * bridge. No transport, global injection mechanism, or bridge implementation is supplied by this package.
 *
 * @experimental
 */
export interface FCastBridge extends EventTarget {
  readonly snapshot: FCastSnapshot;
  /** Select a receiver. Publish connecting then connected; reject cancellation with AbortError and restore disconnected. */
  prompt(): Promise<void>;
  /** Idempotently stop remote playback, cancel a pending picker/connection, and publish disconnected before resolving. */
  disconnect(): Promise<void>;
  /** Replace receiver media and apply the requested position, volume, speed, and paused state in order. */
  load(request: FCastLoadRequest): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  /** Seek to a position in seconds. */
  seek(time: number): Promise<void>;
  /** Set volume in [0, 1]; zero mutes. Publish both volume and muted from receiver updates. */
  setVolume(volume: number): Promise<void>;
  /** Set a positive playback rate multiplier. */
  setSpeed(speed: number): Promise<void>;
  /**
   * Optional external subtitle support. Select/add this resource, or disable subtitles with null. Expose only when the
   * negotiated receiver supports external subtitles; publish selectedSubtitle after confirmation. Load applies
   * subtitles and selectedSubtitle before completing. Unsupported metadata may be ignored.
   */
  setSubtitle?(subtitle: FCastSubtitle | null): Promise<void>;
}

/** Compatible name for the FCast bridge accepted by the `sender` property. @experimental */
export type FCastSender = FCastBridge;
