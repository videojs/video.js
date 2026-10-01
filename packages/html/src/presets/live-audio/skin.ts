import { createShadowStyle } from '@videojs/utils/dom';

import { template } from '../../internal/skins/default-live-audio/template';
import { SkinElement } from '../skin';

import styles from '../../define/live-audio/skin.css?inline';

/** Packaged default live-audio UI registered as `<live-audio-skin>`. */
export class LiveAudioSkinElement extends SkinElement {
  static readonly tagName = 'live-audio-skin';
  static styles: CSSStyleSheet | string = createShadowStyle(styles);
  static template = template;
}

declare global {
  interface HTMLElementTagNameMap {
    [LiveAudioSkinElement.tagName]: LiveAudioSkinElement;
  }
}
