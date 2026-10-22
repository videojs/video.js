import { CustomMediaElement } from '@videojs/media/dom';
import { HlsVideoAdapter } from '@videojs/spf/adapters/hls-video';

import { MediaAttachMixin } from '../../store/media-attach-mixin';

export class HlsVideo extends MediaAttachMixin(CustomMediaElement('video', HlsVideoAdapter)) {}
