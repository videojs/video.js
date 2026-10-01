import { createShadowStyle } from '@videojs/utils/dom';

import { template } from '../../internal/skins/default-audio/template';
import { SkinElement } from '../skin';

import styles from '../../define/audio/skin.css?inline';

/** Packaged default audio UI registered as `<audio-skin>`. */
export class AudioSkinElement extends SkinElement {
  static readonly tagName = 'audio-skin';
  static styles: CSSStyleSheet | string = createShadowStyle(styles);
  static template = template;
}

declare global {
  interface HTMLElementTagNameMap {
    [AudioSkinElement.tagName]: AudioSkinElement;
  }
}
