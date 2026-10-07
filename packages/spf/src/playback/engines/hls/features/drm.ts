import type { Simplify } from '@videojs/utils/types';

import type {
  ResolveBehaviorConfig,
  ResolveBehaviorContext,
  ResolveBehaviorState,
} from '../../../../core/composition/define-behavior';
import { defineFeature } from '../../../../core/composition/define-feature';
import { canPlayTrackWithDrm } from '../../../../media/dom/capabilities';
import { DEFAULT_KEY_SYSTEMS } from '../../../../media/dom/key-systems';
import type { DrmSystemsConfig } from '../../../../media/drm';
import { exchangeLicenses } from '../../../behaviors/dom/exchange-licenses';
import { setupMediaKeys } from '../../../behaviors/dom/setup-media-keys';
import type { resolveAudioTrack, resolveVideoTrack } from '../../../behaviors/resolve-track';
import {
  DEFAULT_AUDIO_CONSTRAINTS,
  DEFAULT_VIDEO_CONSTRAINTS,
  type switchAudioTrack,
  type SwitchAudioTrackRule,
  type switchVideoTrack,
  type SwitchVideoTrackRule,
} from '../../../behaviors/track-switching';
import { reportUnsupportedTrackConditionsWithDrm } from '../../../primitives/report-track-conditions';
import { excludeRefusedKeySystems } from '../../../primitives/selection-rules';

// Typed as the runtime shapes the behaviors read, so a caller's config can override them.
const noLicenseServers: DrmSystemsConfig = {};
// The literal tuple, so a config that omits `keySystems` is checked against the default systems' ids.
const defaultKeySystems: typeof DEFAULT_KEY_SYSTEMS = DEFAULT_KEY_SYSTEMS;
const drmAwareVideoConstraints: readonly SwitchVideoTrackRule[] = [
  ...DEFAULT_VIDEO_CONSTRAINTS,
  excludeRefusedKeySystems,
];
const drmAwareAudioConstraints: readonly SwitchAudioTrackRule[] = [
  ...DEFAULT_AUDIO_CONSTRAINTS,
  excludeRefusedKeySystems,
];

/** The behaviors the feature composes, in setup order. */
export const behaviors = [
  // `exchangeLicenses` precedes the negotiation it consumes, also
  // load-bearing: `createComposition` calls cleanups in registration order,
  // and the sessions it opens must close before `setupMediaKeys` detaches
  // the MediaKeys they belong to. Setup order costs nothing in return — its
  // precondition is reactive on `context.mediaKeys`.
  exchangeLicenses,
  setupMediaKeys,
] as const;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read. */
export type Config = ResolveBehaviorConfig<Behaviors>;
/** Every state key the behaviors and external signals declare. */
export type State = Simplify<ResolveBehaviorState<Behaviors>>;
/** Every context key the behaviors declare. */
export type Context = Simplify<ResolveBehaviorContext<Behaviors>>;

/**
 * This feature's behaviors plus the track switchers and resolvers, which read the DRM-aware probe, reporter, and
 * constraints.
 */
type ConfigReaders = readonly [
  ...Behaviors,
  typeof switchVideoTrack,
  typeof switchAudioTrack,
  typeof resolveVideoTrack,
  typeof resolveAudioTrack,
];

/** The config defaults the feature contributes. */
export const defaultConfig = {
  // No license servers configured is the degenerate DRM config: the DRM-aware
  // probe and reporter refuse encrypted renditions exactly as the DRM-less
  // `canPlayTrack` / `reportUnsupportedTrackConditions` pair does, and
  // `setupMediaKeys` reports SVTA 4008 for an encrypted source it can't serve.
  drm: noLicenseServers,
  keySystems: defaultKeySystems,
  canPlayTrack: canPlayTrackWithDrm,
  // The late half of DRM pruning, appended to each type's default pre-pass:
  // once negotiation publishes a refusal, encrypted renditions prune and the
  // emptied type reports its own verdict.
  videoConstraints: drmAwareVideoConstraints,
  audioConstraints: drmAwareAudioConstraints,
  reportUnsupportedTrackConditions: reportUnsupportedTrackConditionsWithDrm,
} satisfies Partial<ResolveBehaviorConfig<ConfigReaders>>;

/** The state values the feature seeds. */
export const initialState = {} satisfies Partial<State>;

/**
 * Plays DRM-protected content through Encrypted Media Extensions: negotiates a key system over the configured license
 * servers, attaches its MediaKeys, and exchanges licenses. Segment loading waits until a source is confirmed clear or
 * its MediaKeys attach.
 *
 * Requires writers of resolved, selected video or audio renditions, such as `videoFeature` and `audioFeature`; without
 * them, no source is ever confirmed clear and loading stays blocked.
 *
 * Replaces `canPlayTrack` and `reportUnsupportedTrackConditions` with DRM-aware versions, and sets DRM-aware video and
 * audio constraints. Compose it after the features that set the plain versions, such as `videoFeature` and
 * `audioFeature`, or theirs win and encrypted renditions are refused.
 */
export const drmFeature = defineFeature({ behaviors, defaultConfig, initialState });
