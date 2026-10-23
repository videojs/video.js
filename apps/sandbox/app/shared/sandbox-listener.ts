import {
  COLOR_SCHEMES,
  type ColorScheme,
  DEFAULT_PRELOAD,
  PREFER_PLAYBACK_VALUES,
  type PreferPlaybackValue,
  PRELOAD_VALUES,
  type PreloadValue,
  RESOLUTION_PATTERN,
  SKIN_SOURCES,
  SKINS,
  STYLINGS,
  TEXT_DIRECTIONS,
  type TextDirection,
} from '@app/constants';
import { isMediaId, landingSource } from '@app/media';
import { DEFAULT_SANDBOX_LOCALE, SANDBOX_LOCALE_TAGS, type SandboxLocaleTag } from '@app/shared/i18n/locale-meta';
import type { Platform, Skin, SkinSource, Styling } from '@app/types';
import type { MediaResolution } from '@videojs/media';
import { isBoolean, isNumber, isString } from '@videojs/utils/predicate';

import { CAPTIONS_MODES, type CaptionsMode } from './captions';
import { setDocumentDirection } from './i18n/document-locale';
import { ASPECT_RATIOS, type AspectRatio } from './player-frame';
import { defaultSkinSource } from './skin-sources';
import { DEFAULT_SOURCE, SOURCES, type SourceId } from './sources';

const params = new URLSearchParams(window.location.search);

/**
 * The selections a preview page renders from. The shell writes them into the page URL and, once the page has loaded,
 * streams each change as a `<key>-change` message. Styling is the exception: changing it remounts the page.
 */
export interface SandboxState {
  skin: Skin;
  source: SourceId;
  styling: Styling;
  /** Where the skin comes from. Changing it remounts the page, like styling. */
  skins: SkinSource;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  preload: PreloadValue;
  /** Subtitle tracks the page adds to a video. */
  captions: CaptionsMode;
}

type StreamedKey = Exclude<keyof SandboxState, 'styling' | 'skins'>;

function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  // SAFETY: the tuple is widened to strings only for the lookup; the guard narrows the value back to `T`.
  return isString(value) && (values as readonly string[]).includes(value);
}

function parseSkin(value: unknown): Skin | undefined {
  return isOneOf(SKINS, value) ? value : undefined;
}

function parseStyling(value: unknown): Styling | undefined {
  return isOneOf(STYLINGS, value) ? value : undefined;
}

function parseSkinSource(value: unknown): SkinSource | undefined {
  return isOneOf(SKIN_SOURCES, value) ? value : undefined;
}

function parseSource(value: unknown): SourceId | undefined {
  // SAFETY: `in` checked the string against the source map's keys.
  return isString(value) && value in SOURCES ? (value as SourceId) : undefined;
}

export function parseFlag(value: unknown): boolean | undefined {
  return isBoolean(value) ? value : undefined;
}

function parsePreload(value: unknown): PreloadValue | undefined {
  return isOneOf(PRELOAD_VALUES, value) ? value : undefined;
}

function parseCaptions(value: unknown): CaptionsMode | undefined {
  return isOneOf(CAPTIONS_MODES, value) ? value : undefined;
}

function parseLocale(value: unknown): SandboxLocaleTag | undefined {
  return isOneOf(SANDBOX_LOCALE_TAGS, value) ? value : undefined;
}

/** A query flag is `1` or absent, where the streamed value is a boolean. */
export function readFlag(name: string): boolean {
  return params.get(name) === '1';
}

/**
 * The source a page opened without one lands on, as the shell picks it when switching to the page's media: an embed
 * plays its own provider's pages, not a media file. Pages live at `/<platform>-<media>/`.
 */
function pageSource(platform: Platform): SourceId {
  const media = window.location.pathname.split('/')[1]?.replace(`${platform}-`, '');

  return isMediaId(media) ? landingSource(media, platform, DEFAULT_SOURCE) : DEFAULT_SOURCE;
}

/**
 * The selections the page URL names, with the shell's defaults for the rest. The platform decides where skins come from
 * when the URL does not say, since only React has a Tailwind registry install.
 */
export function readSandboxState(platform: Platform): SandboxState {
  const styling = parseStyling(params.get('styling')) ?? 'css';

  return {
    skin: parseSkin(params.get('skin')) ?? 'default',
    source: parseSource(params.get('source')) ?? pageSource(platform),
    styling,
    skins: parseSkinSource(params.get('skins')) ?? defaultSkinSource(platform, styling),
    autoplay: readFlag('autoplay'),
    muted: readFlag('muted'),
    loop: readFlag('loop'),
    preload: parsePreload(params.get('preload')) ?? DEFAULT_PRELOAD,
    captions: parseCaptions(params.get('captions')) ?? 'none',
  };
}

