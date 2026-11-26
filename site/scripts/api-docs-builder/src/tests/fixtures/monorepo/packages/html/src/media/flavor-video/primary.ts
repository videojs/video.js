import { CustomMediaElement } from '../../../../media/src/dom/custom-media-element';
import { FlavorHost } from '../../../../media/src/dom/flavor';
import { FlavorVideoMixin } from './mixin';

function MediaAttachMixin(base: any) {
  return base;
}

const FlavorVideoBase = FlavorVideoMixin(MediaAttachMixin(CustomMediaElement('video', FlavorHost)));

export class FlavorVideo extends FlavorVideoBase {}
