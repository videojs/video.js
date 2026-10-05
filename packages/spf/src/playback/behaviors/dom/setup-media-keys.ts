/**
 * **Negotiate a key system and attach its MediaKeys for the current source.** Once an encrypted rendition has resolved
 * against a media element, negotiate one composed key system over the configured license servers, apply its server
 * certificate when it configures one, and attach the resulting MediaKeys — so licensing can begin. Encrypted segment
 * loads are gated until the attach lands, and the outcome is published for pruning and licensing to react to: the
 * chosen system, or {@link NO_KEY_SYSTEM} for a refusal.
 *
 * Licensing is `exchangeLicenses`' job, not this behavior's. The handoff is `context.mediaKeys` +
 * `state.negotiatedKeySystem`, both published only once the certificate has been applied and the attach has resolved —
 * which is what carries the "certificate before `generateRequest`" ordering across the boundary.
 *
 * The negotiation is the minimal key-system probe — capability-probing's full async probe supersedes it when that lands
 * — over per-system init-data types and the declared encryption scheme. The `segmentLoadingBlocked` load gate is raised
 * synchronously at setup and for each new source, and lowered once it's confirmed clear or MediaKeys attach: appending
 * encrypted data with no MediaKeys attached misbehaves on Chromium, so the segment-load dispatchers park while the gate
 * is up (see `load-segments.ts`), whatever order a composition lists them in — but lowered on _attach_, not on license:
 * the appends that follow are what fire `encrypted` for the event-driven path, and browsers queue decode on missing
 * keys. Failures report onto the errors sequence via `emitError` (SVTA 4008 no usable key system, 99408 the source is
 * non-DRM clear-key encryption we can't decrypt, 4010 MediaKeys init, 4013 certificate); a refused negotiation or
 * failed certificate leaves the gate up — playback stays parked rather than failing decode, and severity is the
 * adapter's call. A refusal publishes {@link NO_KEY_SYSTEM}, which is what lets rendition pruning reach the verdict
 * `track-switching` owns.
 *
 * Single-positive-state reactor riding the resolver's resolved/unresolved lifecycle, like `setupMediaSource`. The EME
 * pipeline runs as one `Task` under a runner the reactor owns — the same shape as `setupTrackResolution` — so source
 * replacement routes through `'preconditions-unmet'`, whose state-exit cleanup aborts the task structurally, clears the
 * slots, and detaches MediaKeys (`setMediaKeys(null)`) before the next source's setup runs. Teardown-per-source is
 * deliberate — MediaKeys re-use across sources is an optimization with prior art (see drm-support.md).
 *
 * A live AirPlay session routes through that same exit. Playback moves off MSE onto the native-HLS fallback `<source>`
 * the receiver plays, and the MediaKeys negotiated here cannot serve the `skd` requests it raises — so an observed
 * `loadingSuspended` yields the element, and `setupAirPlayFairPlay` negotiates for the receiver in the gap. The falling
 * edge re-enters and re-negotiates with no extra machinery.
 *
 * Sole writer of `context.mediaKeys`, `state.negotiatedKeySystem`, and `state.segmentLoadingBlocked`. Composed into the
 * HLS video engine's `createEngine` unconditionally today; on a clear source it never negotiates, just lowering the
 * gate once it's clear. A composition that omits it — along with `exchangeLicenses` and the two DRM-aware config
 * defaults — carries neither the machinery nor the slots, and none of this file's key-system code survives
 * tree-shaking; the DRM-free engine variant that would do so is tracked in drm-support.md.
 *
 * Still out of scope (tracked in drm-support.md): mid-stream key rotation on live Widevine / PlayReady reloads (VOD
 * rotation and FairPlay rotation are covered — see `exchangeLicenses`), and `keystatuschange` reactivity.
 */
import { defineBehavior } from '../../../core/composition/create-composition';
import type { KeyedBy } from '../../../core/composition/keyed-by';
import type { Reactor } from '../../../core/reactors/create-machine-reactor';
import { createMachineReactor } from '../../../core/reactors/create-machine-reactor';
import { computed, type ReadonlySignal, type Signal } from '../../../core/signals/primitives';
import { RecurringRunner, runOnce, Task } from '../../../core/tasks/task';
import {
  attachMediaKeys,
  type DrmSystemConfig,
  declaredDrmKeys,
  declaredEncryptionScheme,
  fetchServerCertificate,
  type KeySystemModule,
  keySystemCandidates,
  NO_KEY_SYSTEM,
  requestKeySystemAccess,
  resolveDrmUrl,
  unsupportedEncryptionMethodCause,
} from '../../../media/dom/eme';
import {
  SVTA_DRM_CERTIFICATE_ERROR,
  SVTA_DRM_INITIALIZATION_ERROR,
  SVTA_UNSUPPORTED_DRM_SYSTEM,
} from '../../../media/errors';
import {
  isResolvedPresentation,
  isResolvedTrack,
  type MaybeResolvedPresentation,
  type Presentation,
} from '../../../media/types';
import { getTracksByType, mimeCodecsByType } from '../../../media/utils/tracks';
import { type ErrorEmitterState, emitError } from '../collect-errors';

