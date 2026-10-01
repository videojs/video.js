export { type StyleDefinition, type StyleRule, type StyleValue, styles } from './define';

/**
 * Variant names a project selects at compile time. Augment this interface from the project that owns the variants so
 * `variants` keys in style rules are checked:
 *
 * ```ts
 * declare module 'vjsc/styles' {
 *   interface StyleVariants {
 *     neutral: true;
 *   }
 * }
 * ```
 *
 * Without an augmentation every key is accepted.
 */
export interface StyleVariants {}

/** The variant keys a style rule may declare: the augmented names, or any string when none are declared. */
export type StyleVariantName = keyof StyleVariants extends never ? string : keyof StyleVariants & string;
export type {
  CssTransformOptions,
  StylesheetOptions,
  StyleTransformOptions,
  TailwindTransformOptions,
} from './options';
