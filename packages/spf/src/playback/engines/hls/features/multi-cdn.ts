import type { Simplify } from '@videojs/utils/types';

import type {
  ResolveBehaviorConfig,
  ResolveBehaviorContext,
  ResolveBehaviorState,
} from '../../../../core/composition/define-behavior';
import { defineFeature } from '../../../../core/composition/define-feature';
import { deriveCdnPriority } from '../../../behaviors/derive-cdn-priority';
import { setupFailoverMonitor } from '../../../behaviors/setup-failover-monitor';

/** The behaviors the feature composes, in setup order. */
export const behaviors = [
  // Session-level CDN priority. Owns `cdnPriority`; `track-switching`'s
  // preferActiveCdn scope reads it so every type stays on one CDN.
  deriveCdnPriority,
  // CDN failover cooldown: owns the expiry half of failover — watches
  // `failedCdns` (tripped directly by track resolution on a failed
  // media-playlist fetch) and removes each CDN once its cooldown lapses.
  setupFailoverMonitor,
] as const;

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
 * Plays sources served from several CDNs (redundant streams): keeps every track type on one CDN, and fails over to the
 * next when a CDN fails, returning to it once its cooldown lapses. Single-CDN sources pass through unchanged.
 */
export const multiCdnFeature = defineFeature({ behaviors, defaultConfig, initialState });
