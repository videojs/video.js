/**
 * The selection-rule substrate: the shape of a rule, and the two composers that turn a list of them into a pick.
 *
 * Lives here rather than beside `switchVideoTrack` so both track-selection behaviors can share rules. The simple
 * `selectVideoTrack` variant exists specifically to tree-shake the ABR path out, so importing a composer from
 * `behaviors/track-switching.ts` would drag the bandwidth estimator and quality selection back in with it. Nothing here
 * reaches past pure generics over a candidate list and small media-layer helpers, so either side can reach them
 * freely.
 *
 * See `internal/design/spf/track-switching-model.md` for the model these implement: a hard constraints pre-pass, then
 * an ordered chain of soft narrowing rules and rankers, with the pick as the first survivor.
 */

import type { ReadonlySignal } from '../../core/signals/primitives';
import { NO_KEY_SYSTEM } from '../../media/drm';
import { type CanPlayTrack, getMediaPlaylistMetadata, type ResolvedTrack } from '../../media/types';
import { getCodecFamilies, getCodecFamily } from '../../media/utils/tracks';

/**
 * Deps handed to each rule and to `applyRules`, mirroring a behavior's setup deps so a rule reads from the same
 * surfaces a behavior does. `context` is optional — it's threaded through but absent on direct setup calls (and unread
 * by today's rules), so the whole deps object can pass straight through.
 */
export interface SelectionRuleDeps<State = unknown, Context = unknown, Config = unknown> {
  state: State;
  context?: Context;
  config: Config;
}

/**
 * A selection rule narrows or reorders the candidate list. It reads the state, context, and config it needs at apply
 * time (tightly-coupled reads), so a rule's `.get()`s subscribe the running effect to exactly what it consulted.
 * Returning an empty list means "no match" — the composer skips it, so a soft filter never narrows the set to nothing.
 * A ranker returns the list with its pick at the head.
 */
export type SelectionRule<T, State = unknown, Context = unknown, Config = unknown> = (
  tracks: readonly T[],
  deps: SelectionRuleDeps<State, Context, Config>
) => readonly T[];

/**
 * Apply rules to a candidate list in order; the pick is the first survivor. Two responsibilities the rules don't carry:
 * a rule that returns nothing is skipped (fall-through — a preference never empties the set), and once one survivor
 * remains the chain stops (early-bail — later rules, including the bandwidth ranker, never run, so the effect doesn't
 * subscribe to their signals while the choice is fixed).
 *
 * @param rules - Rules to apply, most authoritative first
 * @param tracks - Candidate tracks
 * @param deps - The behavior's `{ state, context, config }`, passed through to each rule
 * @returns The surviving candidates, pick first
 */
export function applyRules<T, State, Context, Config>(
  rules: readonly SelectionRule<T, State, Context, Config>[],
  tracks: readonly T[],
  deps: SelectionRuleDeps<State, Context, Config>
): readonly T[] {
  let current = tracks;

  for (const rule of rules) {
    const remaining = rule(current, deps);
    if (remaining.length === 0) continue;

    current = remaining;

    if (current.length === 1) break;
  }

  return current;
}

/**
 * Apply hard constraints to a candidate list — the pre-pass that runs before the rule chain. A constraint shares a
 * rule's signature but its exclusion is _hard_: it removes the unplayable (a codec the environment can't decode, a CDN
 * in failover cooldown) and a removed track is never attempted. Unlike `applyRules`, this never skips an empty result
 * and never early-bails — every constraint always applies, and an empty survivor set is a real outcome ("nothing
 * playable here"), not a fall-through. Because each constraint only removes, the order they run in can't change which
 * tracks survive — though one that also _reports_ reads the list at its own position, so placement matters.
 *
 * @param constraints - Constraints to apply, in order
 * @param tracks - Candidate tracks
 * @param deps - The behavior's `{ state, context, config }`, passed to each constraint
 * @returns The playable survivors (possibly empty)
 */
