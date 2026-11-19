import { CustomMediaElement } from '../../../../media/src/dom/custom-media-element';
import { EmbedHost } from '../../../../media/src/dom/embed';

function MediaAttachMixin(base: any) {
  return base;
}

class ContainerCustomMediaElement extends CustomMediaElement('iframe', EmbedHost) {}

export class ContainerVideo extends MediaAttachMixin(ContainerCustomMediaElement) {}
