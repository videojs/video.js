import { createShadowStyle } from '@videojs/utils/dom';

import { template } from '../../internal/skins/scaffold-live-video/template';
import { SkinElement } from '../skin';

import styles from '../../define/live-video/scaffold-skin.css?inline';

/** Packaged scaffold live-video UI registered as `<live-video-scaffold-skin>`. */
export class ScaffoldLiveVideoSkinElement extends SkinElement {
  static readonly tagName = 'live-video-scaffold-skin';
  static styles = createShadowStyle(styles);
  static template = template;
}

declare global {
  interface HTMLElementTagNameMap {
    [ScaffoldLiveVideoSkinElement.tagName]: ScaffoldLiveVideoSkinElement;
  }
}
