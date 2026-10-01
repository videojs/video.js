import { createShadowStyle } from '@videojs/utils/dom';

import { template } from '../../internal/skins/neutral-audio/template';
import { SkinElement } from '../skin';

import styles from '../../define/audio/neutral-skin.css?inline';

/** Packaged Neutral audio UI registered as `<audio-neutral-skin>`. */
export class NeutralAudioSkinElement extends SkinElement {
  static readonly tagName = 'audio-neutral-skin';
  static styles: CSSStyleSheet | string = createShadowStyle(styles);
  static template = template;
}

declare global {
  interface HTMLElementTagNameMap {
    [NeutralAudioSkinElement.tagName]: NeutralAudioSkinElement;
  }
}
