/**
 * How the highway looks: the palette and the proportions `Highway` paints with. Where things go on the canvas lives in
 * the renderer; this file only says what they look like.
 */

/** One lane's colors, from the chrome-cupped gem down to the glow of its sustain. */
export interface LanePaint {
  base: string;
  /** The lit side of the gem, and the hot core of a sustain. */
  light: string;
  /** The shaded side of the gem. */
  dark: string;
  glow: string;
}

/** Green, red, yellow, blue, orange, as on the guitar's neck. */
export const LANES: readonly LanePaint[] = [
  { base: '#22c55e', light: '#d9ffe6', dark: '#0b4d23', glow: 'rgb(34 197 94 / 0.55)' },
  { base: '#ef4444', light: '#ffe0e0', dark: '#6b0d0d', glow: 'rgb(239 68 68 / 0.55)' },
  { base: '#eab308', light: '#fff6cc', dark: '#6b4a00', glow: 'rgb(234 179 8 / 0.55)' },
  { base: '#3b82f6', light: '#e0ecff', dark: '#0d2f6e', glow: 'rgb(59 130 246 / 0.55)' },
  { base: '#f97316', light: '#ffe7d1', dark: '#6e2a00', glow: 'rgb(249 115 22 / 0.55)' },
];

/** Polished steel, light on top and dark at the bottom: the rims of gems and targets, and the rails. */
export const CHROME = [
  [0, '#ffffff'],
  [0.35, '#c7ced6'],
  [0.5, '#5b626b'],
  [0.62, '#2a2e34'],
  [1, '#aab2bc'],
] as const;

/** Smoky black, lit from below as if by a stage on fire. */
export const BACKDROP = {
  top: '#030102',
  middle: '#0b0403',
  bottom: '#1f0a04',
  fire: 'rgb(255 72 0 / 0.28)',
  vignette: 'rgb(0 0 0 / 0.75)',
};

/** Scorched rosewood: dark at the far end, warmer under the strike line, charred along the rails. */
export const BOARD = {
  far: '#0c0605',
  near: '#2a170e',
  under: '#3a2012',
  char: 'rgb(0 0 0 / 0.6)',
  /** The streaks of grain that run down the board. */
  grain: { count: 46, light: [255, 196, 150], dark: [0, 0, 0], alpha: 0.07 },
  /** Lane dividers: thin glowing wires, brightest near the player. */
  divider: { glow: 'rgb(255 140 60 / 0.16)', core: 'rgb(255 214 180 / 0.55)', width: 0.045, coreWidth: 0.008 },
  /** The chrome rails along each side, in lanes. */
  rail: 0.1,
  railGlow: 'rgb(255 110 30 / 0.45)',
};

/**
 * Fret wires scroll by on the beat. "Total Breakdown" holds 105 BPM from its first beat, and the media hands the
 * renderer notes rather than a tempo map, so the beat is part of the look.
 */
export const FRETS = {
  beat: 60 / 105,
  beatsPerBar: 4,
  width: 0.022,
  barWidth: 0.04,
  color: 'rgb(214 220 228 / 0.32)',
  barColor: 'rgb(236 240 245 / 0.6)',
  shadow: 'rgb(0 0 0 / 0.55)',
};

/** The strike line: a bar of hot metal, white at its core. */
export const STRIKE = {
  height: 0.075,
  stops: [
    [0, '#ff7a1a'],
    [0.38, '#fff4d6'],
    [0.55, '#ffd27a'],
    [0.8, '#ff5a00'],
    [1, '#6e1200'],
  ],
  glow: 'rgb(255 96 0 / 0.75)',
} as const;

/** The lane targets on the strike line, in lane widths. */
export const TARGET = { radius: 0.39, well: '#050304', wellLight: '#2a2420' };

/** Gems, in lane widths, before perspective. */
export const GEM = { radius: 0.32, squash: 0.55, shadow: 'rgb(0 0 0 / 0.6)', specular: 'rgb(255 255 255 / 0.7)' };

/** Sustain tails, in lane widths. */
export const TAIL = { glow: 0.17, body: 0.075, core: 0.022 };

/** Smoke that the far end of the highway disappears into. */
export const FOG = {
  color: [6, 3, 3],
  /** How far into the look-ahead the fog reaches, as a share of it. */
  reach: 0.55,
  haze: 'rgb(255 110 50 / 0.1)',
};

/** Embers drifting up out of the dark either side of the highway. */
export const EMBERS = {
  count: 70,
  /** Screen heights per second, slowest to fastest. */
  speed: [0.05, 0.14],
  /** Radius, in canvas heights. */
  size: [0.0018, 0.005],
  core: '#fff1c4',
  hot: 'rgb(255 140 30 / 0.85)',
  cool: 'rgb(255 50 0 / 0)',
};