/** State shape for MediaKeys setup. */
export interface MediaKeysState {
  presentation?: MaybeResolvedPresentation;
  /** Segment-load gate; semantics on `SegmentLoadingState['segmentLoadingBlocked']`. */
  segmentLoadingBlocked?: boolean;
  /**
   * The key system negotiation settled on for the current source, or `undefined` when none has been (yet, or at all).
   *
   * The negotiation outcome as _state_, not just as the private detail it once was: `exchangeLicenses` keys its
   * per-system message shaping and license-server lookup off it, and it is the late fact rendition pruning can't
   * otherwise learn — pruning runs before the CDM has been asked, so a rendition naming a configured server survives it
   * and only negotiation reveals the CDM is absent.
   */
  negotiatedKeySystem?: string;
}

/** Context shape for MediaKeys setup. */
export interface MediaKeysContext {
  mediaElement?: HTMLMediaElement | undefined;
  mediaKeys?: MediaKeys;
}

/**
 * License servers keyed by EME key-system id, where each id must be one of the composition's `keySystems`: an entry for
 * a system no composed module claims can never be negotiated, so a composition's config rejects it.
 */
export type NegotiableDrmSystemsConfig = KeyedBy<'keySystems', 'keySystem', DrmSystemConfig>;

/** Config for MediaKeys setup. */
export interface MediaKeysSetupConfig {
  /**
   * License servers keyed by EME key-system id — `source.drm`'s shape, limited to the composed key systems. Required:
   * license URLs are intrinsically source- or provider-specific, so no default exists; the DRM engine variant supplies
   * it.
   */
  drm: NegotiableDrmSystemsConfig;
  /**
   * The key systems this composition can negotiate, most-preferred first. Required for the same reason `drm` is: which
   * systems an engine carries is a composition decision, and each module dropped from the list drops its own
   * negotiation, init-data, and license-shaping code with it.
   */
  keySystems: readonly KeySystemModule[];
}

// The exact keyed maps keep `defineBehavior`'s stateKeys ≡ keyof inference
// intact — as type aliases, not interfaces: the inference goes through an
// index-signature constraint that only aliases satisfy implicitly. The reporter
// seam (`errors`, optional per `ErrorEmitterState`) is deliberately not in the
// typed slice — the setup helper accepts the map without it, and the live slot
// reaches it at runtime when `collectErrors` is composed. Same shape as
// `resolve-track`.
type MediaKeysStateMap = {
  presentation: ReadonlySignal<MediaKeysState['presentation']>;
  segmentLoadingBlocked: Signal<MediaKeysState['segmentLoadingBlocked']>;
  negotiatedKeySystem: Signal<MediaKeysState['negotiatedKeySystem']>;
};

type MediaKeysContextMap = {
  mediaElement: ReadonlySignal<MediaKeysContext['mediaElement']>;
  mediaKeys: Signal<MediaKeysContext['mediaKeys']>;
};

type MediaKeysFsmState = 'preconditions-unmet' | 'source-clear' | 'media-keys-required';

/** What a settled negotiation publishes: the chosen system, and the MediaKeys attached for it. */
interface Negotiation {
  keySystem: string;
  mediaKeys: MediaKeys;
}

/**
 * The EME pipeline for one source, as a task body: negotiate → create MediaKeys → certificate → attach → publish.
 *
 * Runs under the task's `signal`. The certificate fetch takes it directly; the EME calls cannot, so each is followed by
 * a check at the next commit point — an aborted run reports nothing, attaches nothing, and publishes nothing, and an
 * attach that landed as the abort arrived is undone on the spot. A refusal or a certificate failure reports its cause
 * and returns, leaving the gate up; anything else rejects for the caller to report as 4010.
 */