/**
 * Listen for one message type from the shell. The payload has to pass `parse`; a message that fails it is dropped, so a
 * malformed post cannot put the page into a state the shell would never send.
 */
export function subscribeMessage<T>(
  type: string,
  parse: (data: Record<string, unknown>) => T | undefined,
  callback: (value: T) => void
): () => void {
  const handler = (event: MessageEvent) => {
    if (event.data?.type !== type) return;

    const value = parse(event.data);
    if (value === undefined) return;

    callback(value);
  };

  window.addEventListener('message', handler);

  return () => {
    window.removeEventListener('message', handler);
  };
}

/** Listen for the shell's `<name>-change` messages, whose payload field is named `name`. */
export function subscribe<T>(
  name: string,
  parse: (value: unknown) => T | undefined,
  callback: (value: T) => void
): () => void {
  return subscribeMessage(`${name}-change`, (data) => parse(data[name]), callback);
}

const streamedKeys: readonly StreamedKey[] = ['skin', 'source', 'autoplay', 'muted', 'loop', 'preload', 'captions'];

const streamed: { [K in StreamedKey]: (value: unknown) => SandboxState[K] | undefined } = {
  skin: parseSkin,
  source: parseSource,
  autoplay: parseFlag,
  muted: parseFlag,
  loop: parseFlag,
  preload: parsePreload,
  captions: parseCaptions,
};

function streamKey<K extends StreamedKey>(key: K, callback: (change: Partial<SandboxState>) => void): () => void {
  return subscribe(key, streamed[key], (value) => {
    const change: Partial<SandboxState> = {};

    change[key] = value;
    callback(change);
  });
}

/** Calls back with each selection the shell streams in after load, as a partial state to merge into the last one. */
export function onSandboxStateChange(callback: (change: Partial<SandboxState>) => void): () => void {
  const unsubscribes = streamedKeys.map((key) => streamKey(key, callback));

  return () => {
    for (const unsubscribe of unsubscribes) unsubscribe();
  };
}

let currentLocale = parseLocale(params.get('locale')) ?? DEFAULT_SANDBOX_LOCALE;

export function getInitialLocale(): SandboxLocaleTag {
  return currentLocale;
}

export function onLocaleChange(callback: (locale: SandboxLocaleTag) => void): () => void {
  return subscribe('locale', parseLocale, (locale) => {
    currentLocale = locale;
    callback(locale);
  });
}

function parseAccent(value: unknown): string | undefined {
  return isString(value) ? value.trim() : undefined;
}

/** A width arrives as a query string or as a number from the shell; either way it is CSS pixels. */
function parseWidth(value: unknown): number | undefined {
  const width = isString(value) ? Number.parseInt(value, 10) : isNumber(value) ? value : Number.NaN;

  return Number.isFinite(width) && width > 0 ? width : undefined;
}

function parseAspectRatio(value: unknown): AspectRatio | undefined {
  return isOneOf(ASPECT_RATIOS, value) ? value : undefined;
}

function parseScheme(value: unknown): ColorScheme | undefined {
  return isOneOf(COLOR_SCHEMES, value) ? value : undefined;
}

function parseDirection(value: unknown): TextDirection | undefined {
  return isOneOf(TEXT_DIRECTIONS, value) ? value : undefined;
}

/**
 * A preference the page applies to its document rather than renders from: read once from the query string, then kept
 * current from the shell's `<name>-change` messages. Absent means the page's own default.
 */
function preference<T>(
  name: string,
  parse: (value: unknown) => T | undefined,
  apply: (value: T | undefined) => void
): void {
  apply(parse(params.get(name)));
  subscribe(name, parse, apply);
}

const { style } = document.documentElement;

preference('accent', parseAccent, (accent) => {
  if (accent) style.setProperty('--media-accent-color', accent);
  else style.removeProperty('--media-accent-color');
});

// The templates cap the player at `--sandbox-player-width`, falling back to the skin's own width when unset.
preference('width', parseWidth, (width) => {
  if (width) style.setProperty('--sandbox-player-width', `${width}px`);
  else style.removeProperty('--sandbox-player-width');
});

