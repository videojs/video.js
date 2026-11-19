import type { MediaPlaybackState } from '@videojs/media';

/** Whether playback has begun, counting a pending autoplay as begun. */
export function hasPlaybackStarted(playback: Pick<MediaPlaybackState, 'started' | 'autoplaying'>): boolean {
  return playback.started || playback.autoplaying;
}
