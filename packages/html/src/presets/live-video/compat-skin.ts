import { createShadowStyle } from '@videojs/utils/dom';

import { template } from '../../internal/skins/compat-live-video/template';
import { FCastVideoSkinElement } from '../video-skin';

import styles from '../../define/live-video/compat-skin.css?inline';

/** Packaged compat live-video UI registered as `<live-video-compat-skin>`. */
export class CompatLiveVideoSkinElement extends FCastVideoSkinElement {
  static readonly tagName = 'live-video-compat-skin';
  static styles = createShadowStyle(styles);
  static template = template;
}

declare global {
  interface HTMLElementTagNameMap {
    [CompatLiveVideoSkinElement.tagName]: CompatLiveVideoSkinElement;
  }
}
