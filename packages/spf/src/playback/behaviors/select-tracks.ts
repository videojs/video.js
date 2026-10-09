import { defineBehavior } from '../../core/composition/define-behavior';
import { createMachineReactor } from '../../core/reactors/create-machine-reactor';
import { computed, peek, type ReadonlySignal, type Signal } from '../../core/signals/primitives';
import type { Resolution } from '../../media/primitives/resolution';
import {
  type AudioSelectionConfig,
  byDescendingResolution,
  pickAudioTrackFromTracks,
  type TrackSelectionState,
  tracksUnderPixelArea,
} from '../../media/primitives/select-tracks';
import { isResolvedPresentation, type TrackType } from '../../media/types';
import { getTracksByType } from '../../media/utils/tracks';
import {
  applyConstraints,
  applyRules,
  type CapabilityConstraintConfig,
  excludeUnplayableTracks,
  type SelectionRule,
  sameCandidateSet,
} from '../primitives/selection-rules';
import { AUDIO_TYPE_CONFIG, VIDEO_TYPE_CONFIG } from '../primitives/track-types';

// ============================================================================
// Specialization helper
//
// `setupTrackSelection` has the same shape as a Behavior `setup` function:
// `({ state, config }) => Reactor`. Each `selectXTrack` export below calls
// it from inside its own `defineBehavior` setup, supplying its per-type
// `selectedKey`, track type, default rule chain, and forwarded config. The lifecycle
// — pick on entering 'presentation-resolved' if not already selected; clear
// on entering 'presentation-unresolved' — is shared.
// ============================================================================

type SelectedTrackKey = 'selectedVideoTrackId' | 'selectedAudioTrackId';

type SelectStateMap<K extends SelectedTrackKey> = {
  presentation: ReadonlySignal<TrackSelectionState['presentation']>;
} & { [P in K]: Signal<TrackSelectionState[P]> };

/** A selection rule over this behavior's candidate tracks. */
export type SelectTrackRule<Config> = SelectionRule<SelectableTrack, unknown, unknown, Config | undefined>;

/** What a rule here needs off a candidate: the id it may become the pick by. */
type SelectableTrack = { id: string };

interface TrackSelectionSetupConfig<K extends SelectedTrackKey, RuleConfig> {
  selectedKey: K;
  trackType: TrackType;
  constraints: readonly SelectTrackRule<RuleConfig>[];
  rules: readonly SelectTrackRule<RuleConfig>[];
  ruleConfig?: RuleConfig;
}

function setupTrackSelection<K extends SelectedTrackKey, RuleConfig>({
  state,
  config: { selectedKey, trackType, constraints, rules, ruleConfig },
}: {
  state: SelectStateMap<K>;
  config: TrackSelectionSetupConfig<K, RuleConfig>;
}) {
  const derivedStateSignal = computed(() =>
    isResolvedPresentation(state.presentation.get())
      ? ('presentation-resolved' as const)
      : ('presentation-unresolved' as const)
  );

  const deps = { state, config: ruleConfig };

  // The playable candidate set — the type's tracks after the hard-constraints
  // pre-pass. A `computed` so it re-evaluates when its inputs change, which is what
  // lets a *pinned* selection still notice it has gone unplayable: `resolve-track`
  // relabels the whole type's container from the first resolved media playlist,
  // long after `entry` made its pick under the fMP4 default.
  //
  // The `equals` gates notification on the set of track ids rather than array
  // identity, matching `setupTrackSwitching`'s. Segment appends and live reloads
  // both swap in a new presentation object carrying the same variants; without
  // this the effect below would re-run on every one of them.
  const candidateSet = computed(
    () => {
      const presentation = state.presentation.get();
      if (!isResolvedPresentation(presentation)) return [];

      return applyConstraints(constraints, getTracksByType(presentation, trackType), deps);
    },
    { equals: sameCandidateSet }
  );

  return createMachineReactor({
    initial: 'presentation-unresolved',
    monitor: () => derivedStateSignal.get(),
    states: {
      'presentation-unresolved': {},
      'presentation-resolved': {
        // Entry: pick a default on entering presentation-resolved if none
        // is set. External writes (user picks, ABR) that already populated
        // the slot are left alone.
        //
        // The returned cleanup runs on state exit — which fires on src
        // unload (presentation-resolved → presentation-unresolved) AND on
        // behavior destroy (presentation-resolved → destroying →
        // destroyed). Putting the clear here rather than as
        // presentation-unresolved.entry is more cohesive (operation +
        // cleanup co-located) and correctly covers destroy (destroy
        // doesn't pass through presentation-unresolved).
        entry: () => {
          if (!state[selectedKey].get()) {
            // `state.presentation.get()` is non-null inside this entry —
            // the reactor's `'presentation-resolved'` gate is exactly
            // `isResolvedPresentation(state.presentation.get())`, which
            // requires a truthy Presentation.
            //
            // Constraints prune the unplayable, then the chain narrows and ranks;
            // the pick is the head. An empty `rules` chain therefore selects the
            // first candidate, which falls out of the model rather than needing a
            // first-track code path of its own.
            const survivors = applyRules(rules, peek(candidateSet), deps);
            const id = survivors[0]?.id;

            if (id) state[selectedKey].set(id);
          }

          return () => state[selectedKey].set(undefined);
        },
        effects: [
          // Selection is `entry`'s alone — this only ever *de*selects. Keeping the
          // pick out of a reaction is what makes this the pinned variant rather
          // than a worse-spelled `switchVideoTrack`: nothing here re-ranks or moves
          // the pin. It has to be a reaction all the same, because what it watches
          // for is learned late — container and encryption come from a rendition's
          // media playlist, which resolves after the pick was made.
          //
          // Deliberately does *not* report why. Whatever made the pick unplayable
          // reported its own cause as the playlist resolved (1004 container, 4008
          // encryption, via `reportUnsupportedTrackConditions`), which is both more
          // specific than a verdict and already logged. The one condition no cause
          // covers is nothing being playable at all — no rendition resolved, so
          // none reported — which is why that alone emits here. See
          // `internal/design/spf/features/errors.md`.
          () => {
            // Untracked: writing the slot below must not re-enter this reaction.
            const selectedId = peek(state[selectedKey]);
            if (!selectedId) return;

            if (candidateSet.get().some((track) => track.id === selectedId)) return;

            // Only a pick the source actually offers is this behavior's to drop. An
            // id absent from the manifest was never selectable, and external writes
            // are left alone — see this module's header.
            const presentation = peek(state.presentation);

            if (
              isResolvedPresentation(presentation) &&
              getTracksByType(presentation, trackType).some((track) => track.id === selectedId)
            ) {
              state[selectedKey].set(undefined);
            }
          },
        ],
      },
    },
  });
}

