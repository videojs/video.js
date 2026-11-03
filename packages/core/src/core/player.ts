import type { Media } from '@videojs/media';
import type { AnySlice, InferSliceSourceState, Slice } from '@videojs/store';
import type { CamelCase } from '@videojs/utils/types';

/**
 * The target a platform-neutral feature declares. It asks only for `media`, so the feature composes into any platform's
 * store: `combine` intersects it with that platform's full target.
 */
export interface PlayerMediaTarget {
  media: Media;
}

type ConfigValue = string | readonly number[] | null | undefined;

type ActionInput<Action> = Action extends (...args: infer Arguments) => unknown
  ? Arguments extends [infer Value]
    ? Value
    : never
  : never;

/**
 * Actions accepting text, including narrower unions such as a string enum, so a feature keeps its own value type on the
 * provider input. A list input must accept text too, because an HTML attribute only ever delivers text. `null |
 * undefined` stays mandatory because that is how a provider clears an absent input.
 */
type ConfigActionKey<State> = [State] extends [never]
  ? PropertyKey
  : {
      [Key in keyof State]-?: [ActionInput<State[Key]>] extends [ConfigValue]
        ? [null | undefined] extends [ActionInput<State[Key]>]
          ? [Extract<ActionInput<State[Key]>, string>] extends [never]
            ? never
            : Key
          : never
        : never;
    }[keyof State];

type ConfigStateKey<State> = [State] extends [never] ? PropertyKey : keyof State;

/**
 * Maps provider inputs to feature-owned state actions and detach-persistent keys. Pass the feature's source-state type
 * when declaring a config map so both keys are checked and each action accepts nullable text, including absent input.
 */
export type PlayerFeatureConfig<State = never> = Record<
  string,
  {
    /**
     * Source-state action applied when the input changes. It must accept the input's own value type plus `null |
     * undefined`, since an input the author omits arrives as `undefined`. A feature's own public setter qualifies when
     * it accepts that; otherwise point at a private action that does.
     */
    action: ConfigActionKey<State>;
    /** Provider-owned source-state key whose value survives media detach. */
    state: ConfigStateKey<State>;
    /** How an HTML provider element names this input, when the key's own name won't do. */
    html?: {
      /**
       * Attribute name in markup, kebab-case, for a key whose own name is taken on an element. The matching property
       * follows from it, so `content-title` is also `element.contentTitle`. Defaults to the kebab-cased key.
       */
      attribute: string;
    };
  }
>;

/**
 * A player feature. `Target` is what the feature reads when attached; a feature defined with `definePlayerFeature` from
 * `@videojs/core` declares `PlayerMediaTarget`, and a platform's definer declares that platform's full target. The
 * default accepts any, so feature lists can mix both.
 */
export type PlayerFeature<
  State,
  Derived = object,
  Config extends PlayerFeatureConfig = Record<never, never>,
  Target = any,
> = Slice<Target, State, Derived> & {
  config?: Config;
};

export type AnyPlayerFeature<Target = any> = AnySlice<Target> & { config?: PlayerFeatureConfig };

type ConfigInputValue<Feature extends AnyPlayerFeature, Entry> = Entry extends { action: infer Action }
  ? Action extends keyof InferSliceSourceState<Feature>
    ? ActionInput<InferSliceSourceState<Feature>[Action]>
    : never
  : never;

export type InferPlayerFeatureConfig<Feature extends AnyPlayerFeature> = Feature extends {
  config?: infer Config extends PlayerFeatureConfig;
}
  ? { [Key in keyof Config]: ConfigInputValue<Feature, Config[Key]> }
  : object;

/** The same inputs under the names they go by on an HTML element. */
export type InferPlayerFeatureHtmlConfig<Feature extends AnyPlayerFeature> = Feature extends {
  config?: infer Config extends PlayerFeatureConfig;
}
  ? {
      [Key in keyof Config as HtmlPropertyKey<Key, Config[Key]>]: ConfigInputValue<Feature, Config[Key]>;
    }
  : object;

type HtmlPropertyKey<Key, Entry> = Entry extends { html: { attribute: infer Attribute extends string } }
  ? CamelCase<Attribute>
  : Key;

/** Merge a union of per-feature config objects into one flat object type. */
type MergedConfig<Union> = (Union extends any ? (config: Union) => void : never) extends (config: infer Merged) => void
  ? { [Key in keyof Merged]: Merged[Key] } & {}
  : never;

export type UnionPlayerConfig<Features extends readonly AnyPlayerFeature[]> = Features extends readonly []
  ? object
  : MergedConfig<InferPlayerFeatureConfig<Features[number]>>;

export type UnionPlayerHtmlConfig<Features extends readonly AnyPlayerFeature[]> = Features extends readonly []
  ? object
  : MergedConfig<InferPlayerFeatureHtmlConfig<Features[number]>>;
