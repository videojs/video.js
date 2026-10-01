/** @internal */
export function pascalCase(str: string): string {
  return str.replace(/[-_](.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, (_, c) => c.toUpperCase());
}

/** @internal */
export function camelCase(str: string): string {
  return pascalCase(str).replace(/^(.)/, (_, c) => c.toLowerCase());
}

/** @internal */
export function kebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/** @internal */
export function snakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}