// ============================================================================
// Default rules
//
// Each variant resolves its chains as `config?.[<TYPE>_TYPE_CONFIG.rulesKey] ??
// <default>` — per-type keys (`videoRules`, `audioRules`), because one engine
// config reaches every variant, read through the type bundle like the other
// per-type families. The whole behavior config is forwarded as the rules'
// `config`, so a policy rule reads its own options (`preferredAudioLanguage`)
// directly off it.
//
// Video's default is the *empty* chain: with no rule narrowing or reordering the
// candidates, the head is the first track — a consequence of the model rather than
// a first-track code path of its own.
// ============================================================================

/** Default video chain: none. The first candidate is the pick. */
const DEFAULT_VIDEO_RULES: readonly SelectTrackRule<SelectVideoTrackConfig>[] = [];

/**
 * Default audio chain: the three-tier policy (`preferredAudioLanguage` → `DEFAULT=YES` → first) as a single narrowing
 * rule. Returning `[]` when nothing is picked lets `applyRules` fall through to the unnarrowed candidates, so the head
 * stays the first track — the same last tier the policy itself ends on.
 */
const preferAudioPolicy: SelectTrackRule<SelectAudioTrackConfig> = (tracks, { config }) => {
  const id = pickAudioTrackFromTracks(tracks as readonly { id: string }[], config);
  const pick = tracks.find((track) => track.id === id);

  return pick ? [pick] : [];
};

const DEFAULT_AUDIO_RULES: readonly SelectTrackRule<SelectAudioTrackConfig>[] = [preferAudioPolicy];

/**
 * Order the candidates by resolution, largest first, with bandwidth breaking ties between renditions of identical
 * dimensions. The background-video default — that variant pins one rendition for the session, and absent a cap the
 * largest is the head.
 *
 * A ranker, so it reorders rather than narrowing: the chain's pick is the head of what it returns, which means ranking
 * never has to collapse to one track. Belongs last in a chain — a sort only reorders what survived the filters ahead of
 * it, and leaving it last is what lets `applyRules` early-bail before it runs.
 *
 * Exported because it is a _rule_, not a variant's private policy: the same one composes into `switchVideoTrack`'s
 * chain when a ranker is wanted there.
 */
export const preferHighestResolution: SelectTrackRule<unknown> = (tracks) => [...tracks].sort(byDescendingResolution);

/** What {@link screenResolutionCap} reads off the composition state. */
type ScreenResolutionRuleState = {
  screenResolution?: ReadonlySignal<Resolution | undefined>;
};

