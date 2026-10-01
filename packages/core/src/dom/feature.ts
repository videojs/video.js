import type { DerivedContext, SliceConfig } from '@videojs/store';

import type { AnyPlayerFeature, PlayerFeature, PlayerFeatureConfig, PlayerTarget } from './player';

type DerivedFunctions<State> = Record<string, (ctx: DerivedContext<State>) => unknown>;

type DerivedValues<Definitions extends Record<string, (...args: any[]) => unknown>> = {
  [Key in keyof Definitions]: ReturnType<Definitions[Key]>;
};

type PlayerFeatureDefinition<State, Derived, Config extends PlayerFeatureConfig> = Omit<
  SliceConfig<PlayerTarget, State, Derived>,
  'preserve'
> & {
  config?: Config;
};

/**
 * Define a player feature with derived state and optional configuration inputs.
 *
 * @internal
 */
export function definePlayerFeature<
  State,
  const Definitions extends DerivedFunctions<State>,
  const Config extends PlayerFeatureConfig = Record<never, never>,
>(
  definition: Omit<PlayerFeatureDefinition<State, DerivedValues<Definitions>, Config>, 'derived'> & {
    derived: Definitions;
  }
): PlayerFeature<State, DerivedValues<Definitions>, Config>;
/**
 * Define a player feature with optional configuration inputs.
 *
 * @internal
 */
export function definePlayerFeature<State, const Config extends PlayerFeatureConfig = Record<never, never>>(
  definition: Omit<PlayerFeatureDefinition<State, object, Config>, 'derived'> & { derived?: never }
): PlayerFeature<State, object, Config>;
/** @internal */
export function definePlayerFeature<State>(
  definition: PlayerFeatureDefinition<State, object, PlayerFeatureConfig>
): PlayerFeature<State> {
  const preserved = Object.values(definition.config ?? {}).map((entry) => entry.state);

  const feature: SliceConfig<PlayerTarget, State> & { config?: PlayerFeatureConfig } = {
    ...definition,
    ...(preserved.length > 0 ? { preserve: preserved } : {}),
  };

  // SAFETY: the slice brand is type-only, so a config is already a feature at runtime.
  return feature as PlayerFeature<State>;
}

/**
 * Merge the configuration declarations from the selected player features.
 *
 * @internal
 */
export function combinePlayerFeatureConfigs(features: readonly AnyPlayerFeature[]): PlayerFeatureConfig {
  const definitions = features.map((feature) => feature.config ?? {});

  if (__DEV__) {
    const seen = new Set<string>();

    for (const definition of definitions) {
      for (const key of Object.keys(definition)) {
        if (seen.has(key)) {
          console.warn(`[vjs-core] duplicate config key "${key}" — later feature overwrites earlier one`);
        }

        seen.add(key);
      }
    }
  }

  return Object.assign({}, ...definitions);
}

/**
 * Forward one configuration input through its feature-owned private action.
 *
 * @internal
 */
export function setPlayerConfigValue(store: object, entry: PlayerFeatureConfig[string], value: unknown): void {
  const action = (store as Record<PropertyKey, unknown>)[entry.action];
  if (typeof action !== 'function') throw new TypeError(`Missing config action "${String(entry.action)}"`);

  action(value);
}
