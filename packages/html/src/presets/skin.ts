import { ReactiveElement } from '@videojs/element';
import {
  applyShadowStyles,
  createShadowStyle,
  ensureGlobalStyle,
  querySlot,
  renderTemplate,
  type ShadowStyle,
} from '@videojs/utils/dom';

import { afterParse, createSlotHelp } from '../help/slot-help';

import globalStyles from '../define/global.css?inline';
import shadowStyles from '../define/shadow.css?inline';

const STYLES_ID = '__media-styles';
const shadowSheet = createShadowStyle(shadowStyles);

/**
 * Base element for skin definitions. Attaches a shadow root, clones `static template` into it, and applies shared +
 * per-skin styles via `adoptedStyleSheets` (or `<style>` fallback).
 */
export class SkinElement extends ReactiveElement {
  static shadowRootOptions: ShadowRootInit = { mode: 'open' };
  static styles?: ShadowStyle;
  static template?: HTMLTemplateElement | null;

  #updateHelp: (() => void) | null = null;

  constructor() {
    super();

    ensureGlobalStyle(STYLES_ID, globalStyles);

    if (!this.shadowRoot) {
      const ctor = this.constructor as typeof SkinElement;

      this.attachShadow(ctor.shadowRootOptions);

      if (ctor.template) {
        renderTemplate(this.shadowRoot!, ctor.template);
      }

      const mediaSlot = querySlot(this.shadowRoot!, '');

      this.#updateHelp = mediaSlot ? createSlotHelp(mediaSlot, 'Add a Media to this skin.') : null;

      const sheets: ShadowStyle[] = [shadowSheet];

      if (ctor.styles) {
        sheets.push(ctor.styles);
      }

      applyShadowStyles(this.shadowRoot!, sheets);
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();

    if (this.#updateHelp) afterParse(this.ownerDocument, this.#updateHelp);
  }
}