async function negotiateMediaKeys({
  mediaElement,
  presentation,
  signal,
  state,
  config,
  publish,
}: {
  mediaElement: HTMLMediaElement;
  presentation: MaybeResolvedPresentation;
  signal: AbortSignal;
  state: Pick<MediaKeysStateMap, 'negotiatedKeySystem'> & ErrorEmitterState;
  config: MediaKeysSetupConfig;
  publish: (negotiation: Negotiation) => void;
}): Promise<void> {
  const keys = declaredDrmKeys(presentation);
  const candidates = keySystemCandidates(keys, config.drm, config.keySystems);
  const negotiated = await requestKeySystemAccess(
    candidates,
    mimeCodecsByType(presentation),
    declaredEncryptionScheme(keys)
  );

  if (signal.aborted) return;

  if (!negotiated) {
    // Gate stays up: parked playback beats guaranteed decode failure. Severity
    // is the adapter's call, per errors.md. Name the real gap: with no candidate
    // at all the source may be clear-key encrypted — not EME — which the shared
    // cause helper names as an unsupported encryption method (clear-key-aes.md);
    // a declared-but-unlicensable or refused DRM system reports 4008.
    const nonDrmCause = candidates.length === 0 ? unsupportedEncryptionMethodCause(keys) : undefined;

    emitError(
      state,
      nonDrmCause ?? {
        code: SVTA_UNSUPPORTED_DRM_SYSTEM,
        data: { keySystems: candidates.map((module_) => module_.keySystem) },
      }
    );

    // Cause reported; the verdict is `track-switching`'s. Publishing the refusal
    // re-fires its constraint chain, where `excludeRefusedKeySystems` prunes
    // every encrypted rendition — so a type left with nothing reports
    // SVTA_NO_SUPPORTED_{VIDEO,AUDIO}_TRACK from its owner, and a type keeping a
    // clear one still reports nothing. Set after the cause so the sequence
    // reads cause-then-verdict.
    state.negotiatedKeySystem.set(NO_KEY_SYSTEM);
    return;
  }

  const { keySystem } = negotiated.module;
  const entry = config.drm[keySystem]!;
  const mediaKeys = await negotiated.access.createMediaKeys();

  // FairPlay can't generate a license request without the server (application)
  // certificate, so its failure parks the source like an unusable key system
  // rather than proceeding to certain failure. Skipped entirely when no
  // certificate URL resolves.
  const certificateUrl = resolveDrmUrl(entry.serverCertificateUrl);

  if (certificateUrl !== undefined) {
    try {
      await mediaKeys.setServerCertificate(
        await fetchServerCertificate(negotiated.module, entry, certificateUrl, signal)
      );
    } catch (error) {
      if (signal.aborted) return;

      emitError(state, { code: SVTA_DRM_CERTIFICATE_ERROR, data: { keySystem, reason: String(error) } });
      return;
    }
  }

  if (signal.aborted) return;

  await attachMediaKeys(mediaElement, mediaKeys);

  if (signal.aborted) {
    attachMediaKeys(mediaElement, null).catch(() => {});
    return;
  }

  publish({ keySystem, mediaKeys });
}

