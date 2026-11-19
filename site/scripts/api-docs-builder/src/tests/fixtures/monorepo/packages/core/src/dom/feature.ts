/**
 * Mock definePlayerFeature — identity function matching the real signature.
 * The builder only needs the TypeScript types to resolve; it never runs this.
 *
 * `PlayerFeatureConfig` mirrors the real constraint in
 * packages/core/src/dom/player.ts rather than loosening it. These fixtures are
 * inside site/tsconfig.json's program, so `astro check` rejects a fixture
 * config that production would reject — a loose mock would let the suite pass
 * on a shape the real API forbids.
 */

type ConfigValue = string | readonly number[] | null | undefined;

type ActionInput<Action> = Action extends (...args: infer Arguments) => unknown
  ? Arguments extends [infer Value]
    ? Value
    : never
  : never;

/**
 * Actions accepting text, including narrower unions such as a string enum, so
 * a feature keeps its own value type on the provider input. A list input must
 * accept text too, because an HTML attribute only ever delivers text.
 * `null | undefined` stays mandatory because that is how a provider clears an
 * absent input.
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

export type PlayerFeatureConfig<State = never> = Record<
  string,
  {
    action: ConfigActionKey<State>;
    state: ConfigStateKey<State>;
    /** How an HTML provider element names this input, when the key's own name won't do. */
    html?: {
      /** Attribute name in markup, kebab-case. Defaults to the kebab-cased key. */
      attribute: string;
    };
  }
>;

/**
 * `Config` is a generic constrained to the unparameterized `PlayerFeatureConfig`,
 * matching the real overload. That keeps the parameter permissive (its keys are
 * `PropertyKey`) and leaves the narrowing to the author's own
 * `satisfies PlayerFeatureConfig<SourceState>` clause, exactly as in production.
 */
export const definePlayerFeature = <State, Config extends PlayerFeatureConfig = Record<never, never>>(config: {
  name?: string;
  config?: Config;
  state: (ctx: any) => State;
  derived?: Record<string, (ctx: any) => unknown>;
  attach?: (ctx: any) => void;
}) => config;
