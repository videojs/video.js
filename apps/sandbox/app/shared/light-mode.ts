// Light mode shows a poster and a play button, and loads the media only once it's pressed. The click's user activation
// has to outlast the media's load for autoplay to be allowed, which is what the status line reports.

/** How long after the click a media that hasn't started counts as blocked. */
export const LIGHT_START_TIMEOUT = 8000;

/** Material "play_arrow", for the light-mode play button. */
export const PLAY_ICON_PATH = 'M8 5v14l11-7z';

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
