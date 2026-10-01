import type { AstroCookies } from 'astro';

import type { AnySupportedStyle, SupportedFramework, SupportedStyle } from '@/types/docs';
import { DEFAULT_FRAMEWORK, isValidFramework, isValidStyleForFramework } from '@/types/docs';

// Cookie name for framework (server-side redirects)
export const FRAMEWORK_COOKIE = 'vjs_docs_framework';

// LocalStorage key prefix for style (per-framework, client-side only)
const STYLE_STORAGE_KEY_PREFIX = 'vjs_docs_style_';

// Cookie options for client-side (1 year expiration)
const COOKIE_MAX_AGE = 31536000; // 1 year in seconds
const COOKIE_OPTIONS = `max-age=${COOKIE_MAX_AGE}; path=/; samesite=lax`;

/** Server-side API: Works with Astro.cookies */

interface NoPreference {
  framework: null;
}
interface FrameworkPreference {
  framework: SupportedFramework;
}
export type Preference = NoPreference | FrameworkPreference;

export function getPreferencesServer(cookies: AstroCookies): Preference {
  const frameworkCookie = cookies.has(FRAMEWORK_COOKIE) ? cookies.get(FRAMEWORK_COOKIE) : null;

  const framework = frameworkCookie && isValidFramework(frameworkCookie.value) ? frameworkCookie.value : null;

  return { framework } as Preference;
}

/** Client-side API: Works with document.cookie and localStorage */

export function getFrameworkPreferenceClient(): SupportedFramework | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';').reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split('=');

      if (key) acc[key] = value;

      return acc;
    },
    {} as Record<string, string>
  );

  const framework = cookies[FRAMEWORK_COOKIE];

  return framework && isValidFramework(framework) ? framework : DEFAULT_FRAMEWORK;
}

export function setFrameworkPreferenceClient(framework: SupportedFramework): void {
  if (typeof document === 'undefined') return;

  if (!isValidFramework(framework)) throw new Error(`Invalid framework: ${framework}`);

  document.cookie = `${FRAMEWORK_COOKIE}=${framework}; ${COOKIE_OPTIONS}`;
}

/** Get style preference from localStorage for a specific framework */
export function getStylePreferenceClient<F extends SupportedFramework>(framework: F): SupportedStyle<F> | null {
  if (typeof localStorage === 'undefined') return null;

  const storageKey = STYLE_STORAGE_KEY_PREFIX + framework;
  const style = localStorage.getItem(storageKey);
  if (style && isValidStyleForFramework(framework, style)) return style as SupportedStyle<F>;

  return null;
}

/** Set style preference in localStorage for a specific framework */
export function setStylePreferenceClient<F extends SupportedFramework>(framework: F, style: SupportedStyle<F>): void {
  if (typeof localStorage === 'undefined') return;

  if (!isValidStyleForFramework(framework, style)) {
    throw new Error(`Invalid style "${style}" for framework "${framework}"`);
  }

  const storageKey = STYLE_STORAGE_KEY_PREFIX + framework;

  localStorage.setItem(storageKey, style);
}

/** Update the DOM data-style attribute to match the current style */
export function updateStyleAttribute(style: AnySupportedStyle): void {
  if (typeof document === 'undefined') return;

  document.documentElement.dataset.style = style;
}
