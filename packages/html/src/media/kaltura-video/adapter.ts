import { KalturaVideoAdapter } from '@videojs/kaltura-video';
import { CustomMediaElement } from '@videojs/media/dom';

import { MediaAttachMixin } from '../../store/media-attach-mixin';

export class KalturaVideo extends MediaAttachMixin(CustomMediaElement('video', KalturaVideoAdapter)) {}
