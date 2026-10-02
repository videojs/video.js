import { isBoolean, isNumber, isString } from '@videojs/utils/predicate';

import { findMediaElement, type MediaLike } from './media-element';
import { parseFlag, readFlag, subscribe, subscribeMessage } from './sandbox-listener';

/** The playback state one compare panel reports and the other applies. Moves state, not coordinates. */
export interface MirroredState {
  readonly paused: boolean;
  readonly currentTime: number;
  readonly volume: number;
  readonly muted: boolean;
  readonly playbackRate: number;
  readonly textTracks: readonly MirroredTextTrack[];
}

interface MirroredTextTrack {
  readonly kind: string;
  readonly label: string;
  readonly language: string;
  readonly mode: TextTrackMode;
}

const EVENTS = ['play', 'pause', 'seeked', 'volumechange', 'ratechange'] as const;
const TEXT_TRACK_MODES: readonly TextTrackMode[] = ['disabled', 'hidden', 'showing'];
/** Seeks closer than this are the drift of two players running, not a seek worth mirroring. */
const SEEK_TOLERANCE = 0.5;

let enabled = readFlag('mirror');
let media: MediaLike | undefined;
let unbind: (() => void) | undefined;
let applying = false;
let lastReported = '';

function snapshot(element: MediaLike): MirroredState {
  return {
    paused: element.paused,
    currentTime: element.currentTime,
    volume: element.volume,
    muted: element.muted,
    playbackRate: element.playbackRate,
    textTracks: [...element.textTracks].map(({ kind, label, language, mode }) => ({ kind, label, language, mode })),
  };
}

function report(): void {
  if (!enabled || applying || !media || window.parent === window) return;

  const state = snapshot(media);
  const serialized = JSON.stringify(state);
  if (serialized === lastReported) return;

  lastReported = serialized;
  window.parent.postMessage({ type: 'sandbox-mirror', state }, '*');
}

/** Apply a sibling's state, touching only what differs so the resulting events do not echo back as changes. */
function apply(state: MirroredState): void {
  if (!enabled || !media) return;

  applying = true;

  try {
    if (media.muted !== state.muted) media.muted = state.muted;

    if (Math.abs(media.volume - state.volume) > 0.001) media.volume = state.volume;

    if (media.playbackRate !== state.playbackRate) media.playbackRate = state.playbackRate;

    if (Math.abs(media.currentTime - state.currentTime) > SEEK_TOLERANCE) media.currentTime = state.currentTime;

    for (const track of media.textTracks) {
      const mirrored = state.textTracks.find(
        (candidate) =>
          candidate.kind === track.kind && candidate.label === track.label && candidate.language === track.language
      );

      if (mirrored && track.mode !== mirrored.mode) track.mode = mirrored.mode;
    }

    if (state.paused && !media.paused) media.pause();
    // A play the browser refuses without a gesture in this frame stays paused; the report from here says so.
    else if (!state.paused && media.paused) media.play().catch(() => undefined);
  } finally {
    applying = false;
  }

  lastReported = JSON.stringify(snapshot(media));
}

function bind(element: MediaLike | undefined): void {
  if (element === media) return;

  unbind?.();
  media = element;
  unbind = undefined;
  lastReported = '';

  if (!element) return;

  for (const event of EVENTS) element.addEventListener(event, report);

  element.textTracks.addEventListener('change', report);
  unbind = () => {
    for (const event of EVENTS) element.removeEventListener(event, report);

    element.textTracks.removeEventListener('change', report);
  };

  // The sibling should not wait for the next media event to learn where this player already is.
  report();
}

function parseTextTrack(value: unknown): MirroredTextTrack | undefined {
  if (typeof value !== 'object' || value === null) return undefined;

  const { kind, label, language, mode } = value as Record<string, unknown>;
  if (!isString(kind) || !isString(label) || !isString(language) || !isString(mode)) return undefined;

  // SAFETY: the mode was matched against the three text track modes.
  return TEXT_TRACK_MODES.includes(mode as TextTrackMode)
    ? { kind, label, language, mode: mode as TextTrackMode }
    : undefined;
}

function parseState(data: Record<string, unknown>): MirroredState | undefined {
  const state = data.state;
  if (typeof state !== 'object' || state === null) return undefined;

  const { paused, currentTime, volume, muted, playbackRate, textTracks } = state as Record<string, unknown>;
  if (!isBoolean(paused) || !isNumber(currentTime) || !isNumber(volume) || !isBoolean(muted)) return undefined;

  if (!isNumber(playbackRate) || !Array.isArray(textTracks)) return undefined;

  const tracks = textTracks.map(parseTextTrack);
  if (tracks.some((track) => track === undefined)) return undefined;

  // SAFETY: every track parsed, as checked above.
  return { paused, currentTime, volume, muted, playbackRate, textTracks: tracks as MirroredTextTrack[] };
}

/**
 * Mirror playback between compare panels. Pages re-render their player as the shell streams changes, so the media
 * component is re-found whenever the document changes; the shell relays each report to the sibling frames.
 */
export function installSandboxMirror(): void {
  if (window.parent === window) return;

  const observer = new MutationObserver(() => bind(findMediaElement()));

  observer.observe(document.documentElement, { childList: true, subtree: true });
  bind(findMediaElement());

  subscribe('mirror', parseFlag, (value) => {
    enabled = value;
    lastReported = '';
    report();
  });
  subscribeMessage('mirror-apply', parseState, apply);
}
