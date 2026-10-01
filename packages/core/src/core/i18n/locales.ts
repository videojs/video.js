/** Non-English locale packs shipped with Video.js. */
export const LOCALES = [
  'ar',
  'az',
  'bs',
  'bg',
  'bn',
  'ca',
  'cs',
  'cy',
  'da',
  'de',
  'el',
  'es',
  'et',
  'eu',
  'fa',
  'fi',
  'fr',
  'gd',
  'gl',
  'he',
  'hi',
  'hr',
  'hu',
  'id',
  'it',
  'ja',
  'ko',
  'lt',
  'lv',
  'mr',
  'nb',
  'nl',
  'nn',
  'ne',
  'oc',
  'pl',
  'pt-BR',
  'pt-PT',
  'ro',
  'ru',
  'sk',
  'sl',
  'sr',
  'sv',
  'te',
  'th',
  'tr',
  'uk',
  'vi',
  'zh-CN',
  'zh-TW',
] as const;

/** @internal */
export type LocaleAlias<Tags extends readonly string[]> = Tags[number] extends `${infer Lang}-${string}` ? Lang : never;

/** @internal */
export function localeAliases<const Tags extends readonly string[]>(tags: Tags): LocaleAlias<Tags>[] {
  const counts = new Map<string, number>();

  for (const tag of tags) {
    if (!tag.includes('-')) continue;

    const [lang] = tag.split('-');
    if (!lang) continue;

    counts.set(lang, (counts.get(lang) ?? 0) + 1);
  }

  return [...counts].filter(([, count]) => count > 1).map(([lang]) => lang) as LocaleAlias<Tags>[];
}