preference('ratio', parseAspectRatio, (ratio) => {
  document.documentElement.dataset.aspectRatio = ratio ?? '16:9';

  if (ratio && ratio !== 'intrinsic') style.setProperty('--sandbox-player-ratio', ratio.replace(':', ' / '));
  else style.removeProperty('--sandbox-player-ratio');
});

// `color-scheme` and the `dark:` variant both key off this attribute; see `styles.css`.
preference('scheme', parseScheme, (scheme) => {
  if (scheme && scheme !== 'auto') document.documentElement.dataset.colorScheme = scheme;
  else delete document.documentElement.dataset.colorScheme;
});

// The page flips with the document, and the player takes the same value as its own `dir` because it would otherwise
// derive one from its locale; see `html/i18n.ts` and `react/skins.tsx`.
let currentDirection: TextDirection = 'auto';

/**
 * Relay what goes wrong in a frame to the shell, which lists it in the copied report. Uncaught errors, unhandled
 * rejections, and `console.error` all count; the console still receives each of them.
 */
function relayErrors(): void {
  if (window.parent === window) return;

  const relay = (message: string) => window.parent.postMessage({ type: 'sandbox-error', message }, '*');
  const describe = (value: unknown) => (value instanceof Error ? `${value.name}: ${value.message}` : String(value));
  const consoleError = console.error.bind(console);

  window.addEventListener('error', (event) => relay(event.message || describe(event.error)));
  window.addEventListener('unhandledrejection', (event) => relay(`Unhandled rejection: ${describe(event.reason)}`));
  console.error = (...args: unknown[]) => {
    relay(args.map(describe).join(' '));
    consoleError(...args);
  };
}

relayErrors();

preference('dir', parseDirection, (direction) => {
  currentDirection = direction ?? 'auto';
  setDocumentDirection(currentDirection);
});

export function getDirection(): TextDirection {
  return currentDirection;
}

export function onDirectionChange(callback: (direction: TextDirection) => void): () => void {
  return subscribe('dir', parseDirection, callback);
}

function readResolution(name: string): MediaResolution | undefined {
  const value = params.get(name);
  if (!value || !RESOLUTION_PATTERN.test(value) || Number.parseInt(value, 10) <= 0) return undefined;

  // SAFETY: the pattern guarantees the `{height}p` shape the resolution type names.
  return value as MediaResolution;
}

/** Absent unless named, so the source default is what runs otherwise. */
function readOptionalBoolean(name: string): boolean | undefined {
  const value = params.get(name);
  if (value === null) return undefined;

  return value !== '0' && value !== 'false';
}

function readPreferPlayback(): PreferPlaybackValue | undefined {
  const value = params.get('preferPlayback');

  return isOneOf(PREFER_PLAYBACK_VALUES, value) ? value : undefined;
}

const initialMaxAutoResolution = readResolution('maxAutoResolution');
const initialMinAutoResolution = readResolution('minAutoResolution');
const initialCapRenditionToPlayerSize = readOptionalBoolean('capRenditionToPlayerSize');
const initialPreferPlayback = readPreferPlayback();

/** Engine options folded into the initial source, so the engine is built with them instead of reconfigured. */
export interface PlaybackOverrides {
  maxAutoResolution?: MediaResolution | undefined;
  capRenditionToPlayerSize?: boolean | undefined;
  minAutoResolution?: MediaResolution | undefined;
  preferPlayback?: PreferPlaybackValue | undefined;
}

/**
 * Playback options read once from the query string and folded into the _initial_ `source`, so the engine is built with
 * them instead of having them switched in afterwards. Every key is absent unless named, leaving the default sandbox
 * behavior untouched.
 *
 * - `?maxAutoResolution=720p` caps automatic rendition selection.
 * - `?capRenditionToPlayerSize=0` stops the element's size from capping it.
 * - `?minAutoResolution=270p` lowers the floor on that size cap, whose default is `720p` — low enough here to leave a
 *   small player uncapped.
 * - `?preferPlayback=native` forces the browser's own HLS.
 */
export function getInitialPlaybackOverrides(): PlaybackOverrides {
  return {
    ...(initialMaxAutoResolution && { maxAutoResolution: initialMaxAutoResolution }),
    ...(initialCapRenditionToPlayerSize !== undefined && {
      capRenditionToPlayerSize: initialCapRenditionToPlayerSize,
    }),
    ...(initialMinAutoResolution && { minAutoResolution: initialMinAutoResolution }),
    ...(initialPreferPlayback && { preferPlayback: initialPreferPlayback }),
  };
}
