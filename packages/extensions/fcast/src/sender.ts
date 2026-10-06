/** A media load request passed to an application-provided FCast sender. @experimental */
export interface FCastLoadRequest {
  url: string;
  contentType: string;
  time: number;
  paused: boolean;
  volume: number;
  speed: number;
}

/** State reported by an application-provided FCast sender after discovery and receiver updates. @experimental */
export interface FCastSnapshot {
  availability: 'available' | 'unavailable' | 'unsupported';
  connection: 'disconnected' | 'connecting' | 'connected';
  deviceName?: string | undefined;
  paused: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  speed: number;
  buffering?: boolean | undefined;
  ended?: boolean | undefined;
}

/**
 * Browser-facing adapter for a native FCast SDK sender or a local bridge. The adapter owns discovery, device selection,
 * the FCast protocol connection, and dispatches `change` whenever `snapshot` changes. `prompt` resolves after the
 * picker closes; a successful connection must be reflected in `snapshot` and a `change` event.
 *
 * A browser cannot open FCast's TCP connection or perform mDNS discovery, so this interface deliberately does not claim
 * to implement those operations in the page.
 *
 * @experimental
 */
export interface FCastSender extends EventTarget {
  readonly snapshot: FCastSnapshot;
  prompt(): Promise<void>;
  disconnect(): Promise<void>;
  load(request: FCastLoadRequest): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  seek(time: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  setSpeed(speed: number): Promise<void>;
}
