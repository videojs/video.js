import type { StyleVariantName } from './index';

/** CSS compilation inputs used when `mode` is `css`. */
export interface StylesheetOptions {
  /** Tailwind CSS entry used to resolve utilities, theme tokens, and variants. */
  readonly input: string;
  /** Runtime base CSS entry imported before generated semantic styles. */
  readonly base?: string | undefined;
  /** Optional selector wrapped around emitted CSS with `@scope`. */
  readonly scope?: string | undefined;
  /**
   * Cascade order of emitted output files, earliest first: a later file overrides an earlier one wherever their rules
   * style one element. When set, it must list every emitted file. Without it, files are emitted by name.
   */
  readonly order?: readonly string[] | undefined;
  /**
   * Whether the elements `shadowHost` rules style host shadow roots in this output, as custom elements do. Their rules
   * then also emit the copies WebKit needs outside `@scope`; markup without shadow roots does not need them.
   *
   * @default true
   */
  readonly shadowHosts?: boolean | undefined;
}

interface StyleTransformBaseOptions {
  /** Variants whose utilities are appended to each rule's base utilities, in order. */
  readonly variants?: readonly StyleVariantName[] | undefined;
}

/** Replace style references with their Tailwind utility classes. */
export interface TailwindTransformOptions extends StyleTransformBaseOptions {
  readonly mode: 'tailwind';
  /** Tailwind theme input used when merging variant utilities. */
  readonly stylesheet?: Pick<StylesheetOptions, 'input'> | undefined;
}

/** Replace style references with semantic class names and optionally emit their CSS. */
export interface CssTransformOptions extends StyleTransformBaseOptions {
  readonly mode: 'css';
  /** Compile referenced styles using this stylesheet environment. */
  readonly stylesheet?: StylesheetOptions | undefined;
}

export type StyleTransformOptions = TailwindTransformOptions | CssTransformOptions;
