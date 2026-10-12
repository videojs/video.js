import { createShadowStyle } from '@videojs/utils/dom';

import { template } from '../../internal/skins/scaffold-video/template';
import { SkinElement } from '../skin';

import styles from '../../define/video/scaffold-skin.css?inline';

/** Packaged scaffold video UI registered as `<video-scaffold-skin>`. */
export class ScaffoldVideoSkinElement extends SkinElement {
  static readonly tagName = 'video-scaffold-skin';
  static styles = createShadowStyle(styles);
  static template = template;
}

declare global {
  interface HTMLElementTagNameMap {
    [ScaffoldVideoSkinElement.tagName]: ScaffoldVideoSkinElement;
  }
}
