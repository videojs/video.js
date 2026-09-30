'use client';

import { useId } from 'react';

const UNSAFE_CHARS = /[^a-zA-Z0-9_-]/g;

/**
 * Generate a CSS-safe identifier from React's `useId()`.
 *
 * `useId()` returns values like `:r0:` which contain colons — invalid in CSS `<dashed-ident>` tokens (used by
 * `anchor-name` / `position-anchor`). This hook strips non-alphanumeric/underscore/hyphen characters and optionally
 * prepends a prefix.
 */
export function useSafeId(prefix?: string): string {
  const raw = useId().replace(UNSAFE_CHARS, '');

  return prefix ? `${prefix}-${raw}` : raw;
}
