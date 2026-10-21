import type { AnyBehavior, Empty } from './define-behavior';

/**
 * One capability of a composition: the behaviors that implement it, with the config defaults and initial state they
 * need. Removing a feature from a composition removes its behaviors and their defaults together, except behaviors
 * another composed feature also lists.
 *
 * A feature's behaviors compose in order at the feature's position, except a behavior an earlier feature already
 * listed, which composes at that earlier position. A feature that owns external inputs lists its
 * `defineExternalSignals(...)` behavior among them.
 */
export interface Feature<
  Behaviors extends readonly AnyBehavior[] = readonly AnyBehavior[],
  Defaults extends object = Empty,
  Initial extends object = Empty,
> {
  /** The behaviors that implement the feature, in setup order. May be empty for a feature that only sets config. */
  behaviors: Behaviors;
  /** Config defaults, merged with every other composed feature's; a later feature's key replaces an earlier one's. */
  defaultConfig?: Defaults;
  /** Initial state values, merged the same way as `defaultConfig`. */
  initialState?: Initial;
}

/** A feature with any behaviors, defaults, and initial state — used as a generic bound. */
type AnyFeature = Feature<readonly AnyBehavior[], any, any>;

/**
 * Define a feature. An identity function: it exists so the behavior list keeps its tuple type, which composition needs
 * to derive the state, context, and config types.
 *
 * `defaultConfig` may cover config keys that another feature's behaviors read; the composition checks each
 * `defaultConfig` value's type against the behavior that reads it.
 *
 * @example
 *   ```ts
 *   export const chaptersFeature = defineFeature({ behaviors: [loadChapters] });
 *   ```;
 */
export function defineFeature<
  const Behaviors extends readonly AnyBehavior[],
  Defaults extends object = Empty,
  Initial extends object = Empty,
>(feature: Feature<Behaviors, Defaults, Initial>): Feature<Behaviors, Defaults, Initial> {
  return feature;
}

/** Every feature's behaviors, concatenated in feature order. */
type FeaturesBehaviors<Features extends readonly AnyFeature[]> = Features extends readonly [
  infer First extends AnyFeature,
  ...infer Rest extends readonly AnyFeature[],
]
  ? [...First['behaviors'], ...FeaturesBehaviors<Rest>]
  : [];

/**
 * Every feature's `Key` value (`defaultConfig` or `initialState`), merged in order: a later key replaces an earlier
 * one.
 */
type FeaturesValues<
  Features extends readonly AnyFeature[],
  Key extends 'defaultConfig' | 'initialState',
  Merged extends object = Empty,
> = Features extends readonly [infer First extends AnyFeature, ...infer Rest extends readonly AnyFeature[]]
  ? FeaturesValues<Rest, Key, Omit<Merged, keyof NonNullable<First[Key]>> & NonNullable<First[Key]>>
  : Merged;

/** What {@link flattenFeatures} returns: the inputs `createComposition` and `defineCompositionFactory` take. */
export interface FlattenedFeatures<Features extends readonly AnyFeature[]> {
  behaviors: FeaturesBehaviors<Features>;
  defaultConfig: FeaturesValues<Features, 'defaultConfig'>;
  initialState: FeaturesValues<Features, 'initialState'>;
}

/**
 * Flatten features into one behavior list, one `defaultConfig`, and one `initialState`, ready for `createComposition`
 * or `defineCompositionFactory`. The feature list is the composition order.
 *
 * Features may share behaviors and keys. A behavior listed by several features is composed once, at its first position.
 * A `defaultConfig` or `initialState` key given by several features takes the last feature's value, so a feature listed
 * later can refine what an earlier one sets: DRM's playability probe replaces the plain one the video feature sets.
 *
 * The returned behavior type still lists a shared behavior once per feature. That's harmless: composition intersects
 * the behaviors' types, and a type intersected with itself is unchanged.
 *
 * @example
 *   ```ts
 *   const { behaviors, defaultConfig, initialState } = flattenFeatures([hlsLoadingFeature, mediaSourceFeature, videoFeature]);
 *   const composition = createComposition(behaviors, { defaultConfig, initialState, config });
 *   ```;
 */
export function flattenFeatures<const Features extends readonly AnyFeature[]>(
  features: Features
): FlattenedFeatures<Features> {
  const behaviors = [...new Set(features.flatMap((feature) => feature.behaviors))];
  const defaultConfig = mergeFeatureValues(features, 'defaultConfig');
  const initialState = mergeFeatureValues(features, 'initialState');

  // SAFETY: the runtime values are what the types describe, less behaviors listed more than once (see above).
  return { behaviors, defaultConfig, initialState } as unknown as FlattenedFeatures<Features>;
}

function mergeFeatureValues(features: readonly AnyFeature[], key: 'defaultConfig' | 'initialState'): object {
  return Object.assign({}, ...features.map((feature) => feature[key] ?? {}));
}
