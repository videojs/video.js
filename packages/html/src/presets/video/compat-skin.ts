import { createShadowStyle } from '@videojs/utils/dom';

import { template } from '../../internal/skins/compat-video/template';
import { SkinElement } from '../skin';

import styles from '../../define/video/compat-skin.css?inline';

/** Packaged compat video UI registered as `<video-compat-skin>`. */
export class CompatVideoSkinElement extends SkinElement {
  static readonly tagName = 'video-compat-skin';
  static styles = createShadowStyle(styles);
  static template = template;
}

declare global {
  interface HTMLElementTagNameMap {
    [CompatVideoSkinElement.tagName]: CompatVideoSkinElement;
  }
}
