import { ReactiveElement } from '@videojs/element';

import { i18nContext } from '../../i18n/context';
import { createTextMixin, type I18nTextMixin as TextMixin } from '../../i18n/text-mixin';

/** @internal */
export const I18nTextMixin: TextMixin = createTextMixin({ context: i18nContext });

export class TextElement extends I18nTextMixin(ReactiveElement) {
  static readonly tagName = 'media-text';
}

export { TextElement as MediaTextElement };
