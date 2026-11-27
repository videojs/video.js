import { VidyardVideo } from '../../media/vidyard-video';
import { safeDefine } from '../../registration/safe-define';

export type {
  VidyardAdapter,
  VidyardAdapterProps,
  VidyardCaption,
  VidyardEngineConfig,
  VidyardPlayerApi,
  VidyardPlayerMetadata,
  VidyardPlayerParamValue,
  VidyardPlayerStatus,
  VidyardSource,
  VidyardSourceEngineConfig,
  VidyardVideoAttributes,
} from '@videojs/vidyard-video';

export class VidyardVideoElement extends VidyardVideo {
  static readonly tagName = 'vidyard-video';
}

safeDefine(VidyardVideoElement);

declare global {
  interface HTMLElementTagNameMap {
    [VidyardVideoElement.tagName]: VidyardVideoElement;
  }
}
