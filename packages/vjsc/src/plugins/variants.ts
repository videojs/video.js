import type { TransformModule } from '../utils/module-id';

/** How a project's compile variants are written to, and read back from, module queries. */
export interface VariantCodec<Variant> {
  /** Query parameters that select a variant. */
  encode(variant: Variant): Readonly<Record<string, string>>;
  /**
   * Read the variant a module query selects, or `null` when the query belongs to another tool. Throw for a query that
   * names a variant but is incomplete or invalid, so the module is never compiled as plain source by mistake.
   */
  decode(params: URLSearchParams): Variant | null;
  /**
   * The variant a relative dependency compiles for when a module compiled for `variant` imports it. Defaults to the
   * importer's variant; a narrower one lets a dependency that ignores part of the variant compile once for every
   * importer that differs only in that part.
   */
  inherit?(variant: Variant, dependency: SourceEntry): Variant;
}

/** A source file a variant is chosen for. */
export interface SourceEntry {
  readonly filename: string;
}

/** A transformed module together with the compile variant its query selects, if any. */
export interface VariantModule<Variant> extends TransformModule {
  readonly variant: Variant | null;
}

/** Declare how a project's compile variants map to module queries. */
export function defineVariants<Variant>(codec: VariantCodec<Variant>): VariantCodec<Variant> {
  return codec;
}

/** Decode each module's variant once per build, so every pass and callback agrees on it. */
export function createVariantReader<Variant>(
  codec: VariantCodec<Variant> | undefined
): (module: TransformModule) => VariantModule<Variant> {
  const variants = new Map<string, Variant | null>();

  return (module) => {
    if (!variants.has(module.id)) {
      variants.set(module.id, codec && module.params.size > 0 ? codec.decode(module.params) : null);
    }

    return { ...module, variant: variants.get(module.id) ?? null };
  };
}
