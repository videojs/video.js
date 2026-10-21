/**
 * **Per-type config bundles for per-type behavior variants.**
 *
 * Each `*_TYPE_CONFIG` constant names the per-type keys that per-type-variant setup-shape helpers consume. Variants
 * reference the shared constant at their `defineBehavior` setup body rather than constructing the config inline, so the
 * per-type identity (which state key, which context key, which discriminant) lives in one place per type.
 *
 * Every entry is a generic-name-to-type-specific-name mapping, and the target object varies: `selectedKey` names a
 * state key, `actorKey` / `loaderKey` a context key, and the `*Key` entries for config facets (`constraintsKey`,
 * `rulesKey`, `messagePipelinesKey`) name the per-type **engine config** key a variant reads into its helper's generic
 * one — `config[VIDEO_TYPE_CONFIG.constraintsKey]` feeds `constraints`, the way rules read `state[config.selectedKey]`.
 * One engine config reaches every variant, so the per-type key is what keeps video's chain out of audio's. The bundle
 * carries the key, never the default: `videoRules` and `audioRules` fall back differently, so `?? DEFAULT_…` stays
 * beside each variant.
 *
 * Variants spread their composition-time `config` over the defaults so engines can layer composition-supplied additions
 * on top (e.g. a custom fetch closure, a non-default segment resolver). Defaults first, engine config second.
 *
 * Helpers continue to consume their slice via the existing typed-key generics (`<K extends SelectedTrackKey>` etc.);
 * the extra fields on the config object (carrying facets other helpers care about) are fine under structural typing.
 */

/**
 * Type-identity bundle for video-track-typed behaviors.
 *
 * @see setupVideoBufferActors, loadVideoSegments
 */
export const VIDEO_TYPE_CONFIG = {
  type: 'video',
  selectedKey: 'selectedVideoTrackId',
  userSelectionKey: 'userVideoTrackSelection',
  actorKey: 'videoBufferActor',
  loaderKey: 'videoSegmentLoaderActor',
  constraintsKey: 'videoConstraints',
  rulesKey: 'videoRules',
  messagePipelinesKey: 'videoMessagePipelines',
} as const;

/**
 * Type-identity bundle for audio-track-typed behaviors.
 *
 * @see setupAudioBufferActors, loadAudioSegments
 */
export const AUDIO_TYPE_CONFIG = {
  type: 'audio',
  selectedKey: 'selectedAudioTrackId',
  userSelectionKey: 'userAudioTrackSelection',
  actorKey: 'audioBufferActor',
  loaderKey: 'audioSegmentLoaderActor',
  constraintsKey: 'audioConstraints',
  rulesKey: 'audioRules',
  messagePipelinesKey: 'audioMessagePipelines',
} as const;

/**
 * Type-identity bundle for text-track-typed behaviors. Text tracks have no `SourceBufferActor` (MSE doesn't apply), so
 * this bundle omits `actorKey`, and no user-selection key in the video/audio sense (`switchTextTrack` resolves standing
 * intent through its own terminal), so it omits `userSelectionKey`. The `loaderKey` points at the
 * text-track-segment-loader actor (a `MessageActor` with continue-vs-preempt semantics, parallel to v/a's
 * `SegmentLoaderActor`).
 *
 * @see loadTextTrackSegments, setupTextTrackActors
 */
export const TEXT_TYPE_CONFIG = {
  type: 'text',
  selectedKey: 'selectedTextTrackId',
  loaderKey: 'textTrackSegmentLoaderActor',
  constraintsKey: 'textConstraints',
  rulesKey: 'textRules',
  messagePipelinesKey: 'textMessagePipelines',
} as const;
