import { createShadowStyle } from '@videojs/utils/dom';

import { template } from '../../internal/skins/compat-live-audio/template';
import { SkinElement } from '../skin';

import styles from '../../define/live-audio/compat-skin.css?inline';

/** Packaged compat live-audio UI registered as `<live-audio-compat-skin>`. */
export class CompatLiveAudioSkinElement extends SkinElement {
  static readonly tagName = 'live-audio-compat-skin';
  static styles = createShadowStyle(styles);
  static template = template;
}

declare global {
  interface HTMLElementTagNameMap {
    [CompatLiveAudioSkinElement.tagName]: CompatLiveAudioSkinElement;
  }
}
