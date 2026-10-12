import { createShadowStyle } from '@videojs/utils/dom';

import { template } from '../../internal/skins/scaffold-audio/template';
import { SkinElement } from '../skin';

import styles from '../../define/audio/scaffold-skin.css?inline';

/** Packaged scaffold audio UI registered as `<audio-scaffold-skin>`. */
export class ScaffoldAudioSkinElement extends SkinElement {
  static readonly tagName = 'audio-scaffold-skin';
  static styles = createShadowStyle(styles);
  static template = template;
}

declare global {
  interface HTMLElementTagNameMap {
    [ScaffoldAudioSkinElement.tagName]: ScaffoldAudioSkinElement;
  }
}
