import { flatten } from '@videojs/utils/object';

import type { FlatTranslations, Translations } from '../params';

export interface FlattenTranslationsOptions {
  prefix?: string;
}

/** @internal */
export function flattenTranslations(locale: Translations, options: FlattenTranslationsOptions = {}): FlatTranslations {
  return flatten(locale, options) as FlatTranslations;
}