function setupMediaKeysSetup({
  state,
  context,
  config,
}: {
  state: MediaKeysStateMap &
    ErrorEmitterState & {
      // Optional so the one behavior composes across video-only / audio-only / both,
      // like other cross-track-type behaviors (present at runtime iff a sibling owns it).
      selectedVideoTrackId?: ReadonlySignal<string | undefined>;
      selectedAudioTrackId?: ReadonlySignal<string | undefined>;
    };
  context: MediaKeysContextMap;
  config: MediaKeysSetupConfig;
}): Reactor<MediaKeysFsmState | 'destroying' | 'destroyed'> {
  // One negotiation per source, aborted structurally on state exit. `runOnce`,
  // because there is no recurrence: a source is negotiated once, and a re-entry
  // schedules a fresh task.
  const runner = new RecurringRunner<void>(runOnce);

  // `loadingSuspended` is observed, never declared: the slot exists only where
  // a feature behavior declares and writes it (`setupAirPlay`), so it lives
  // behind a cast rather than in the typed slice above — declaring it in
  // `stateKeys` is what would materialize it. Absent slot means never
  // suspended, which is the right answer for every composition without an
  // AirPlay bridge. Shape redefined locally (canonical:
  // `SegmentLoadingState['loadingSuspended']`) to avoid a load-segments import.
  const loadingSuspended = (state as { loadingSuspended?: ReadonlySignal<boolean | undefined> }).loadingSuspended;
  /**
   * Whether each selected track type has a resolved rendition, which is when that type's key declarations are known.
   * Any resolved rendition of the type counts, not only the selected one: a type's renditions are assumed to be all
   * clear or all encrypted, so the answer survives an ABR switch to a rendition that hasn't resolved yet.
   */
  const selectedTypesResolved = (presentation: Presentation) => {
    const selected = [
      { id: state.selectedVideoTrackId?.get(), type: 'video' },
      { id: state.selectedAudioTrackId?.get(), type: 'audio' },
    ] as const;
    const composed = selected.filter(({ id }) => id !== undefined);

    return (
      composed.length > 0 && composed.every(({ type }) => getTracksByType(presentation, type).some(isResolvedTrack))
    );
  };

  const derivedStateSignal = computed<MediaKeysFsmState>(() => {
    const presentation = state.presentation.get();
    if (!context.mediaElement.get() || !isResolvedPresentation(presentation)) return 'preconditions-unmet';

    // An AirPlay session takes playback off MSE entirely: WebKit plays the
    // native-HLS fallback `<source>` on the receiver, whose key requests arrive
    // as `skd` and cannot be served by MediaKeys negotiated for `sinf`/`cenc`.
    // Yield the element rather than hold a CDM that can answer nothing —
    // `setupAirPlayFairPlay` negotiates for the receiver while this is parked,
    // and the state-exit cleanup below is already the MediaKeys-only reset that
    // handoff wants. Re-negotiation rides the falling edge for free: the
    // reactor re-enters once the session settles, alongside the MediaSource
    // rebuild.
    if (loadingSuspended?.get()) return 'preconditions-unmet';

    // Keys are declared per media playlist, so this flips only once an
    // encrypted rendition has resolved — exactly when encrypted segments
    // become loadable.
    if (declaredDrmKeys(presentation).length > 0) return 'media-keys-required';

    // No keys so far, but a selected type with no resolved rendition could
    // still declare them: the source counts as clear only once each has one.
    if (selectedTypesResolved(presentation)) return 'source-clear';

    return 'preconditions-unmet';
  });

  // The handoff: what `exchangeLicenses` preconditions on and rendition pruning
  // reads. The three writes land together, before any further await — a
  // reactor monitor cannot observe an intermediate write, the flush being a
  // microtask away — so they read as one fact. `clearNegotiation` undoes the
  // first two; otherwise each state's entry sets the gate.
  const publishNegotiation = ({ keySystem, mediaKeys }: Negotiation) => {
    context.mediaKeys.set(mediaKeys);
    state.negotiatedKeySystem.set(keySystem);
    state.segmentLoadingBlocked.set(false);
  };
  const clearNegotiation = () => {
    context.mediaKeys.set(undefined);
    state.negotiatedKeySystem.set(undefined);
  };

  return createMachineReactor<MediaKeysFsmState>({
    initial: 'preconditions-unmet',
    monitor: () => derivedStateSignal.get(),
    states: {
      // The gate follows the state: blocked until the source is known to be
      // safe, open for a confirmed-clear source. The initial entry runs during
      // setup, so the gate is up before any loader's first dispatch whatever
      // order the composition lists them in. Cleanups never write it, so
      // entry/cleanup ordering across a transition can't reopen it.
      'preconditions-unmet': {
        entry: () => {
          state.segmentLoadingBlocked.set(true);
        },
      },
      'source-clear': {
        entry: () => {
          state.segmentLoadingBlocked.set(false);
        },
      },

      'media-keys-required': {
        // entry body is auto-untracked. Raises the gate synchronously, then runs
        // the EME pipeline as one task; state-exit cleanup aborts it and tears
        // the attachment down in order.
        entry: () => {
          const mediaElement = context.mediaElement.get()!;
          const presentation = state.presentation.get()!;

          state.segmentLoadingBlocked.set(true);

          // A genuine failure rejects here and reports; the runner's own abort
          // settles quietly, so teardown never reports anything.
          runner
            .schedule(
              new Task((signal) =>
                negotiateMediaKeys({ mediaElement, presentation, signal, state, config, publish: publishNegotiation })
              )
            )
            .catch((error) => {
              emitError(state, { code: SVTA_DRM_INITIALIZATION_ERROR, data: { reason: String(error) } });
            });

          // State-exit cleanup — source unload, element detach, or destroy.
          // Order: abort first (kills the negotiation), clear the slots, then
          // detach. Sessions opened against these MediaKeys are closed by
          // `exchangeLicenses`, which is composed ahead of this behavior so
          // its cleanup runs first (see its file JSDoc).
          return () => {
            runner.abortAll();
            clearNegotiation();
            attachMediaKeys(mediaElement, null).catch(() => {});
          };
        },
      },
    },
  });
}

export const setupMediaKeys = defineBehavior({
  stateKeys: ['presentation', 'segmentLoadingBlocked', 'negotiatedKeySystem'],
  contextKeys: ['mediaElement', 'mediaKeys'],
  setup: ({
    state,
    context,
    config,
  }: {
    state: MediaKeysStateMap;
    context: MediaKeysContextMap;
    config: MediaKeysSetupConfig;
  }) => setupMediaKeysSetup({ state, context, config }),
});
