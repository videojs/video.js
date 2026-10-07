import { createShadowStyle } from '@videojs/utils/dom';

import { template } from '../../internal/skins/neutral-video/template';
import { FCastVideoSkinElement } from '../video-skin';

import styles from '../../define/video/neutral-skin.css?inline';

/** Packaged Neutral video UI registered as `<video-neutral-skin>`. */
export class NeutralVideoSkinElement extends FCastVideoSkinElement {
  static readonly tagName = 'video-neutral-skin';
  static styles: CSSStyleSheet | string = createShadowStyle(styles);
  static template = template;
}

declare global {
  interface HTMLElementTagNameMap {
    [NeutralVideoSkinElement.tagName]: NeutralVideoSkinElement;
  }
}
