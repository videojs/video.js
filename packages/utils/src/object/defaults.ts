import { isUndefined } from '../predicate';

/** Makes all properties optional and explicitly allows undefined values. */
type PartialWithUndefined<T> = { [K in keyof T]?: T[K] | undefined };

/**
 * Creates a new object with default values filled in for undefined properties.
 *
 * Only keys owned by `defaultValues` are read from `object`; any other key on `object` is ignored. Callers pass live
 * DOM elements as `object`, and enumerating those would touch hundreds of inherited accessors such as `offsetWidth` and
 * `innerHTML`, forcing style recalculation and layout on every call.
 *
 * @example
 *   ```ts
 *   const props = { label: undefined, disabled: true };
 *   const defaultProps = { label: '', disabled: false };
 *   defaults(props, defaultProps); // { label: '', disabled: true }
 *   ```;
 *
 * @internal
 */
export function defaults<T extends object>(object: PartialWithUndefined<T>, defaultValues: T): T {
  const result = { ...defaultValues };

  for (const key of Object.keys(defaultValues) as (keyof T)[]) {
    const value = object[key];

    if (!isUndefined(value)) {
      result[key] = value as T[keyof T];
    }
  }

  return result;
}
