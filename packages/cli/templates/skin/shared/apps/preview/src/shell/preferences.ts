import { useEffect, useState } from 'react';

export const PREFERENCE_QUERIES = [
  ['reduced motion', '(prefers-reduced-motion: reduce)'],
  ['reduced transparency', '(prefers-reduced-transparency: reduce)'],
  ['more contrast', '(prefers-contrast: more)'],
  ['forced colors', '(forced-colors: active)'],
  ['hover', '(hover: hover)'],
  ['coarse pointer', '(pointer: coarse)'],
  ['dark scheme', '(prefers-color-scheme: dark)'],
] as const;

export type PreferenceName = (typeof PREFERENCE_QUERIES)[number][0];

export type Preferences = Readonly<Record<PreferenceName, boolean>>;

function readPreferences(): Preferences {
  // SAFETY: the object is built from every query name, so it carries every key of the record type.
  return Object.fromEntries(
    PREFERENCE_QUERIES.map(([name, query]) => [name, matchMedia(query).matches])
  ) as Preferences;
}

/** The detected preferences, kept current as the environment (or DevTools' rendering emulation) changes them. */
export function usePreferences(): Preferences {
  const [preferences, setPreferences] = useState(readPreferences);

  useEffect(() => {
    const update = () => setPreferences(readPreferences());
    const queries = PREFERENCE_QUERIES.map(([, query]) => matchMedia(query));

    for (const query of queries) query.addEventListener('change', update);

    return () => {
      for (const query of queries) query.removeEventListener('change', update);
    };
  }, []);

  return preferences;
}
