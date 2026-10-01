import { createShadowStyle } from '@videojs/utils/dom';

import { template } from '../../internal/skins/compat-audio/template';
import { SkinElement } from '../skin';

import styles from '../../define/audio/compat-skin.css?inline';

/** Packaged compat audio UI registered as `<audio-compat-skin>`. */
export class CompatAudioSkinElement extends SkinElement {
  static readonly tagName = 'audio-compat-skin';
  static styles = createShadowStyle(styles);
  static template = template;
}

declare global {
  interface HTMLElementTagNameMap {
    [CompatAudioSkinElement.tagName]: CompatAudioSkinElement;
  }
}
