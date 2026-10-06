import { defineFeature } from '../../../../core/composition/define-feature';
import { deriveSharedMinStartMediaTime, establishStartMediaTime } from '../../../behaviors/establish-start-media-time';
import { relocationPipelinesFor } from '../../../primitives/relocation-pipelines';

/**
 * Plays HLS content whose segment timestamps don't start at zero, by shifting them onto the playlist's zero-based
 * timeline. Without it, such content strands the playhead outside the buffered ranges; content that starts at zero
 * doesn't need it. Text cues shift with `shiftTextTimestampsFeature`, composed alongside it and `textTracksFeature`.
 */
export const shiftTimestampsFeature = defineFeature({
  behaviors: [establishStartMediaTime],
  defaultConfig: {
    // The coordination seam the reactor (model `startMediaTime`) and the
    // loader stamps (buffer `timestampOffset`) both read from config, so they
    // apply the SAME derive. Shared-`min` across selected A/V (subsumes
    // per-type).
    deriveStartMediaTime: deriveSharedMinStartMediaTime,
    // The discover/stamp steps `establishStartMediaTime` pairs with.
    videoMessagePipelines: relocationPipelinesFor('video'),
    audioMessagePipelines: relocationPipelinesFor('audio'),
  },
});
