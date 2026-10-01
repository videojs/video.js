import { SpotifyAudio } from '../../media/spotify-audio';
import { safeDefine } from '../../registration/safe-define';

export type {
  SpotifyAdapter,
  SpotifyAdapterProps,
  SpotifyControllerApi,
  SpotifyEngineConfig,
  SpotifyPlaybackState,
  SpotifyPlaybackUpdateEvent,
  SpotifySource,
  SpotifySourceEngineConfig,
} from '@videojs/spotify-audio';

export class SpotifyAudioElement extends SpotifyAudio {
  static readonly tagName = 'spotify-audio';
}

safeDefine(SpotifyAudioElement);

declare global {
  interface HTMLElementTagNameMap {
    [SpotifyAudioElement.tagName]: SpotifyAudioElement;
  }
}
