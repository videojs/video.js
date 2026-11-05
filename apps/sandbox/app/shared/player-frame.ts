import type { MediaPlayer } from '@app/media';

/**
 * The shell's width control, in CSS pixels. The stops are the rem widths the skins' layouts change around, then the
 * end.
 */
export const PLAYER_WIDTH = {
  min: 100,
  max: 1360,
  stops: [384, 512, 672, 960, 1360],
} as const;

export const ASPECT_RATIOS = ['intrinsic', '16:9', '4:3', '1:1', '9:16', '21:9'] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

/** The width a preview opens at before the control is touched: the video skins' `4xl` cap or the audio skins' `xl`. */
export function defaultPlayerWidth(player: MediaPlayer): number {
  return player === 'audio' ? 576 : 896;
}

/** Shared preview framing; `styles.css` applies the video's width and aspect-ratio preferences. */
export const PLAYER_FRAME_CLASSES = {
  video: 'sandbox-video-frame mx-auto max-w-[var(--sandbox-player-width,56rem)]',
  audio: 'mx-auto w-full max-w-[var(--sandbox-player-width,36rem)]',
} as const;
