/**
 * WebKit presentation mode values for iOS Safari.
 *
 * @internal
 */
export type WebKitPresentationMode = 'inline' | 'fullscreen' | 'picture-in-picture';

/**
 * Extended HTMLVideoElement with WebKit vendor APIs.
 *
 * @internal
 */
export interface WebKitVideoElement extends HTMLVideoElement {
  /** Whether the current playback target is wireless (WebKit) */
  webkitCurrentPlaybackTargetIsWireless?: boolean;
  /** Current WebKit presentation mode (iOS Safari). */
  webkitPresentationMode?: WebKitPresentationMode;
  /** Set WebKit presentation mode (iOS Safari). */
  webkitSetPresentationMode?: (mode: WebKitPresentationMode) => void;
}

/**
 * Extended Element with WebKit fullscreen vendor API.
 *
 * @internal
 */
export interface WebKitFullscreenElement extends Element {
  /** Request fullscreen using WebKit API (Safari). */
  webkitRequestFullscreen?: () => Promise<void>;
}

/**
 * Extended Document with WebKit fullscreen vendor APIs.
 *
 * @internal
 */
export interface WebKitDocument extends Document {
  /** Current fullscreen element (WebKit). */
  webkitFullscreenElement?: Element | null;
  /** Whether fullscreen is enabled (WebKit). */
  webkitFullscreenEnabled?: boolean;
  /** Exit fullscreen (WebKit). */
  webkitExitFullscreen?: () => Promise<void>;
}

/**
 * WebKit-specific AirPlay availability event payload (not in lib.dom).
 *
 * @internal
 */
export type WebkitAvailabilityEvent = Event & { availability: 'available' | 'not-available' };

/**
 * Whether WebKit's AirPlay APIs are present in this realm (Safari macOS/iOS).
 *
 * @internal
 */
export function supportsWebKitAirPlay(): boolean {
  return 'WebKitPlaybackTargetAvailabilityEvent' in globalThis;
}

/**
 * Whether `media` exposes WebKit's AirPlay APIs.
 *
 * @internal
 */
export function isWebKitAirPlayCapable(media: EventTarget): media is WebKitVideoElement {
  return supportsWebKitAirPlay() && 'webkitCurrentPlaybackTargetIsWireless' in media;
}
