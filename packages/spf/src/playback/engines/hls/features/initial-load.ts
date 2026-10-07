import type { Simplify } from '@videojs/utils/types';

import {
  type ResolveBehaviorConfig,
  type ResolveBehaviorContext,
  type ResolveBehaviorState,
} from '../../../../core/composition/create-composition';
import { defineFeature } from '../../../../core/composition/define-feature';
import { trackLoadTriggers } from '../../../behaviors/dom/track-load-triggers';
import { syncPreload } from '../../../behaviors/sync-preload';

/** The behaviors the feature composes, in setup order. */
export const behaviors = [syncPreload, trackLoadTriggers] as const;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read. */
export type Config = ResolveBehaviorConfig<Behaviors>;
/** Every state key the behaviors and external signals declare. */
export type State = Simplify<ResolveBehaviorState<Behaviors>>;
/** Every context key the behaviors declare. */
export type Context = Simplify<ResolveBehaviorContext<Behaviors>>;

/** The config defaults the feature contributes. */
export const defaultConfig = {} satisfies Partial<Config>;

/** The state values the feature seeds. */
export const initialState = {} satisfies Partial<State>;

/**
 * Defers loading until the media element's `preload` allows it or the user plays or seeks, mirroring native
 * `HTMLMediaElement` preload behavior. Syncs `preload` between the element and state, and activates loading on the
 * first `play` or `seeking` for each source.
 *
 * Without it, a composition loads the moment a source is set; seed `loadActivated: true` in its initial state, as the
 * background-video engine does. The two behaviors compose together: syncing `preload` without the load triggers would
 * leave `preload="none"` and `"metadata"` sources unable to load on play.
 */
export const initialLoadFeature = defineFeature({ behaviors, defaultConfig, initialState });