/**
 * Narrow to the renditions that fit the screen, by pixel area — the screen-size cap from
 * `internal/design/spf/features/rendition-selection-caps.md`, as a scope (soft filter) rather than a constraint: an
 * over-cap rendition is wasteful, not unplayable, so nothing here may make a source unplayable.
 *
 * Narrows only — it neither orders the survivors nor resolves the case where none survive, because `applyRules` owns
 * both. So it needs a ranker behind it to pick within the cap: `[screenResolutionCap, preferHighestResolution]` yields
 * the largest rendition that fits. Composed _last_, the pick would instead be whichever fitting rendition the manifest
 * happened to list first.
 *
 * Reading `state.screenResolution` through its signal is what subscribes a re-evaluating chain (`switchVideoTrack`) to
 * screen changes; `selectVideoTrack` pins the first answer instead, by design.
 *
 * Compares areas rather than matching a `"1080p"`-style tier because a tier only describes a rendition once you assume
 * its aspect ratio — the assumption that mis-measures an anamorphic ladder. See `media/dom/screen.ts`.
 *
 * Three ways the cap ends up not applying, all of them fall-through:
 *
 * - **No `screenResolution` signal at all**, because the composition omits `trackScreenResolution`. So composing the cap
 *   without its signal source is inert rather than broken.
 * - **A `screenResolution` of `undefined`**, meaning no screen to read. "Unknown" has to mean "don't cap": treating it as
 *   an area of zero would pin every source to its smallest rendition on exactly the environments we know least about.
 * - **No rendition fits**, on a screen smaller than the whole ladder. `applyRules` skips the empty result and the chain
 *   proceeds unnarrowed, so the ranker behind the cap decides — for `preferHighestResolution`, the largest rendition. A
 *   floor is the fix if that ever matters (`rendition-selection-caps.md` carries one), not a special case here.
 */
export const screenResolutionCap: SelectTrackRule<unknown> = (tracks, { state }) => {
  const screenResolution = (state as ScreenResolutionRuleState | undefined)?.screenResolution?.get();
  if (!screenResolution) return [];

  return tracksUnderPixelArea(tracks, screenResolution.width * screenResolution.height);
};

// ============================================================================
// Specialized exports — one per track type
// ============================================================================

/**
 * Config for `selectVideoTrack`. Pass `videoRules` to replace the selection chain, or `videoConstraints` to replace the
 * capability pre-pass; otherwise the chain is empty and the first playable candidate is the pick. Keyed per type, as
 * `switchVideoTrack`'s are, because one engine config reaches every variant.
 */
export interface SelectVideoTrackConfig extends CapabilityConstraintConfig {
  videoConstraints?: readonly SelectTrackRule<SelectVideoTrackConfig>[];
  videoRules?: readonly SelectTrackRule<SelectVideoTrackConfig>[];
}

/**
 * Default video constraints: the capability pre-pass alone. No `excludeFailedCdns` — this variant's compositions run no
 * failover monitor, so `failedCdns` has no writer and the constraint would always pass through.
 */
const DEFAULT_VIDEO_CONSTRAINTS: readonly SelectTrackRule<SelectVideoTrackConfig>[] = [excludeUnplayableTracks];

