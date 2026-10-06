import { defineFeature } from '../../../../core/composition/define-feature';
import { trackLoadTriggers } from '../../../behaviors/dom/track-load-triggers';
import { syncPreload } from '../../../behaviors/sync-preload';

/**
 * Defers loading until the media element's `preload` allows it or the user plays or seeks, mirroring native
 * `HTMLMediaElement` preload behavior. Syncs `preload` between the element and state, and activates loading on the
 * first `play` or `seeking` for each source.
 *
 * Without it, a composition loads the moment a source is set; seed `loadActivated: true` in its initial state, as the
 * background-video engine does. The two behaviors compose together: syncing `preload` without the load triggers would
 * leave `preload="none"` and `"metadata"` sources unable to load on play.
 */
export const initialLoadFeature = defineFeature({
  behaviors: [syncPreload, trackLoadTriggers],
});
