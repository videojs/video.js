import { createShadowStyle } from '@videojs/utils/dom';

import { template } from '../../internal/skins/scaffold-live-audio/template';
import { SkinElement } from '../skin';

import styles from '../../define/live-audio/scaffold-skin.css?inline';

/** Packaged scaffold live-audio UI registered as `<live-audio-scaffold-skin>`. */
export class ScaffoldLiveAudioSkinElement extends SkinElement {
  static readonly tagName = 'live-audio-scaffold-skin';
  static styles = createShadowStyle(styles);
  static template = template;
}

declare global {
  interface HTMLElementTagNameMap {
    [ScaffoldLiveAudioSkinElement.tagName]: ScaffoldLiveAudioSkinElement;
  }
}
