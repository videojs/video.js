import { createPlayerFeatureFactory, type PlayerFeatureFactory } from '@videojs/core';

import type { NativePlayerTarget } from './native-player-target';

/**
 * Define a player feature against the react-native target. A feature that works from `media` alone should use
 * `definePlayerFeature` from `@videojs/core` instead, so web players can compose it too.
 *
 * @internal
 */
export const defineNativePlayerFeature: PlayerFeatureFactory<NativePlayerTarget> = createPlayerFeatureFactory();
