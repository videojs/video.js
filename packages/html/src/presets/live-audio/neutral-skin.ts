import { createShadowStyle } from '@videojs/utils/dom';

import { template } from '../../internal/skins/neutral-live-audio/template';
import { SkinElement } from '../skin';

import styles from '../../define/live-audio/neutral-skin.css?inline';

/** Packaged Neutral live-audio UI registered as `<live-audio-neutral-skin>`. */
export class NeutralLiveAudioSkinElement extends SkinElement {
  static readonly tagName = 'live-audio-neutral-skin';
  static styles = createShadowStyle(styles);
  static template = template;
}

declare global {
  interface HTMLElementTagNameMap {
    [NeutralLiveAudioSkinElement.tagName]: NeutralLiveAudioSkinElement;
  }
}
