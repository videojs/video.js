/** @internal */
export function pascalCase(str: string): string {
  return str.replace(/[-_](.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, (_, c) => c.toUpperCase());
}

/** @internal */
export function camelCase(str: string): string {
  return pascalCase(str).replace(/^(.)/, (_, c) => c.toLowerCase());
}

/**
 * Convert a camelCase CSS property name, keeping the leading dash a vendor prefix such as `WebkitAppearance` needs.
 *
 * @internal
 */
export function kebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/**
 * Convert an identifier such as a component name to kebab case: `PlayButton` becomes `play-button`.
 *
 * @internal
 */
export function kebabCaseName(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** @internal */
export function snakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}
