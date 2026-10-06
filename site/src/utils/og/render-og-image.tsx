import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

import { isCodeIdentifier } from '@/utils/docs/title';

// ---------------------------------------------------------------------------
// Configuration — tune these values to adjust OG image appearance
// ---------------------------------------------------------------------------

/** Font size (px) for short titles. */
export const LARGE_FONT_SIZE = 48;
/** Font size (px) for long titles. */
export const SMALL_FONT_SIZE = 36;
/** Titles longer than this (in characters, after uppercasing) use the small font. */
export const LARGE_SMALL_THRESHOLD = 25;
/** Titles longer than this (in characters, after uppercasing) are truncated with an ellipsis. */
export const MAX_CHAR_LIMIT = 80;
/** Conservative characters per line at the small font size; Eurostile caps average ~29–35px at 36px. */
export const MAX_LINE_CHARS = 28;
/** A clause break is used only when its shorter line is at least this fraction of the longer one. */
export const MIN_CLAUSE_BALANCE = 0.5;

/** Clause boundaries that read better as line breaks; the punctuation stays at the end of the first line. */
const CLAUSE_BREAK = /(?<= [—–])\s+|(?<=[:?!])\s+/g;

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const BG_COLOR = '#1e1d1d'; // faded-black
const TEXT_COLOR = '#f3e7d2'; // manila-light

const LOGO_WIDTH = 800;
const LOGO_HEIGHT = Math.round(LOGO_WIDTH * (68 / 381)); // ≈143px
const LARGE_TITLE_GAP = 52; // px between logo and title for short titles
const SMALL_TITLE_GAP = 52; // px between logo and title for long titles
const H_PADDING = 100; // horizontal padding
const COLOR_BAR_HEIGHT = 118;

const COLOR_BARS = [
  { color: '#ffa81b', flex: 80 }, // gold
  { color: '#ff6200', flex: 60 }, // orange
  { color: '#eb3132', flex: 45 }, // red
  { color: '#cc3566', flex: 20 }, // magenta
  { color: '#922e4f', flex: 10 }, // magenta-dark
] as const;

const SIZES = {
  og: { width: 1200, height: 630, topMargin: 30 },
  twitter: { width: 1200, height: 600, topMargin: 15 },
} as const;

// ---------------------------------------------------------------------------
// Font loading (fetched once, cached in module scope)
// Note: satori does not support woff2, so we use the woff variant.
// ---------------------------------------------------------------------------

const FONT_URL = 'https://static.mux.com/fonts/EurostileLTProBoldExtended2/font.woff';
const FONT_FAMILY = 'Eurostile LT Pro Bold Extended 2';

let fontDataPromise: Promise<ArrayBuffer> | null = null;