export function applyConstraints<T, State, Context, Config>(
  constraints: readonly SelectionRule<T, State, Context, Config>[],
  tracks: readonly T[],
  deps: SelectionRuleDeps<State, Context, Config>
): readonly T[] {
  let current = tracks;

  for (const constraint of constraints) current = constraint(current, deps);

  return current;
}

/**
 * Whether two candidate sets hold the same tracks, by id.
 *
 * The `equals` both selection behaviors give their candidate-set `computed`. A live playlist refresh swaps in a new
 * presentation object carrying the same variants, and a constraint's own inputs can churn without changing which tracks
 * survive; in both cases the set is unchanged and the reaction must not re-fire. Compares by id rather than array
 * identity for exactly that.
 */
export function sameCandidateSet<T extends { id: string }>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((track) => b.some((other) => other.id === track.id));
}

/**
 * What {@link excludeUnplayableTracks} reads off the config it is handed.
 *
 * Read through a cast rather than constraining the rule's `Config` generic, the same way `screenResolutionCap` reads
 * `screenResolution` off its state: a rule composes into chains whose config types have nothing else in common, and
 * constraining the generic would make every one of those a weak-type mismatch. Each engine defaults `canPlayTrack` to
 * the DOM-bound probe; unwired means "no capability filtering" and the constraint passes everything through.
 */
export interface CapabilityConstraintConfig {
  /**
   * The codec capability probe `excludeUnplayableTracks` applies. Each engine defaults it to the DOM-bound probe;
   * unwired means no capability filtering.
   */
  canPlayTrack?: CanPlayTrack;
}

/**
 * Capability constraint — a _hard_ filter for the {@link applyConstraints} pre-pass. Removes renditions this
 * environment can't decode, probed via the injected `canPlayTrack` (codec → `MediaSource.isTypeSupported`, plus the
 * container and encryption assertions that probe can't make). Constraining here — before selection — means an
 * unplayable variant is pruned upstream and never picked, instead of surviving into the pipeline to fail late at
 * `createSourceBuffer`. That late throw stays as a defensive structural guarantee; with this constraint it should
 * rarely fire.
 *
 * Lives here rather than beside `switchVideoTrack` for the reason this module exists: both the re-evaluating variant
 * and the pinned `selectVideoTrack` apply it, and reaching it through `behaviors/track-switching.ts` would drag the ABR
 * path into a composition that deliberately omits it.
 *
 * The probe is handed the whole config alongside each track, so an extended probe reads the props it defines off it
 * rather than closing over them — `canPlayTrackWithDrm` reads `drm` and `keySystems` that way.
 *
 * Passes everything through when there's no probe (a composition that didn't wire one, or DOM-free tests). When it
 * prunes _every_ track, the empty result is preserved (per `applyConstraints`) — "nothing playable" — which each
 * consuming behavior answers by clearing its selection; reporting the verdict is separate.
 */
export function excludeUnplayableTracks<T, State, Context, Config>(
  tracks: readonly T[],
  { config }: SelectionRuleDeps<State, Context, Config>
): readonly T[] {
  const canPlayTrack = (config as CapabilityConstraintConfig | undefined)?.canPlayTrack;
  if (!canPlayTrack) return tracks;

  return tracks.filter((track) => canPlayTrack(track as Parameters<CanPlayTrack>[0], config));
}

