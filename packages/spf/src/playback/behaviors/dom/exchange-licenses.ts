import { defineBehavior } from '../../../core/composition/define-behavior';
import type { Reactor } from '../../../core/reactors/create-machine-reactor';
import { createMachineReactor } from '../../../core/reactors/create-machine-reactor';
import { computed, type ReadonlySignal } from '../../../core/signals/primitives';
import { type KeySystemModule, manifestInitData, NO_KEY_SYSTEM, resolveDrmUrl } from '../../../media/dom/eme';
import { listenForEncryptedInitData, openLicenseSession } from '../../../media/dom/license-sessions';
import { SVTA_BAD_LICENSE_REQUEST, type SvtaError } from '../../../media/errors';
import { isResolvedPresentation, type MaybeResolvedPresentation } from '../../../media/types';
import { type ErrorEmitterState, emitError } from '../collect-errors';
import type { NegotiableDrmSystemsConfig } from './setup-media-keys';

/** State shape for license exchange. */
export interface ExchangeLicensesState {
  presentation?: MaybeResolvedPresentation;
  /** The negotiated key system; owned by `setupMediaKeys`. Semantics on `MediaKeysState['negotiatedKeySystem']`. */
  negotiatedKeySystem?: string;
}

/** Context shape for license exchange. */
export interface ExchangeLicensesContext {
  mediaElement?: HTMLMediaElement | undefined;
  /** The attached MediaKeys; owned by `setupMediaKeys`. */
  mediaKeys?: MediaKeys;
}

/** Config for license exchange. */
export interface ExchangeLicensesConfig {
  /** License servers keyed by EME key-system id — `source.drm`'s shape. Semantics on `MediaKeysSetupConfig['drm']`. */
  drm: NegotiableDrmSystemsConfig;
  /** The key systems this composition can negotiate. Semantics on `MediaKeysSetupConfig['keySystems']`. */
  keySystems: readonly KeySystemModule[];
}

// Type aliases, not interfaces: `defineBehavior`'s stateKeys ≡ keyof inference
// goes through an index-signature constraint only aliases satisfy implicitly.
// The `errors` reporter seam stays out of the typed slice, as in `setupMediaKeys`.
type ExchangeLicensesStateMap = {
  presentation: ReadonlySignal<ExchangeLicensesState['presentation']>;
  negotiatedKeySystem: ReadonlySignal<ExchangeLicensesState['negotiatedKeySystem']>;
};

type ExchangeLicensesContextMap = {
  mediaElement: ReadonlySignal<ExchangeLicensesContext['mediaElement']>;
  mediaKeys: ReadonlySignal<ExchangeLicensesContext['mediaKeys']>;
};

type ExchangeLicensesFsmState = 'preconditions-unmet' | 'licensing';

function setupExchangeLicenses({
  state,
  context,
  config,
}: {
  state: ExchangeLicensesStateMap & ErrorEmitterState;
  context: ExchangeLicensesContextMap;
  config: ExchangeLicensesConfig;
}): Reactor<ExchangeLicensesFsmState | 'destroying' | 'destroyed'> {
  const derivedStateSignal = computed<ExchangeLicensesFsmState>(() => {
    if (!context.mediaElement.get() || !context.mediaKeys.get()) return 'preconditions-unmet';

    // `NO_KEY_SYSTEM` is negotiation's refusal, not a system to license
    // against — and `undefined` is negotiation still in flight. Neither has a
    // `drm` entry to look up.
    const keySystem = state.negotiatedKeySystem.get();
    if (keySystem === undefined || keySystem === NO_KEY_SYSTEM) return 'preconditions-unmet';

    return isResolvedPresentation(state.presentation.get()) ? 'licensing' : 'preconditions-unmet';
  });

  const report = (error: SvtaError) => emitError(state, error);

  return createMachineReactor<ExchangeLicensesFsmState>({
    initial: 'preconditions-unmet',
    monitor: () => derivedStateSignal.get(),
    states: {
      'preconditions-unmet': {},

      licensing: {
        // entry body is auto-untracked. Opens every session the manifest
        // justifies, else arms the event-driven fallback; every session and
        // listener is bound to one controller, so state-exit cleanup is the
        // abort — it kills in-flight license work first, then closes the
        // sessions it opened.
        entry: () => {
          const mediaElement = context.mediaElement.get()!;
          const mediaKeys = context.mediaKeys.get()!;
          const keySystem = state.negotiatedKeySystem.get()!;
          const presentation = state.presentation.get()!;
          const controller = new AbortController();

          const entry = config.drm[keySystem]!;
          const module_ = config.keySystems.find((candidate) => candidate.keySystem === keySystem);

          // The license server is resolved per session, like the headers and
          // transforms the session reads. `keySystemCandidates` only offered
          // this system because its server resolved, but the resolver re-runs
          // here, and a source mutated since — a same-URL swap that changes
          // only `drm` never resets the presentation — can answer nothing.
          // Report that instead of POSTing to a literal "undefined".
          const open = (initDataType: string, initData: Uint8Array<ArrayBuffer>) => {
            const licenseUrl = resolveDrmUrl(entry.licenseUrl);

            if (licenseUrl === undefined) {
              report({
                code: SVTA_BAD_LICENSE_REQUEST,
                data: { keySystem, reason: 'license server resolved to nothing after negotiation' },
              });
              return;
            }

            openLicenseSession({
              mediaKeys,
              keySystem,
              module: module_,
              entry,
              licenseUrl,
              initDataType,
              initData,
              signal: controller.signal,
              report,
            });
          };

          // One session per manifest-carried init data of the negotiated
          // system, projected by its own module. Empty when the module's keys
          // carry none (FairPlay `skd://`), which routes to the fallback:
          // active only when the manifest path opened nothing, because on
          // manifest-licensed sources appends re-fire `encrypted` for content
          // already being licensed, and reacting would double-license.
          const declared = manifestInitData(presentation, module_);

          for (const { initDataType, initData } of declared) open(initDataType, initData);

          if (declared.length === 0) listenForEncryptedInitData(mediaElement, open, controller.signal);

          // State-exit cleanup — negotiation torn down, source unload, or
          // destroy. The abort kills in-flight license fetches and the
          // listeners first, then closes each session (bound in
          // `openLicenseSession`).
          return () => controller.abort();
        },
      },
    },
  });
}

