import {
  applyShadowStyles,
  createShadowStyle,
  ensureGlobalStyle,
  renderTemplate,
  type ShadowStyle,
} from '@videojs/utils/dom';

import { UIElement } from '../ui/ui-element';

import globalStyles from '../define/global.css?inline';
import shadowStyles from '../define/shadow.css?inline';

const STYLES_ID = '__media-styles';
const shadowSheet = createShadowStyle(shadowStyles);

/**
 * Base element for skin definitions. Attaches a shadow root, clones `static template` into it, and applies shared +
 * per-skin styles via `adoptedStyleSheets` (or `<style>` fallback). Destroying it also destroys the controls in its
 * shadow root.
 */
export class SkinElement extends UIElement {
  static shadowRootOptions: ShadowRootInit = { mode: 'open' };
  static styles?: ShadowStyle;
  static template?: HTMLTemplateElement | null;

  constructor() {
    super();

    ensureGlobalStyle(STYLES_ID, globalStyles);

    if (!this.shadowRoot) {
      const ctor = this.constructor as typeof SkinElement;

      this.attachShadow(ctor.shadowRootOptions);

      if (ctor.template) {
        renderTemplate(this.shadowRoot!, ctor.template);
      }

      const sheets: ShadowStyle[] = [shadowSheet];

      if (ctor.styles) {
        sheets.push(ctor.styles);
      }

      applyShadowStyles(this.shadowRoot!, sheets);
    }
  }
}
