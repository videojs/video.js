'use client';

import * as React from 'react';
import { useState } from 'react';

const UNSAFE_CHARS = /[^a-zA-Z0-9_-]/g;

let fallbackIdCount = 0;

/** Stands in for `useId()` before React 18: unique on the client, but not stable between a server render and hydration. */
function useFallbackId(): string {
  const [id] = useState(() => `r${++fallbackIdCount}`);

  return id;
}

/**
 * `useId` arrived in React 18. A dynamic read keeps bundlers that know the exports of older React versions from failing
 * the build over a static import that does not exist there.
 */
const useReactId: () => string = Reflect.get(React, 'useId') ?? useFallbackId;

/**
 * Generate a CSS-safe identifier from React's `useId()`.
 *
 * `useId()` returns values like `:r0:` which contain colons — invalid in CSS `<dashed-ident>` tokens (used by
 * `anchor-name` / `position-anchor`). This hook strips non-alphanumeric/underscore/hyphen characters and optionally
 * prepends a prefix.
 */
export function useSafeId(prefix?: string): string {
  const raw = useReactId().replace(UNSAFE_CHARS, '');

  return prefix ? `${prefix}-${raw}` : raw;
}
