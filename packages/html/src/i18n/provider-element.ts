import { ReactiveElement } from '@videojs/element';

import { i18nContext } from './context';
import { createI18nProviderMixin, type I18nProviderMixin as ProviderMixin } from './provider-mixin';

/** @internal */
export const I18nProviderMixin: ProviderMixin = createI18nProviderMixin({ context: i18nContext });

export class I18nProviderElement extends I18nProviderMixin(ReactiveElement) {
  static readonly tagName = 'media-i18n';
}

export { I18nProviderElement as MediaI18nProviderElement };
