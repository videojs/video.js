import type { Locale } from '@videojs/core/i18n';
import { effectiveLocale, nearestLang, resolveLangAttr } from '@videojs/utils/dom';

/**
 * Delegates to {@link effectiveLocale}; result is typed as {@link Locale} for player UI.
 *
 * @internal
 */
export function resolvePlayerLocale(explicit: Locale | undefined, inherited: Locale | undefined): Locale {
  return effectiveLocale<Locale>(explicit, inherited);
}

/**
 * Effective locale for an i18n provider element (explicit `lang` → ancestor `lang` chain → `en`).
 *
 * @internal
 */
export function resolveProviderLocale(host: HTMLElement & { lang?: string }): Locale {
  const explicit = resolveLangAttr<Locale>(host.lang);
  const root = host.parentElement ?? (typeof document !== 'undefined' ? document.documentElement : null);
  const inherited = resolveLangAttr<Locale>(nearestLang(root));

  return resolvePlayerLocale(explicit, inherited);
}
