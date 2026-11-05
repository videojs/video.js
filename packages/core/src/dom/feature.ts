import { createPlayerFeatureFactory, type PlayerFeatureFactory } from '../core/feature';
import type { PlayerTarget } from './player';

export { combinePlayerFeatureConfigs, setPlayerConfigValue } from '../core/feature';

/**
 * Define a player feature against the web target, including its `container`. A feature that only reads `media` should
 * use `definePlayerFeature` from `@videojs/core` instead, so it also composes into non-DOM players.
 *
 * @internal
 */
export const definePlayerFeature: PlayerFeatureFactory<PlayerTarget> = createPlayerFeatureFactory();