/**
 * **Default audio/video track selection on src load / unselect on src unload.** When a presentation is resolved, sets
 * `selectedVideoTrackId` / `selectedAudioTrackId` from a per-type default rule chain if no selection already exists.
 * When the presentation is unset/reset (transitions back to unresolved), clears the selection so a stale id from the
 * previous source doesn't persist.
 *
 * Lifecycle-driven: the pick fires once per transition, and nothing re-picks — that is what separates these from the
 * `switch*` variants. External writes (user picks, ABR, programmatic filter-driven re-picks) are left alone, including
 * a write naming a track the manifest never offered.
 *
 * The one thing policed between transitions is a pick the _constraints_ turn against: a rendition's container and
 * encryption are only known once its media playlist resolves, which is after the pick was made, so a selection that
 * becomes unplayable is dropped. Dropped, never moved — re-picking is exactly the behavior `switchVideoTrack` exists to
 * provide. Dropping reports nothing on its own, since whatever made the pick unplayable already reported its own, more
 * specific cause.
 *
 * Selection runs the same rule model `switchVideoTrack` does — a hard `constraints` pre-pass, then an ordered `rules`
 * chain, with the pick as the head (see `internal/design/spf/track-switching-model.md`). What differs is reactivity,
 * not the rules: this evaluates the chain once on resolve and pins the result, where `switchVideoTrack` re-evaluates
 * inside an effect so its rules subscribe to bandwidth and user selection. A rule written for one therefore composes
 * into the other unchanged.
 *
 * Both are config-driven, each per-type export wiring a sensible default: audio's three-tier language policy, and for
 * video the _empty_ chain — with nothing narrowing or reordering, the head is the first candidate. The behavior's
 * `config` is forwarded to the rules, so options like `preferredAudioLanguage` reach them without an intermediate
 * layer.
 *
 * Note a rule can only pick among real candidates, where the picker it replaced could return any id at all. An id
 * absent from the manifest was never selectable, so that narrowing is the point rather than a limitation.
 *
 * Compose `selectVideoTrack` for the simple "pick a default video track" behavior, or `switchVideoTrack`
 * (`./track-switching.ts`) for the ABR-driven variant. Compose `selectAudioTrack` for the simple default pick, or
 * `switchAudioTrack` (`./track-switching.ts`) for the filter-reactive + mid-stream-flush slot-owner variant — when
 * audio-abr lands, `switchAudioTrack` extends into `switchAudioQuality`. Compose only one per type — they're
 * alternatives, not stackable (each writes the same `selected*TrackId` slot). The simple variants tree-shake out the
 * heavier machinery (bandwidth estimator, quality selection, flush orchestration).
 *
 * Text selection has no simple variant here — it's owned by `switchTextTrack` (`./track-switching.ts`), which resolves
 * standing `userTextTrackSelection` intent against the constrained, CDN-scoped renditions.
 *
 * Select a video track when a presentation loads. Clears the selection on src unload.
 *
 * This is the simple, non-ABR counterpart to `switchVideoTrack` — compose one or the other, not both (both write
 * `selectedVideoTrackId`). Composing `selectVideoTrack` alone tree-shakes out the ABR code path (bandwidth-estimator,
 * quality-selection); use it for sources without meaningful quality variants, test setups, or players that
 * intentionally pin a quality.
 *
 * @example
 *   const reactor = selectVideoTrack.setup({ state });
 */
export const selectVideoTrack = defineBehavior({
  stateKeys: ['presentation', 'selectedVideoTrackId'],
  contextKeys: [],
  setup: ({ state, config }: { state: SelectStateMap<'selectedVideoTrackId'>; config?: SelectVideoTrackConfig }) =>
    setupTrackSelection({
      state,
      config: {
        selectedKey: VIDEO_TYPE_CONFIG.selectedKey,
        trackType: 'video',
        constraints: config?.[VIDEO_TYPE_CONFIG.constraintsKey] ?? DEFAULT_VIDEO_CONSTRAINTS,
        rules: config?.[VIDEO_TYPE_CONFIG.rulesKey] ?? DEFAULT_VIDEO_RULES,
        ruleConfig: config,
      },
    }),
});

/**
 * Config for `selectAudioTrack`. Pass `audioRules` to replace the selection chain, or `audioConstraints` to prune
 * candidates before it runs; otherwise the default three-tier policy applies (`preferredAudioLanguage` → `DEFAULT=YES`
 * → first).
 */
export interface SelectAudioTrackConfig extends AudioSelectionConfig {
  audioConstraints?: readonly SelectTrackRule<SelectAudioTrackConfig>[];
  audioRules?: readonly SelectTrackRule<SelectAudioTrackConfig>[];
}

/**
 * Select an audio track when a presentation loads. Clears the selection on src unload.
 *
 * This is the simple, lifecycle-only counterpart to `switchAudioTrack` (in `./track-switching.ts`) — compose one or the
 * other, not both (both write `selectedAudioTrackId`). `switchAudioTrack` adds filter-reactivity
 * (`userAudioTrackSelection`) and mid-stream-flush orchestration; `selectAudioTrack` covers the default-on-load case
 * without those. Use this variant for test setups, audio-only flows that don't expose language switching, or
 * composition variants that intentionally pin a track.
 *
 * @example
 *   const reactor = selectAudioTrack.setup({ state });
 *
 * @example
 *   // Language preference, honored by the default audio policy rule
 *   const reactor = selectAudioTrack.setup({
 *     state,
 *     config: { preferredAudioLanguage: 'en' },
 *   });
 */
export const selectAudioTrack = defineBehavior({
  stateKeys: ['presentation', 'selectedAudioTrackId'],
  contextKeys: [],
  setup: ({ state, config }: { state: SelectStateMap<'selectedAudioTrackId'>; config?: SelectAudioTrackConfig }) =>
    setupTrackSelection({
      state,
      config: {
        selectedKey: AUDIO_TYPE_CONFIG.selectedKey,
        trackType: 'audio',
        constraints: config?.[AUDIO_TYPE_CONFIG.constraintsKey] ?? [],
        rules: config?.[AUDIO_TYPE_CONFIG.rulesKey] ?? DEFAULT_AUDIO_RULES,
        ruleConfig: config,
      },
    }),
});
