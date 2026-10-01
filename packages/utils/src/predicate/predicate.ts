/** @internal */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/** @internal */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

/** @internal */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/** @internal */
export function isFunction(value: unknown): value is (...args: any[]) => any {
  return typeof value === 'function';
}

/** @internal */
export function isNull(value: unknown): value is null {
  return value === null;
}

/** @internal */
export function isUndefined(value: unknown): value is undefined {
  return typeof value === 'undefined';
}

/** @internal */
export function isNil(value: unknown): value is null | undefined {
  return value == null;
}

/** @internal */
export function isPromise(value: unknown): value is Promise<any> {
  return value instanceof Promise;
}

/**
 * Check if a value is an object, excluding null.
 *
 * @internal
 */
export function isObject(value: unknown): value is object {
  return value !== null && typeof value === 'object';
}

/**
 * Check if a value is an object carrying a callable method for every given name.
 *
 * Recognizes a foreign object by the shape a caller needs from it, without importing the library that defines it or
 * testing against its class.
 *
 * @internal
 */
export function hasMethods<K extends string>(
  value: unknown,
  methods: readonly K[]
): value is Record<K, (...args: any[]) => any> {
  if (!isObject(value)) return false;

  return methods.every((method) => isFunction((value as Record<string, unknown>)[method]));
}

/**
 * Check if a value is a plain object (not a class instance like Date, Map, etc).
 *
 * @internal
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) return false;

  const proto = Object.getPrototypeOf(value);

  return proto === null || proto === Object.prototype;
}

/**
 * Check if a value is an AbortError.
 *
 * @internal
 */
export function isAbortError(value: unknown): value is Error {
  return value instanceof Error && value.name === 'AbortError';
}
