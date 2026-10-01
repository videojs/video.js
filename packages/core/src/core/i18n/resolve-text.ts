import type { Text } from './text';

/** @internal */
export function resolveText(text: Text | string): string {
  return typeof text === 'string' ? text : text.text;
}
