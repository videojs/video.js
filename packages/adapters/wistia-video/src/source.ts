import { VideoCSSVars } from '@videojs/media/dom';

export { parseWistiaMediaId, parseWistiaStartTime } from '@videojs/media';

/**
 * Wistia player options, spelled the way `<wistia-player>` spells its JavaScript properties
 * (https://docs.wistia.com/docs/player-attributes-and-properties). Assigned to the player verbatim and live: it is an
 * element on the page, so changing one reaches it.
 *
 * The members a media element already names are deliberately absent — `endVideoBehavior` is `loop`, the eight
 * control-bar switches are `controls`, and `autoplay`, `muted`, `poster`, `preload`, `volume`, `currentTime`, and
 * `playbackRate` are props of their own. The index signature carries whatever Wistia adds next.
 */
export interface WistiaSource extends Record<string, unknown> {
  /** **Required**. The hashed id of the media to play. */
  mediaId?: string | undefined;
  /** Aspect ratio to reserve space at, before the media data says what the real one is. */
  aspect?: number;
  /** Show the audio-description control, for a media that has an alternate audio track. */
  audioDescriptionControl?: boolean;
  /** Skip viewing-session tracking for heatmaps and other analytics. */
  doNotTrack?: boolean;
  /** Email address to associate this media's viewing sessions with. */
  email?: string;
  /** How the video is sized inside the player when the two aspect ratios disagree. */
  fitStrategy?: 'contain' | 'cover' | 'fill';
  /** Show the playback-speed option inside the settings control. */
  playbackRateControl?: boolean;
  /** Six-character hex color for the controls and accents; the leading `#` is optional. */
  playerColor?: string;
  /** Turn specially crafted links on the page into a playlist for this media. */
  playlistLinks?: string;
  /** Replay a playlist from its first media once the last one ends. */
  playlistLoop?: boolean;
  /** Show the manual quality option inside the settings control. */
  qualityControl?: boolean;
  /** Highest quality automatic playback may pick. */
  qualityMax?: WistiaQuality;
  /** Lowest quality automatic playback may pick. */
  qualityMin?: WistiaQuality;
  /** Pick up where the viewer left off. `'auto'` decides from the media's length and settings. */
  resumable?: boolean | 'auto';
  /** Corner radius of the player, `0` to `24`. */
  roundedPlayer?: number;
  /** Inject the media's metadata into the page's markup. */
  seo?: boolean;
  /** How sound and autoplay work together. `'allow'` falls back to a silent autoplay where a loud one is blocked. */
  silentAutoplay?: boolean | 'allow';
  /** Show the blurred placeholder image while the player loads. */
  swatch?: boolean;
  /** Let the page's background show through the letterbox bars instead of painting them black. */
  transparentLetterbox?: boolean;
  /** Pin playback to one quality instead of adapting. */
  videoQuality?: WistiaQuality | 'auto';
}

/**
 * The quality levels Wistia's automatic playback picks between. Mirrors the package's own `AllowedQualities`, which is
 * the value its player accepts; the docs list `3840` for the top one, but the player names it `2160`.
 */
export type WistiaQuality = 224 | 360 | 540 | 720 | 1080 | 2160;

/**
 * What a Wistia player is started with here, whatever Wistia's default or the Wistia app says; a source overrides it.
 * Only the corner radius so far, squared because the skin is what rounds a media — see `wistiaPlayerStyle`.
 * `roundedPlayer` is the one to set: the three `*BorderRadius` options derive from it.
 *
 * @internal
 */
export const wistiaPlayerDefaultOptions = {
  roundedPlayer: 0,
} as const satisfies WistiaSource;

/**
 * The style a Wistia player is given: the skin's corners, and no pointer events without chrome.
 *
 * `borderRadius` reads the same custom property a `<video>` does, and `overflow` goes with it — a `<video>` is replaced
 * content that the radius alone clips, where Wistia paints into children the box has to clip too. `pointerEvents` is
 * off for a chromeless player because the skin over it is what the viewer is clicking; left interactive it swallows
 * those clicks and answers them with chrome of its own. The iframe embeds do the same through a
 * `:host(:not([controls]))` rule in a template they own, which a player that brings its own element has no equivalent
 * of.
 *
 * @internal
 */
export function wistiaPlayerStyle(controls: boolean) {
  return {
    borderRadius: `var(${VideoCSSVars.borderRadius})`,
    overflow: 'hidden',
    // `auto` rather than an empty string: the initial value of `pointer-events`, and one a stylesheet can say.
    pointerEvents: controls ? 'auto' : 'none',
  } as const;
}

/**
 * The eight control-bar switches `controls` drives as a group, since Wistia has no single chromeless flag.
 * `playBarControl` doubles as the one the group is read back from.
 *
 * @internal
 */
export function wistiaControlProps(controls: boolean) {
  return {
    bigPlayButton: controls,
    controlsVisibleOnLoad: controls,
    fullscreenControl: controls,
    playBarControl: controls,
    playPauseControl: controls,
    playPauseNotifier: controls,
    settingsControl: controls,
    volumeControl: controls,
  };
}
