import { SoundCloudAudio } from '../../media/soundcloud-audio';
import { safeDefine } from '../../registration/safe-define';

export type {
  SoundCloudAdapter,
  SoundCloudAdapterProps,
  SoundCloudEngineConfig,
  SoundCloudSource,
  SoundCloudSourceEngineConfig,
  SoundCloudWidgetParamValue,
} from '@videojs/soundcloud-audio';

export class SoundCloudAudioElement extends SoundCloudAudio {
  static readonly tagName = 'soundcloud-audio';
}

safeDefine(SoundCloudAudioElement);

declare global {
  interface HTMLElementTagNameMap {
    [SoundCloudAudioElement.tagName]: SoundCloudAudioElement;
  }
}
