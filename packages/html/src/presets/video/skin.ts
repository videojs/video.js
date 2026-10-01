import { createShadowStyle } from '@videojs/utils/dom';

import { template } from '../../internal/skins/default-video/template';
import { SkinElement } from '../skin';

import styles from '../../define/video/skin.css?inline';

/** Packaged default video UI registered as `<video-skin>`. */
export class VideoSkinElement extends SkinElement {
  static readonly tagName = 'video-skin';
  static styles: CSSStyleSheet | string = createShadowStyle(styles);
  static template = template;
}

declare global {
  interface HTMLElementTagNameMap {
    [VideoSkinElement.tagName]: VideoSkinElement;
  }
}