/**
 * **Open MediaKeySessions for the negotiated key system and exchange their licenses.** Preconditions on the handoff
 * `setupMediaKeys` publishes — attached `context.mediaKeys` plus `state.negotiatedKeySystem` — so entry implies the CDM
 * is negotiated, its server certificate applied, and the MediaKeys attached; the "certificate before `generateRequest`"
 * ordering rides that handoff rather than a position in a shared function body.
 *
 * Sessions open manifest-driven — one per inline init data the negotiated system's module can project out of a key URI
 * (Widevine PSSH / PlayReady PRO as `data:` URIs) — or, when the manifest carries none (FairPlay `skd://`),
 * event-driven off the element's `encrypted` events, deduped by init-data bytes. Each exchange composes two transform
 * layers, module first: the negotiated system's module default (wire protocol) then the per-source override
 * (`source.drm[ks]`, deployment decoration) — over the request outbound and the response inbound — around the fetch to
 * that system's configured server.
 *
 * Failures report onto the errors sequence via `emitError` (SVTA 4004 license request, 4016 license rejected, 4021
 * request generation). None of them raise the load gate: by the time this behavior runs the gate is already down —
 * deliberately, since the appends that follow are what fire `encrypted` for the event-driven path — and browsers queue
 * decode on missing keys, so an unlicensed source stalls rather than failing. Post-license, each session's
 * `keystatuschange` is observed report-only: a key transitioning to expired / output-restricted / internal-error
 * reports 4003 / 4007 / 4014, turning the HDCP and expiry silent-stall shapes diagnosable. Exclusion or renewal policy
 * on those transitions stays downstream.
 *
 * Single-positive-state reactor, like `setupMediaKeys`. The session machinery lives in `media/dom/license-sessions.ts`
 * — `openLicenseSession` drives one session for its lifetime, `listenForEncryptedInitData` is the fallback — bound to
 * one `AbortController` per entry, so this behavior only decides which sessions to open and its state-exit cleanup is
 * the abort. **Compose it ahead of `setupMediaKeys`**: `createComposition` calls cleanups in registration order, and
 * the sessions opened here must be closed before `setupMediaKeys` detaches the MediaKeys they belong to. Setup order
 * costs nothing in return — the precondition is reactive on `context.mediaKeys`, so this behavior parks until the
 * negotiation it consumes has published.
 *
 * Writes no slots — it only reads the handoff and talks to the CDM and the license server. Rotation scope (tracked in
 * drm-support.md): the manifest loop licenses every key declared at entry, so VOD key rotation (all keys present at
 * load) is covered, and FairPlay rotation rides the `encrypted` fallback as segments append. The one gap is mid-stream
 * rotation for Widevine / PlayReady on a live reload — the entry captures the presentation once, later reloads' keys
 * are never re-scanned, and the `encrypted` fallback isn't armed for manifest-licensed content.
 */
export const exchangeLicenses = defineBehavior({
  stateKeys: ['presentation', 'negotiatedKeySystem'],
  contextKeys: ['mediaElement', 'mediaKeys'],
  setup: ({
    state,
    context,
    config,
  }: {
    state: ExchangeLicensesStateMap;
    context: ExchangeLicensesContextMap;
    config: ExchangeLicensesConfig;
  }) => setupExchangeLicenses({ state, context, config }),
});