/**
 * Refused-key-system constraint — a _hard_ filter for the {@link applyConstraints} pre-pass. Removes encrypted
 * renditions once negotiation has come back empty-handed.
 *
 * The late half of DRM pruning. `canPlayTrack`'s DRM variant already drops encrypted renditions no _configured_ key
 * system serves, but it runs before the CDM has been asked, so a rendition naming a configured license server survives
 * it and only negotiation reveals the CDM is absent. This constraint is that answer arriving: with `NO_KEY_SYSTEM`
 * published, no encrypted rendition can decode, whatever it declares.
 *
 * Reporting is deliberately not here. Pruning to empty is what `track-switching` already reports as
 * `SVTA_NO_SUPPORTED_{VIDEO,AUDIO}_TRACK`, so the verdict stays its owner's — a type keeping any clear rendition is
 * unaffected and reports nothing, exactly as before. `setupMediaKeys` still reports the _cause_ (4008).
 *
 * `negotiatedKeySystem` is read through a cast for the same reason `screenResolutionCap` reads `screenResolution`: the
 * slot exists only in DRM compositions, and constraining the rule's `State` generic would make every chain that doesn't
 * carry it a weak-type mismatch. Read reactively, so publishing the sentinel re-fires the chain.
 */
export function excludeRefusedKeySystems<T, State, Context, Config>(
  tracks: readonly T[],
  { state }: SelectionRuleDeps<State, Context, Config>
): readonly T[] {
  const negotiated = (state as { negotiatedKeySystem?: ReadonlySignal<string | undefined> }).negotiatedKeySystem;
  if (negotiated?.get() !== NO_KEY_SYSTEM) return tracks;

  return tracks.filter((track) => !getMediaPlaylistMetadata(track as ResolvedTrack)?.encrypted);
}

/**
 * What {@link preferCodecFamilies} reads off the config it is handed — a cast view, for the same reason as
 * {@link CapabilityConstraintConfig}.
 */
export interface CodecPreferenceConfig {
  preferredCodecs?: string[];
}

/**
 * The codec families {@link preferCodecFamilies} narrows to when the config carries no `preferredCodecs`: AVC (both its
 * 4CCs) and AAC. The default is deliberate rather than neutral — SPF implements no `SourceBuffer.changeType()`, so on a
 * mixed-codec source the _initial_ family choice is the one ABR lives inside for the whole source (see
 * `stickToSelectedCodecs` in `behaviors/track-switching.ts`), and AVC/AAC is the family pair with the broadest decode
 * support. The cost, equally deliberate: on a ladder whose higher rungs are HEVC-only (a common 4K shape), the default
 * caps quality at the top AVC rung — configure `preferredCodecs` (or pass `[]`) to trade the other way.
 */
export const DEFAULT_PREFERRED_CODECS: readonly string[] = ['avc1', 'avc3', 'mp4a'];

/**
 * Codec-family preference — a _soft_ filter (scope) for a selection-rule chain; the `hevc-variant-selection` concern
 * from `internal/design/spf/track-switching-model.md`. Narrows to the tracks whose codec families are all in
 * `preferredCodecs` (family-compared, so entries may be 4CCs or full codec strings). Soft-filter semantics: a source
 * with no preferred-family rendition (an HEVC-only ladder under the AVC default) is left unnarrowed, and a track
 * without codecs never matches — on a ladder with no codecs anywhere (DOM-free tests) the rule is inert.
 *
 * `preferredCodecs` defaults to {@link DEFAULT_PREFERRED_CODECS}; explicitly pass `[]` to disable the preference while
 * keeping the rule composed.
 *
 * "All families" rather than "any" so a muxed rendition is judged as the unit it is: `hvc1,mp4a` must not count as
 * preferred just because its audio half matches.
 *
 * Lives here rather than beside `switchVideoTrack` for the module's usual reason: the pinned `selectVideoTrack` variant
 * can compose it without dragging the ABR path in.
 */
export function preferCodecFamilies<T, State, Context, Config>(
  tracks: readonly T[],
  { config }: SelectionRuleDeps<State, Context, Config>
): readonly T[] {
  const preferred = (config as CodecPreferenceConfig | undefined)?.preferredCodecs ?? DEFAULT_PREFERRED_CODECS;
  if (!preferred.length) return tracks;

  const preferredFamilies = new Set(preferred.map(getCodecFamily));

  return tracks.filter((track) => {
    const families = getCodecFamilies(track as { codecs?: string[] });

    return !!families && families.every((family) => preferredFamilies.has(family));
  });
}
