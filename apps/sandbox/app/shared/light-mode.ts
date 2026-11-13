// Light mode shows a poster and a play button, and loads the media only once it's pressed. The click's user activation
// has to outlast the media's load for autoplay to be allowed, which is what the status line reports.

/** How long after the click a media that hasn't started counts as blocked. */
export const LIGHT_START_TIMEOUT = 8000;

/** The default skin's play icon (`@videojs/icons` `default/play.svg`), drawn in an 18×18 view box. */
export const PLAY_ICON_PATH =
  'm14.051 10.723-7.985 4.964a1.98 1.98 0 0 1-2.758-.638A2.06 2.06 0 0 1 3 13.964V4.036C3 2.91 3.895 2 5 2c.377 0 .747.109 1.066.313l7.985 4.964a2.057 2.057 0 0 1 .627 2.808c-.16.257-.373.475-.627.637';

export function describeLightStart(clickedAt?: number, startedAt?: number, timedOut = false): string {
  if (clickedAt === undefined) return 'Nothing loaded until play is pressed.';

  if (startedAt !== undefined) {
    const seconds = ((startedAt - clickedAt) / 1000).toFixed(1);

    return startedAt - clickedAt > LIGHT_START_TIMEOUT
      ? `Didn't autoplay; started ${seconds} s after the click, once play was pressed again.`
      : `Autoplayed ${seconds} s after the click.`;
  }

  return timedOut
    ? `Not playing ${LIGHT_START_TIMEOUT / 1000} s after the click: autoplay was likely blocked. Press play in the player.`
    : 'Loading the media…';
}
