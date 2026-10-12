/** Prefix of an id the compiler leaves for the HTML runtime's `Scope` to resolve once per rendered instance. */
export const SCOPED_ID = '__vjsc-id-';

/** The placeholder the compiler emits for id `name` in the component scope `prefix`. */
export function scopedIdPlaceholder(prefix: string, name: string): string {
  return `${SCOPED_ID}${prefix}-${name}`;
}
