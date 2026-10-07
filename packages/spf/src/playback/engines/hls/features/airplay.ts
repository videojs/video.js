import type { Simplify } from '@videojs/utils/types';

import {
  type ResolveBehaviorConfig,
  type ResolveBehaviorContext,
  type ResolveBehaviorState,
} from '../../../../core/composition/create-composition';
import { defineExternalSignals } from '../../../../core/composition/define-external-signals';
import { defineFeature } from '../../../../core/composition/define-feature';
import { attachMediaSourceAsSourceElement } from '../../../../media/dom/mse/mediasource-setup';
import { type DisableRemotePlaybackState, setupAirPlay } from '../../../behaviors/dom/airplay';
import type { setupMediaSource } from '../../../behaviors/dom/setup-mediasource';

/** The behaviors the feature composes, in setup order. */
export const behaviors = [
  setupAirPlay,
  defineExternalSignals<DisableRemotePlaybackState>()({ state: ['disableRemotePlayback'] }),
] as const;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read. */
export type Config = ResolveBehaviorConfig<Behaviors>;
/** Every state key the behaviors and external signals declare. */
export type State = Simplify<ResolveBehaviorState<Behaviors>>;
/** Every context key the behaviors declare. */
export type Context = Simplify<ResolveBehaviorContext<Behaviors>>;

/** This feature's behaviors plus `setupMediaSource`, which reads `attachMediaSource`. */
type ConfigReaders = readonly [...Behaviors, typeof setupMediaSource];

/** The config defaults the feature contributes. */
export const defaultConfig = { attachMediaSource: attachMediaSourceAsSourceElement } satisfies Partial<
  ResolveBehaviorConfig<ConfigReaders>
>;

/** The state values the feature seeds. */
export const initialState = {} satisfies Partial<State>;

/**
 * Plays to AirPlay receivers (WebKit only; inert elsewhere), unless the user sets `disableRemotePlayback`. Attaches the
 * MediaSource through a `<source>` element, which the native fallback the receiver plays requires.
 *
 * Requires a writer of `context.mediaSource`, such as `mediaSourceFeature`; without one, AirPlay is never offered.
 */
export const airPlayFeature = defineFeature({ behaviors, defaultConfig, initialState });
