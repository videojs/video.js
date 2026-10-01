import { DEFAULT_LOCALE } from '@videojs/utils/i18n';

import type { FlatTranslations, Locale, Translations } from './params';
import { flattenTranslations } from './utils';

interface I18nRegistry {
  readonly layers: Map<Locale, Partial<FlatTranslations>>;
  readonly subscribers: Set<() => void>;
}

/**
 * Well-known key for the shared registry. Its name and value shape are a cross-version contract: every copy of this
 * module in a realm must agree on them, so change the key when the shape changes.
 */
const I18N_REGISTRY_KEY = Symbol.for('@videojs/i18n-registry');

type I18nRegistryHost = { [I18N_REGISTRY_KEY]?: I18nRegistry };

/**
 * The registry is realm-global rather than module-global so duplicate copies of this module converge on one set of
 * translations.
 *
 * Duplication is normal, not a bug to fix upstream: separately loaded CDN bundles, a pinned and an unpinned URL for the
 * same file, and two bundlers' output on one page all yield distinct module instances. With module-scoped state, a
 * `registerI18n` call on one instance is invisible to the player reading from another, and the locale silently falls
 * back to English.
 */
function getRegistry(): I18nRegistry {
  const host = globalThis as I18nRegistryHost;
  const existing = host[I18N_REGISTRY_KEY];
  if (existing) return existing;

  const registry: I18nRegistry = { layers: new Map(), subscribers: new Set() };

  host[I18N_REGISTRY_KEY] = registry;
  return registry;
}

function notify(): void {
  for (const cb of getRegistry().subscribers) {
    cb();
  }
}

function normalizeLocaleTag(tag: Locale): Locale {
  return tag.trim().replaceAll('_', '-').toLowerCase();
}

/** Strip unicode locale extension sequences (`-u-…`) before any private-use `-x-` block. */
function stripUnicodeExtensions(tag: Locale): Locale {
  const xIdx = tag.indexOf('-x-');
  const beforePrivateUse = xIdx === -1 ? tag : tag.slice(0, xIdx);
  const uIdx = beforePrivateUse.indexOf('-u-');
  if (uIdx === -1) return tag;

  return tag.slice(0, uIdx) + (xIdx === -1 ? '' : tag.slice(xIdx));
}

function chineseFallback(segments: string[]): Locale | undefined {
  if (segments[0] !== 'zh') {
    return undefined;
  }

  const script = segments.find((segment) => segment === 'hant' || segment === 'hans');

  return script === 'hant' ? 'zh-tw' : script === 'hans' ? 'zh-cn' : undefined;
}

/**
 * Normalize a BCP 47 tag to the key the registry stores it under: lowercase, with Unicode extensions removed.
 *
 * @example
 *   `en-US-u-nu-latn` → `en-us`
 *
 * @param locale - BCP 47 tag to normalize.
 * @public
 */
export function getLocaleKey(locale: Locale): Locale {
  return stripUnicodeExtensions(normalizeLocaleTag(locale));
}

/**
 * Most-specific-first BCP 47 lookup tags (normalized). Always ends with `en` when missing from the truncated chain.
 *
 * @example
 *   `es-419-u-nu-latn` → `['es-419', 'es', 'en']`
 *
 * @param locale - BCP 47 tag to resolve.
 * @public
 */
export function findLocaleKeys(locale: Locale): Locale[] {
  const base = getLocaleKey(locale);
  if (!base) return [DEFAULT_LOCALE];

  const segments = base.split('-').filter(Boolean);
  const chain: Locale[] = [];

  for (let len = segments.length; len >= 1; len--) {
    chain.push(segments.slice(0, len).join('-'));
  }

  const zhFallback = chineseFallback(segments);
  const zhIndex = chain.indexOf('zh');

  if (zhFallback && zhIndex !== -1) {
    chain.splice(zhIndex, 0, zhFallback);
  }

  const out: Locale[] = [];
  const seen = new Set<string>();

  for (const tag of chain) {
    if (!seen.has(tag)) {
      seen.add(tag);
      out.push(tag);
    }
  }

  if (!seen.has(DEFAULT_LOCALE)) {
    out.push(DEFAULT_LOCALE);
  }

  return out;
}

function mergeI18nTranslations(chain: Locale[]): FlatTranslations {
  const { layers } = getRegistry();
  const merged: Partial<FlatTranslations> = {};

  for (let i = chain.length - 1; i >= 0; i--) {
    const tag = chain[i]!;
    const layer = layers.get(tag);

    if (layer) {
      Object.assign(merged, layer);
    }
  }

  return merged as FlatTranslations;
}

/**
 * Register or merge translation strings for a BCP 47 locale tag.
 *
 * @param locale - BCP 47 tag (normalized to lowercase; unicode extensions stripped for the registry key).
 * @param translations - Partial nested locale values; merges with any existing layer for the tag.
 * @public
 */
export function registerI18n(locale: Locale, translations: Partial<Translations>): void {
  const { layers } = getRegistry();
  const tag = getLocaleKey(locale);
  const existing = layers.get(tag) ?? {};

  layers.set(tag, { ...existing, ...flattenTranslations(translations) });
  notify();
}

/**
 * Return the merged registered translation map for a locale. Built-in English defaults are supplied by text
 * descriptors.
 *
 * @param locale - BCP 47 tag to resolve (e.g. `es-MX`, `zh-Hant-HK`).
 * @public
 */
export function getI18nTranslations(locale: Locale): FlatTranslations {
  return mergeI18nTranslations(findLocaleKeys(locale));
}

/**
 * Subscribe to global registry mutations (for example after `registerI18n` or browser translation prefetch).
 *
 * @param callback - Invoked when any locale layer changes.
 * @public
 */
export function onI18nRegistryChange(callback: () => void): () => void {
  const { subscribers } = getRegistry();

  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Whether an exact locale tag has been registered via `registerI18n` (not whether lazy packs exist).
 *
 * @param locale - BCP 47 tag to test.
 * @public
 */
export function hasRegisteredLocale(locale: Locale): boolean {
  return getRegistry().layers.has(getLocaleKey(locale));
}

/**
 * Clears registered locale overlays (test isolation).
 *
 * @internal
 */
export function resetI18nRegistry(): void {
  const { layers, subscribers } = getRegistry();

  layers.clear();
  subscribers.clear();
}
