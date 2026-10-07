import type { Simplify } from '@videojs/utils/types';

import {
  type ResolveBehaviorConfig,
  type ResolveBehaviorContext,
  type ResolveBehaviorState,
} from '../../../../core/composition/create-composition';
import { defineFeature } from '../../../../core/composition/define-feature';
import { parseMultivariantPlaylist } from '../../../../media/hls/parse-multivariant';
import { resolvePresentation } from '../../../behaviors/resolve-presentation';

/** The behaviors the feature composes, in setup order. */
export const behaviors = [resolvePresentation] as const;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read. */
export type Config = ResolveBehaviorConfig<Behaviors>;
/** Every state key the behaviors and external signals declare. */
export type State = Simplify<ResolveBehaviorState<Behaviors>>;
/** Every context key the behaviors declare. */
export type Context = Simplify<ResolveBehaviorContext<Behaviors>>;

/** The config defaults the feature contributes. */
export const defaultConfig = { parsePresentation: parseMultivariantPlaylist } satisfies Partial<Config>;

/** The state values the feature seeds. */
export const initialState = {} satisfies Partial<State>;

/** Fetches and parses the source's HLS multivariant playlist into the presentation the other features read. */
export const hlsLoadingFeature = defineFeature({ behaviors, defaultConfig, initialState });
