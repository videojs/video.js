import { CustomMediaElement } from '@videojs/media/dom';
import { HlsAudioAdapter } from '@videojs/spf/adapters/hls-audio';

import { MediaAttachMixin } from '../../store/media-attach-mixin';

export class HlsAudio extends MediaAttachMixin(CustomMediaElement('audio', HlsAudioAdapter)) {}
