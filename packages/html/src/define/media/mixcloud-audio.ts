import { MixcloudAudio } from '../../media/mixcloud-audio';
import { safeDefine } from '../../registration/safe-define';

export type {
  MixcloudAdapter,
  MixcloudAdapterProps,
  MixcloudEngineConfig,
  MixcloudSource,
  MixcloudSourceEngineConfig,
  MixcloudWidgetParamValue,
} from '@videojs/mixcloud-audio';

export class MixcloudAudioElement extends MixcloudAudio {
  static readonly tagName = 'mixcloud-audio';
}

safeDefine(MixcloudAudioElement);

declare global {
  interface HTMLElementTagNameMap {
    [MixcloudAudioElement.tagName]: MixcloudAudioElement;
  }
}
