import { CustomMediaElement } from '../../../../media/src/dom/custom-media-element';
import { FlavorLiteHost } from '../../../../media/src/dom/flavor';
import { FlavorVideoMixin } from './mixin';

function MediaAttachMixin(base: any) {
  return base;
}

const FlavorVideoBase = FlavorVideoMixin(MediaAttachMixin(CustomMediaElement('video', FlavorLiteHost)));

export class FlavorVideo extends FlavorVideoBase {}
