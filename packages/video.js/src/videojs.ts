import { throwLegacyError } from './errors/legacy-error';

/**
 * The Video.js 8 module surface, each member throwing its `VJS8_LEGACY_*` code.
 *
 * A developer following a v8 example runs `npm install video.js` and calls `videojs('my-video')`. Without these stubs
 * that fails as "undefined is not a function"; with them it fails with a code that can only lead to its error page.
 * Only setup-time entry points are stubbed: anything reached through a v8 player instance is unreachable once
 * `videojs()` throws.
 *
 * @internal
 */
export interface LegacyVideojs {
  (...args: unknown[]): never;
  readonly registerPlugin: typeof registerPlugin;
  readonly getPlugin: typeof getPlugin;
  readonly registerComponent: typeof registerComponent;
  readonly getComponent: typeof getComponent;
  readonly getPlayer: typeof getPlayer;
  readonly options: typeof options;
}

/** @internal */
export function registerPlugin(..._args: unknown[]): never {
  throwLegacyError('VJS8_LEGACY_PLUGIN');
}

/** @internal */
export function getPlugin(..._args: unknown[]): never {
  throwLegacyError('VJS8_LEGACY_PLUGIN');
}

/** @internal */
export function registerComponent(..._args: unknown[]): never {
  throwLegacyError('VJS8_LEGACY_COMPONENT');
}

/** @internal */
export function getComponent(..._args: unknown[]): never {
  throwLegacyError('VJS8_LEGACY_COMPONENT');
}

/** @internal */
export function getPlayer(..._args: unknown[]): never {
  throwLegacyError('VJS8_LEGACY_GET_PLAYER');
}

function throwOptions(): never {
  throwLegacyError('VJS8_LEGACY_OPTIONS');
}

/**
 * `videojs.options` was a mutable bag of global defaults, so a plain value cannot report its use. The proxy throws on
 * any read, write, check, or delete of a key instead.
 *
 * @internal
 */
export const options: Record<string, never> = new Proxy(Object.freeze({}), {
  get: throwOptions,
  set: throwOptions,
  has: throwOptions,
  deleteProperty: throwOptions,
  defineProperty: throwOptions,
});

/** @internal */
const videojs: LegacyVideojs = Object.assign(
  function videojs(..._args: unknown[]): never {
    throwLegacyError('VJS8_LEGACY_INIT');
  },
  { registerPlugin, getPlugin, registerComponent, getComponent, getPlayer, options }
);

export default videojs;
