import { defineFeature } from '../../../../core/composition/define-feature';
import { canPlayTrack } from '../../../../media/dom/capabilities';
import { SVTA_NO_SUPPORTED_VIDEO_TRACK } from '../../../../media/errors';
import { reportAbsentTrackType } from '../../../behaviors/collect-errors';
import { loadVideoSegments } from '../../../behaviors/dom/load-segments';
import { setupVideoBufferActors } from '../../../behaviors/dom/setup-buffer-actors';
import { trackScreenResolution } from '../../../behaviors/dom/track-screen-resolution';
import { resolveVideoTrack } from '../../../behaviors/resolve-track';
import {
  preferHighestResolution,
  type SelectVideoTrackConfig,
  screenResolutionCap,
  selectVideoTrack,
} from '../../../behaviors/select-tracks';
import { reportUnsupportedTrackConditions } from '../../../primitives/report-track-conditions';
import { excludeUnplayableTracks } from '../../../primitives/selection-rules';

// Prune what this environment can't decode, then report 2011 if nothing is left: this engine composes only video, so a
// source with none playable can never play.
// SAFETY: `reportAbsentTrackType` also reads the optional `errors` state, which the config's rule type doesn't
// declare; `collectErrors` provides it in this composition, and the rule no-ops without it.
const videoConstraints = [excludeUnplayableTracks, reportAbsentTrackType(SVTA_NO_SUPPORTED_VIDEO_TRACK)] as NonNullable<
  SelectVideoTrackConfig['videoConstraints']
>;
// Narrow to the renditions that fit the screen, then take the largest.
const videoRules: NonNullable<SelectVideoTrackConfig['videoRules']> = [screenResolutionCap, preferHighestResolution];

/**
 * Plays one video rendition for the whole session: the largest that fits the screen, picked once rather than adapted to
 * bandwidth. For ambient, hero, and GIF-replacement video. Reports when no rendition is playable.
 */
export const backgroundVideoFeature = defineFeature({
  behaviors: [selectVideoTrack, resolveVideoTrack, setupVideoBufferActors, loadVideoSegments, trackScreenResolution],
  defaultConfig: { videoConstraints, videoRules, canPlayTrack, reportUnsupportedTrackConditions },
});
