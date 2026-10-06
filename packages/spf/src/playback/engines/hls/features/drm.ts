import { defineFeature } from '../../../../core/composition/define-feature';
import { canPlayTrackWithDrm } from '../../../../media/dom/capabilities';
import { DEFAULT_KEY_SYSTEMS } from '../../../../media/dom/key-systems';
import type { DrmSystemsConfig } from '../../../../media/drm';
import { exchangeLicenses } from '../../../behaviors/dom/exchange-licenses';
import { setupMediaKeys } from '../../../behaviors/dom/setup-media-keys';
import {
  DEFAULT_AUDIO_CONSTRAINTS,
  DEFAULT_VIDEO_CONSTRAINTS,
  type SwitchAudioTrackRule,
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

/**
 * Plays DRM-protected content through Encrypted Media Extensions: negotiates a key system over the configured license
 * servers, attaches its MediaKeys, and exchanges licenses. Segment loading waits until a source is confirmed clear or
 * its MediaKeys attach.
 *
 * Replaces the playability probe, the unsupported-track reporter, and the video and audio constraints with DRM-aware
 * versions, so compose it after `videoFeature` and `audioFeature`.
 */
export const drmFeature = defineFeature({
  behaviors: [
    // `exchangeLicenses` precedes the negotiation it consumes, also
    // load-bearing: `createComposition` calls cleanups in registration order,
    // and the sessions it opens must close before `setupMediaKeys` detaches
    // the MediaKeys they belong to. Setup order costs nothing in return — its
    // precondition is reactive on `context.mediaKeys`.
    exchangeLicenses,
    setupMediaKeys,
  ],
  defaultConfig: {
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
  },
});