async function fetchFont(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load font: ${response.status}`);

  return response.arrayBuffer();
}

function loadFont(): Promise<ArrayBuffer> {
  if (!fontDataPromise) {
    fontDataPromise = fetchFont(FONT_URL).catch((err) => {
      fontDataPromise = null; // allow retry on next call
      throw new Error(
        `Failed to load OG image font from ${FONT_URL}: ${err.message}. ` +
          'Ensure the build environment can reach static.mux.com.'
      );
    });
  }

  return fontDataPromise;
}

// ---------------------------------------------------------------------------
// Inlined Video.js mono logo (SVGO-optimised, from src/assets/logos/videojs-mono.svg)
// ---------------------------------------------------------------------------

const LOGO_PATH =
  'M88.705 0v14.958H71.204V0zm0 18.912v47.32H71.204v-47.32zM48.643 0v52.106L20.918 0H0l35.263 66.257h30.881V0zm101.694 0v66.257h-32.681c-13.328 0-23.917-13.475-23.917-25.754 0-13.969 9.755-25.519 23.578-25.519h11.502v14.958h-5.659c-6.078 0-11.085 4.812-11.085 10.718s4.929 10.64 11.006 10.64h9.755V0zm62.023 66.257h-29.577c-14.997 0-28.091-9.729-28.091-25.857 0-13.137 12.415-25.442 28.169-25.442h29.499v14.958l-11.659 17.039h-19.822l12.337-17.04h-8.999c-6.677 0-11.163 4.32-11.163 10.302 0 6.4 5.008 11.056 11.163 11.056h28.169v14.958zM245.069 68c-15.832 0-30.072-10.9-30.072-27.341 0-16.44 14.658-27.419 30.177-27.419s29.994 11.056 29.994 27.419-14.345 27.34-30.073 27.34zm-11.763-27.367c0 7.31 5.086 12.382 11.842 12.382 6.755 0 11.658-5.072 11.658-12.382s-4.825-12.46-11.58-12.46-11.92 5.306-11.92 12.46m124.57-15.503h-10.668c-2.921 0-5.268-1.405-5.268-4.293s2.269-4.032 5.112-4.084h29.134V0H346.4c-11.216 0-22.822 7.96-22.822 20.707s11.606 20.239 22.822 20.239h10.667c2.974 0 5.373 1.352 5.373 4.318s-2.425 4.266-5.373 4.266h-33.124v16.727h33.959c11.267 0 22.926-7.18 22.926-20.993 0-12.85-11.659-20.16-22.926-20.16zm-18.023 0h-12.337c-.365-1.38-.6-2.836-.6-4.423 0-1.405.183-2.706.496-3.954h12.337c-.783 1.145-1.226 2.523-1.226 4.084 0 1.639.495 3.096 1.33 4.292m6.521-21.748h26.395v9.963h-44.027c3.312-6.295 10.668-9.99 17.632-9.99zm-17.475 25.13h28.977c6.912 0 14.11 3.147 17.527 9.052h-29.029c-7.043 0-14.137-3.096-17.475-9.079zm48.512 16.778c0 1.509-.182 2.94-.495 4.266h-12.415c.834-1.17 1.304-2.627 1.304-4.266s-.47-3.122-1.304-4.318h12.311c.365 1.352.599 2.783.599 4.318M357.876 62.9h-30.568v-9.963h48.408c-3.234 6.555-10.563 9.963-17.84 9.963m-57.329-26.325c0 3.486-1.852 12.93-12.154 12.955h-11.294v16.753l13.485.13h3.338c15.415-.026 24.596-9.937 24.596-27.522V0h-17.971zm2.921 4.37h11.607c-.157 3.2-.626 6.062-1.435 8.611h-15.545c2.478-1.899 4.513-4.708 5.399-8.61zm.47-12.434h11.189v9.053h-11.241c0-.338.052-.65.052-1.015v-8.064zm0-3.382v-8.376h11.189v8.376zm-10.042 37.876h-3.26l-10.12-.078V52.912h31.716c-3.365 6.556-9.598 10.067-18.336 10.067zm21.231-59.623v9.99h-11.189v-9.99z';

function VideoJSLogo() {
  return (
    <svg
      viewBox="0 0 381 68"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Video.js"
    >
      <path d={LOGO_PATH} fill={TEXT_COLOR} />
    </svg>
  );
}

function ColorBars() {
  return (
    <div
      style={{
        height: COLOR_BAR_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      {COLOR_BARS.map(({ color, flex }) => (
        <div key={color} style={{ flex, backgroundColor: color }} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Line breaking
// ---------------------------------------------------------------------------

/**
 * Split a two-line title at a clause boundary (em dash, colon, …) when both halves fit on a line and are close in
 * length, so `VIDEO.JS V10 IS GA — LET / THE MIGRATIONS BEGIN!` becomes `VIDEO.JS V10 IS GA — / LET THE MIGRATIONS
 * BEGIN!`. Returns the title as a single line when no break qualifies, leaving wrapping to `text-wrap`.
 */
export function splitTitleLines(title: string): string[] {
  if (title.length <= MAX_LINE_CHARS) return [title];

  let best: [string, string] | null = null;
  let bestDelta = Infinity;

  for (const match of title.matchAll(CLAUSE_BREAK)) {
    const first = title.slice(0, match.index);
    const second = title.slice(match.index + match[0].length);
    const longer = Math.max(first.length, second.length);
    const shorter = Math.min(first.length, second.length);
    if (longer > MAX_LINE_CHARS || shorter < longer * MIN_CLAUSE_BALANCE) continue;

    if (longer - shorter < bestDelta) {
      best = [first, second];
      bestDelta = longer - shorter;
    }
  }

  return best ?? [title];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type OgSize = 'og' | 'twitter';

export async function renderOgImage(options: { title?: string; size: OgSize }): Promise<Buffer> {
  const { title, size } = options;
  const { width, height, topMargin } = SIZES[size];
  const fontData = await loadFont();

  // Uppercase (unless the title is a code identifier like PlaybackRateButton),
  // then truncate if needed
  let displayTitle = title && isCodeIdentifier(title) ? title : title?.toUpperCase();

  if (displayTitle && displayTitle.length > MAX_CHAR_LIMIT) {
    const truncated = displayTitle.slice(0, MAX_CHAR_LIMIT);
    const lastSpace = truncated.lastIndexOf(' ');

    displayTitle = `${lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated}…`;
    console.warn(
      `⚠ OG image for "${title}": title truncated (${title!.length} chars > ${MAX_CHAR_LIMIT} max). Consider adding ogTitle to frontmatter.`
    );
  }

  const fontSize = displayTitle && displayTitle.length > LARGE_SMALL_THRESHOLD ? SMALL_FONT_SIZE : LARGE_FONT_SIZE;
  const titleGap = fontSize === LARGE_FONT_SIZE ? LARGE_TITLE_GAP : SMALL_TITLE_GAP;
  const textWrap = fontSize === LARGE_FONT_SIZE ? 'pretty' : 'balance'; // balance messes up text when single-line
  const titleLines = displayTitle && fontSize === SMALL_FONT_SIZE ? splitTitleLines(displayTitle) : [displayTitle];
  // Explicit clause lines already fit, and balancing a single line misplaces it.
  const lineWrap = titleLines.length > 1 ? 'pretty' : textWrap;

  const svg = await satori(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: BG_COLOR,
      }}
    >
      {/* Content area: logo + title, optically centred above colour bars */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: topMargin,
          paddingLeft: H_PADDING,
          paddingRight: H_PADDING,
        }}
      >
        <VideoJSLogo />
        {displayTitle && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: titleGap,
              fontFamily: FONT_FAMILY,
              fontSize,
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              color: TEXT_COLOR,
              textAlign: 'center',
            }}
          >
            {titleLines.map((line) => (
              <div key={line} style={{ textWrap: lineWrap }}>
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
      <ColorBars />
    </div>,
    {
      width,
      height,
      fonts: [
        {
          name: FONT_FAMILY,
          data: fontData,
          weight: 700,
          style: 'normal' as const,
        },
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
  });
  const pngData = resvg.render();

  return Buffer.from(pngData.asPng());
}
