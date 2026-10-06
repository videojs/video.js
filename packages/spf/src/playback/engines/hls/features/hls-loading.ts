import { defineFeature } from '../../../../core/composition/define-feature';
import { parseMultivariantPlaylist } from '../../../../media/hls/parse-multivariant';
import { resolvePresentation } from '../../../behaviors/resolve-presentation';

/** Fetches and parses the source's HLS multivariant playlist into the presentation the other features read. */
export const hlsLoadingFeature = defineFeature({
  behaviors: [resolvePresentation],
  defaultConfig: { parsePresentation: parseMultivariantPlaylist },
});
