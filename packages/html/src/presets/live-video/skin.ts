import { createShadowStyle } from '@videojs/utils/dom';

import { template } from '../../internal/skins/default-live-video/template';
import { FCastVideoSkinElement } from '../video-skin';

import styles from '../../define/live-video/skin.css?inline';

/** Packaged default live-video UI registered as `<live-video-skin>`. */
export class LiveVideoSkinElement extends FCastVideoSkinElement {
  static readonly tagName = 'live-video-skin';
  static styles: CSSStyleSheet | string = createShadowStyle(styles);
  static template = template;
}

declare global {
  interface HTMLElementTagNameMap {
    [LiveVideoSkinElement.tagName]: LiveVideoSkinElement;
  }
}
