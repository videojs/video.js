/** A media load request passed to an application-provided FCast bridge. */
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
}

/** Normalized receiver state published by an application-provided FCast bridge. */
export interface FCastSnapshot {
  /** Unsupported means no usable bridge; unavailable means discovery currently has no receivers. */
  availability: 'available' | 'unavailable' | 'unsupported';
  connection: 'disconnected' | 'connecting' | 'connected';
  deviceName?: string | undefined;
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
  buffering?: boolean | undefined;
  ended?: boolean | undefined;
}

/**
 * Standard browser-facing contract for an application-provided native sender or local FCast bridge.
 *
 * The bridge owns discovery, permissions, receiver selection, protocol negotiation, transport, and heartbeat handling.
 * It publishes a complete `snapshot` before dispatching `change`, including on connection loss. Discovery availability
 * is independent of an existing connection. Playback state comes from receiver updates, not command completion.
 *
 * Commands reject on failure and when disconnected. A resolved command means it was sent, not acknowledged by the
 * receiver. Asynchronous receiver or transport errors dispatch `CustomEvent<unknown>('error', { detail: error })`. The
 * bridge serializes commands, and disconnect cancels pending selection and unsent commands before stopping receiver
 * playback and closing the session. No updates from an old session may overwrite a subsequent session's state.
 *
 * The application creates and disposes the bridge and owns its discovery resources. One bridge controls one player
 * session at a time. Video.js only subscribes, issues commands, and disconnects on removal; it does not destroy the
 * bridge. No transport, global injection mechanism, or bridge implementation is supplied by this package.
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
}

/** Compatible name for the FCast bridge accepted by the `sender` property. */
export type FCastSender = FCastBridge;
