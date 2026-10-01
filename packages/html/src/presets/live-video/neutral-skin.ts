import { createShadowStyle } from '@videojs/utils/dom';

import { template } from '../../internal/skins/neutral-live-video/template';
import { SkinElement } from '../skin';

import styles from '../../define/live-video/neutral-skin.css?inline';

/** Packaged Neutral live-video UI registered as `<live-video-neutral-skin>`. */
export class NeutralLiveVideoSkinElement extends SkinElement {
  static readonly tagName = 'live-video-neutral-skin';
  static styles: CSSStyleSheet | string = createShadowStyle(styles);
  static template = template;
}

declare global {
  interface HTMLElementTagNameMap {
    [NeutralLiveVideoSkinElement.tagName]: NeutralLiveVideoSkinElement;
  }
}
