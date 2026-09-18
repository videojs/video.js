import { isUndefined } from '@videojs/utils/predicate';

/**
 * Write declared props through to a media instance and return the leftovers.
 *
 * `defaults` is the schema: keys present there are media props and get written
 * to `target`; everything else is returned for the caller to spread onto the
 * native view. An `undefined` value means "caller omitted it" and resolves to
 * the default, so a controlled prop going back to `undefined` resets the
 * instance rather than leaving it stale.
 *
 * The `!==` guard before writing is load-bearing, not an optimization — these
 * setters have real side effects (`src` calls into the native module).
 */
export function useSyncProps<Props extends object, Rest extends Record<string, unknown>>(
  target: Props,
  props: Partial<Props> & Rest,
  defaults: Props
): Omit<Rest, keyof Props> {
  const rest: Record<string, unknown> = {};

  for (const key in props) {
    if (key in defaults) {
      const value = isUndefined(props[key]) ? (defaults as Record<string, unknown>)[key] : props[key];
      if (target[key as keyof typeof target] !== value) target[key as keyof typeof target] = value as any;
    } else {
      rest[key] = props[key];
    }
  }

  return rest as Omit<Rest, keyof Props>;
}
