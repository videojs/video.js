import { defaultWidth, locales, skin } from './config';

/** Audio skins have no picture, so the aspect ratio only applies to video. */
export const hasAspectRatio = !skin.preset.endsWith('audio');

export const COLOR_SCHEMES = ['auto', 'light', 'dark'] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];

/** `auto` follows the language, as a page with that `lang` would. */
export const TEXT_DIRECTIONS = ['auto', 'ltr', 'rtl'] as const;
export type TextDirection = (typeof TEXT_DIRECTIONS)[number];

export const ASPECT_RATIOS = ['intrinsic', '16:9', '4:3', '1:1', '9:16', '21:9'] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export const PRELOAD_VALUES = ['auto', 'metadata', 'none'] as const;
export type PreloadValue = (typeof PRELOAD_VALUES)[number];

export type Locale = (typeof locales)[number];

export const PLAYER_WIDTH = { min: 240, max: 1360, stops: [384, 512, 672, 960, 1360] } as const;

/** What the shell controls and the preview frame applies. Both read and write it as URL parameters. */
export interface WorkbenchParams {
  width: number;
  ratio: AspectRatio;
  scheme: ColorScheme;
  dir: TextDirection;
  locale: Locale;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  preload: PreloadValue;
}

function oneOf<const Values extends readonly string[]>(values: Values, value: string | null, fallback: Values[number]) {
  return values.includes(value ?? '') ? (value as Values[number]) : fallback;
}

export function readParams(query: string): WorkbenchParams {
  const params = new URLSearchParams(query);
  const width = Number(params.get('width'));
  const flag = (name: string) => params.get(name) === '1';

  return {
    width: Number.isFinite(width) && width >= PLAYER_WIDTH.min ? Math.min(width, PLAYER_WIDTH.max) : defaultWidth,
    ratio: oneOf(ASPECT_RATIOS, params.get('ratio'), '16:9'),
    scheme: oneOf(COLOR_SCHEMES, params.get('scheme'), 'auto'),
    dir: oneOf(TEXT_DIRECTIONS, params.get('dir'), 'auto'),
    locale: oneOf(locales, params.get('locale'), 'en'),
    autoplay: flag('autoplay'),
    muted: flag('muted'),
    loop: flag('loop'),
    preload: oneOf(PRELOAD_VALUES, params.get('preload'), 'metadata'),
  };
}

export function writeParams(value: WorkbenchParams): string {
  const flag = (on: boolean) => (on ? '1' : '0');

  return new URLSearchParams({
    width: String(value.width),
    ratio: value.ratio,
    scheme: value.scheme,
    dir: value.dir,
    locale: value.locale,
    autoplay: flag(value.autoplay),
    muted: flag(value.muted),
    loop: flag(value.loop),
    preload: value.preload,
  }).toString();
}

/** The inline styles the preview puts on the player's wrapper. */
export function playerStyles(value: WorkbenchParams): Record<string, string> {
  const styles: Record<string, string> = { '--preview-player-width': `${value.width}px` };

  // `auto` undoes the skin's own ratio, so the media's intrinsic size decides.
  if (hasAspectRatio)
    styles['--preview-player-ratio'] = value.ratio === 'intrinsic' ? 'auto' : value.ratio.replace(':', ' / ');

  return styles;
}

/** The playback options as media props, for React previews. */
export function playbackProps(value: WorkbenchParams) {
  return { autoPlay: value.autoplay, muted: value.muted, loop: value.loop, preload: value.preload };
}

export type PlaybackProps = ReturnType<typeof playbackProps>;

/** Languages written right to left, for `dir: 'auto'`. */
const RTL_LANGUAGES = new Set(['ar', 'fa', 'he', 'ps', 'sd', 'ug', 'ur', 'yi', 'ckb', 'dv']);

export function localeDirection(locale: string): 'ltr' | 'rtl' {
  return RTL_LANGUAGES.has(locale.split('-')[0]!) ? 'rtl' : 'ltr';
}

const LANGUAGE_NAMES = new Intl.DisplayNames('en', { type: 'language' });

export function localeLabel(locale: string): string {
  return LANGUAGE_NAMES.of(locale) ?? locale;
}

/**
 * Apply the document-level options in the preview frame. The player reads its language from the page's `lang` and loads
 * the matching built-in translations itself.
 */
export function applyDocumentParams(value: WorkbenchParams): void {
  const root = document.documentElement;

  root.style.colorScheme = value.scheme === 'auto' ? '' : value.scheme;
  root.lang = value.locale;
  root.dir = value.dir === 'auto' ? localeDirection(value.locale) : value.dir;
}
