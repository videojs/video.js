import { throwLegacyError } from './errors/legacy-error';

/**
 * The Video.js 8 module surface, each member throwing its `VJS8_LEGACY_*` code.
 *
 * A developer following a v8 example runs `npm install video.js` and calls `videojs('my-video')`. Without these stubs
 * that fails as "undefined is not a function"; with them it fails with a code that can only lead to its error page.
 * Only setup-time entry points are stubbed: anything reached through a v8 player instance is unreachable once
 * `videojs()` throws.
 *
 * @deprecated The Video.js 8 module shape. Every member throws a `VJS8_LEGACY_*` code.
 * @see {@link https://videojs.org/docs/reference/api/error-codes}
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

/**
 * @deprecated Video.js 8 API. Throws `VJS8_LEGACY_PLUGIN`.
 * @see {@link https://videojs.org/docs/reference/api/vjs8-legacy-plugin}
 */
export function registerPlugin(..._args: unknown[]): never {
  throwLegacyError('VJS8_LEGACY_PLUGIN');
}

/**
 * @deprecated Video.js 8 API. Throws `VJS8_LEGACY_PLUGIN`.
 * @see {@link https://videojs.org/docs/reference/api/vjs8-legacy-plugin}
 */
export function getPlugin(..._args: unknown[]): never {
  throwLegacyError('VJS8_LEGACY_PLUGIN');
}

/**
 * @deprecated Video.js 8 API. Throws `VJS8_LEGACY_COMPONENT`.
 * @see {@link https://videojs.org/docs/reference/api/vjs8-legacy-component}
 */
export function registerComponent(..._args: unknown[]): never {
  throwLegacyError('VJS8_LEGACY_COMPONENT');
}

/**
 * @deprecated Video.js 8 API. Throws `VJS8_LEGACY_COMPONENT`.
 * @see {@link https://videojs.org/docs/reference/api/vjs8-legacy-component}
 */
export function getComponent(..._args: unknown[]): never {
  throwLegacyError('VJS8_LEGACY_COMPONENT');
}

/**
 * @deprecated Video.js 8 API. Throws `VJS8_LEGACY_GET_PLAYER`.
 * @see {@link https://videojs.org/docs/reference/api/vjs8-legacy-get-player}
 */
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
 * @deprecated Video.js 8 API. Throws `VJS8_LEGACY_OPTIONS`.
 * @see {@link https://videojs.org/docs/reference/api/vjs8-legacy-options}
 */
export const options: Record<string, never> = new Proxy(Object.freeze({}), {
  get: throwOptions,
  set: throwOptions,
  has: throwOptions,
  deleteProperty: throwOptions,
  defineProperty: throwOptions,
});

/**
 * @deprecated Video.js 8 API. Throws `VJS8_LEGACY_INIT`.
 * @see {@link https://videojs.org/docs/reference/api/vjs8-legacy-init}
 */
const videojs: LegacyVideojs = Object.assign(
  function videojs(..._args: unknown[]): never {
    throwLegacyError('VJS8_LEGACY_INIT');
  },
  { registerPlugin, getPlugin, registerComponent, getComponent, getPlayer, options }
);

export default videojs;
