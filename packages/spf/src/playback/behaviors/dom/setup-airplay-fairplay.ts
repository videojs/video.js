/**
 * **Serve an AirPlay receiver's FairPlay key requests.** During an AirPlay session WebKit takes playback off MSE and
 * onto the native-HLS fallback `<source>` `setupAirPlay` appends, and the receiver raises its own key requests through
 * the sender's CDM as `skd`. The MediaKeys `setupMediaKeys` negotiated are configured for `sinf`/`cenc` and cannot
 * serve those, so it yields the element for the session's duration (an observed `loadingSuspended` is
 * `preconditions-unmet` there) and this behavior negotiates a second time, for `skd`, in the gap it leaves.
 *
 * The handoff is needed regardless of any browser bug: it is the init-data type, not a workaround, that the MSE
 * negotiation cannot satisfy.
 *
 * Negotiation is driven by the receiver's first request rather than by the session starting. A session on a FairPlay
 * source does not by itself mean the receiver needs anything from this CDM, and the shipped native path
 * (`adapters/native-hls-video/src/drm.ts`) resolves its key system the same lazy way. Every request awaits the one
 * negotiation, so the certificate is always applied before any `generateRequest` — the same ordering `setupMediaKeys`
 * carries across its publish, here carried by the promise.
 *
 * Deliberately **not** a writer of `context.mediaKeys`. That slot is `setupMediaKeys`' handoff to `exchangeLicenses`,
 * and publishing receiver MediaKeys into it would wake `exchangeLicenses` to license an MSE pipeline that is not
 * playing. These MediaKeys stay behavior-local, and a cleared `context.mediaKeys` is instead read as the gate proving
 * `setupMediaKeys` has finished yielding.
 *
 * Nothing here dedupes. `listenForEncryptedInitData`'s byte-identity skip is right for MSE, where demuxed audio and
 * video fire for the same key, and wrong here: the receiver proxies its own SPC on connect and again on disconnect, so
 * a repeat is a second genuine request and dropping it strands the session.
 *
 * Single-positive-state reactor like `exchangeLicenses`, with one `AbortController` per entry — the state-exit cleanup
 * is the abort, which closes every session, plus a detach of the MediaKeys this behavior attached. The detach is
 * conditional: both this behavior and `setupMediaKeys` react to the same falling edge, so it releases the element only
 * while it still holds it, exactly as the native path does.
 *
 * **Compose it ahead of `setupMediaKeys`**, beside `exchangeLicenses` and for the same reason: `createComposition`
 * calls cleanups in registration order, so the receiver MediaKeys detach before the re-entering negotiation attaches
 * its own.
 *
 * **EME first, then the legacy key system.** Measured on macOS/Safari 26.6.2 against a real receiver: the CDM grants
 * access for `initDataTypes: ['skd']` and then throws `NotSupportedError` from `generateRequest` — self-inconsistent,
 * and the reason the pre-EME `WebKitMediaKeys` path still exists. That refusal, and only that refusal while the target
 * is wireless, hands the session over to `media/dom/fairplay-legacy.ts`; nothing sniffs an OS, so a fixed WebKit stops
 * taking the path by itself. The handover then reloads the resource, as the shipped native path does.
 *
 * Serving the `webkitneedkey` payload already in hand was tried instead, to avoid the reload — `setupAirPlay` holds the
 * MediaSource rebuild precisely because a `load()` under a live receiver can destroy a session still being established.
 * Measured on macOS/Safari 26.6.2 against a receiver, the legacy CDM refused that session outright:
 * `MEDIA_KEYERR_UNKNOWN`, no OSStatus, no license ever requested. Releasing EME's keys is evidently not enough to leave
 * the element servable by the old API, so the load algorithm has to run again and the payload from before it is not
 * reused. Resource selection re-runs over the `<source>` children, where the native-HLS fallback still sits, so the
 * receiver keeps its stream; playback restarts, which the handoff already was.
 *
 * Droppable. A composition omitting it carries neither `fairPlayAirPlayKeySystem` nor this file nor the legacy module,
 * and — since `loadingSuspended` is observed rather than declared — an engine without `setupAirPlay` never leaves
 * `'preconditions-unmet'` anyway.
 */
import { listen } from '@videojs/utils/dom';

import { defineBehavior } from '../../../core/composition/create-composition';
import type { Reactor } from '../../../core/reactors/create-machine-reactor';
import { createMachineReactor } from '../../../core/reactors/create-machine-reactor';
import { computed, type ReadonlySignal } from '../../../core/signals/primitives';
import {
  attachMediaKeys,
  declaredDrmKeys,
  fetchServerCertificate,
  type KeySystemModule,
  keySystemCandidates,
  requestKeySystemAccess,
  resolveDrmUrl,
} from '../../../media/dom/eme';
import {
  FAIRPLAY_LEGACY_KEY_SYSTEM,
  isAirPlayGenerateRequestRefusal,
  openLegacyLicenseSession,
  supportsWebKitFairPlay,
} from '../../../media/dom/fairplay-legacy';
import { fairPlayAirPlayKeySystem } from '../../../media/dom/key-systems';
import { listenForEncryptedInitData, openLicenseSession } from '../../../media/dom/license-sessions';
import {
  SVTA_DRM_CERTIFICATE_ERROR,
  SVTA_DRM_INITIALIZATION_ERROR,
  SVTA_DRM_LICENSE_REQUEST_GENERATION_FAILED,
  SVTA_UNSUPPORTED_DRM_SYSTEM,
  type SvtaError,
} from '../../../media/errors';
import { isResolvedPresentation, type MaybeResolvedPresentation } from '../../../media/types';
import { type ErrorEmitterState, emitError } from '../collect-errors';
import type { NegotiableDrmSystemsConfig } from './setup-media-keys';

/**
 * What an AirPlay receiver's key requests arrive as. FairPlay's `skd://` key URI carries no EME init data, so the
 * request comes from the element rather than the manifest — and it is this type, not MSE's `sinf`, that the MediaKeys
 * negotiated for the MSE pipeline cannot serve.
 */
const AIRPLAY_INIT_DATA_TYPE = 'skd';

/**
 * What FairPlay negotiates capabilities against for the receiver: the manifest, not a codec. The receiver plays the
 * native-HLS fallback source, so the renditions the MSE pipeline resolved say nothing about what it will decode.
 * Matches the shipped native path's configuration.
 */
const AIRPLAY_CONTENT_TYPE = 'application/vnd.apple.mpegurl';

/** State shape for the AirPlay FairPlay handoff. */
export interface AirPlayFairPlayState {
  presentation?: MaybeResolvedPresentation;
}

/** Context shape for the AirPlay FairPlay handoff. */
export interface AirPlayFairPlayContext {
  mediaElement?: HTMLMediaElement | undefined;
  /** `setupMediaKeys`' handoff slot, read here only as proof that it has yielded the element. */
  mediaKeys?: MediaKeys;
}

/** Config for the AirPlay FairPlay handoff. */
export interface AirPlayFairPlayConfig {
  /** License servers keyed by EME key-system id. Semantics on `MediaKeysSetupConfig['drm']`. */
  drm: NegotiableDrmSystemsConfig;
  /** The key systems this composition can negotiate. Semantics on `MediaKeysSetupConfig['keySystems']`. */
  keySystems: readonly KeySystemModule[];
}

// Type aliases, not interfaces: `defineBehavior`'s stateKeys ≡ keyof inference
// goes through an index-signature constraint only aliases satisfy implicitly.
// The `errors` reporter seam stays out of the typed slice, as in the other two
// DRM behaviors. Every slot is read-only — this behavior writes none.
type AirPlayFairPlayStateMap = {
  presentation: ReadonlySignal<AirPlayFairPlayState['presentation']>;
};

type AirPlayFairPlayContextMap = {
  mediaElement: ReadonlySignal<AirPlayFairPlayContext['mediaElement']>;
  mediaKeys: ReadonlySignal<AirPlayFairPlayContext['mediaKeys']>;
};

type AirPlayFairPlayFsmState = 'preconditions-unmet' | 'serving-receiver';

function setupAirPlayFairPlaySetup({
  state,
  context,
  config,
}: {
  state: AirPlayFairPlayStateMap & ErrorEmitterState;
  context: AirPlayFairPlayContextMap;
  config: AirPlayFairPlayConfig;
}): Reactor<AirPlayFairPlayFsmState | 'destroying' | 'destroyed'> {
  // Observed, never declared — see `setupMediaKeys` for why the slot lives
  // behind a cast. Absent means no AirPlay bridge is composed, so there is no
  // session to serve and this behavior never activates.
  const loadingSuspended = (state as { loadingSuspended?: ReadonlySignal<boolean | undefined> }).loadingSuspended;

  const report = (error: SvtaError) => emitError(state, error);

  const derivedStateSignal = computed<AirPlayFairPlayFsmState>(() => {
    if (!context.mediaElement.get() || !loadingSuspended?.get()) return 'preconditions-unmet';

    // `setupMediaKeys` yields on the same fact, but not instantly — it has a
    // task to abort and an element to detach. Waiting for its slot to clear is
    // what keeps two CDMs off one element.
    if (context.mediaKeys.get()) return 'preconditions-unmet';

    const presentation = state.presentation.get();
    if (!isResolvedPresentation(presentation)) return 'preconditions-unmet';

    // A declared FairPlay KEYFORMAT *and* a `com.apple.fps` license server that
    // resolves, against the modules this composition actually carries: an
    // engine composed without FairPlay does not grow it back here.
    const carriesFairPlay = config.keySystems.some(({ keySystem }) => keySystem === fairPlayAirPlayKeySystem.keySystem);
    if (!carriesFairPlay) return 'preconditions-unmet';

    const candidates = keySystemCandidates(declaredDrmKeys(presentation), config.drm, [fairPlayAirPlayKeySystem]);

    return candidates.length > 0 ? 'serving-receiver' : 'preconditions-unmet';
  });

  return createMachineReactor<AirPlayFairPlayFsmState>({
    initial: 'preconditions-unmet',
    monitor: () => derivedStateSignal.get(),
    states: {
      'preconditions-unmet': {},

      'serving-receiver': {
        // entry body is auto-untracked. Arms the receiver's request listener and
        // negotiates lazily behind it; everything binds to one controller, so
        // state-exit cleanup is the abort plus the conditional detach.
        entry: () => {
          const mediaElement = context.mediaElement.get()!;
          const entry = config.drm[fairPlayAirPlayKeySystem.keySystem]!;
          const controller = new AbortController();
          const { signal } = controller;

          /** The MediaKeys this behavior attached, for the conditional detach below. */
          let attached: MediaKeys | undefined;

          /** Non-sticky, per session: nothing here sniffs an OS, so a fixed WebKit simply stops taking this path. */
          let useLegacy = false;

          /** Only requests from the reloaded resource can use the legacy CDM. */
          let legacyReady = false;

          // Fetched once and shared by both paths. EME hands it to the CDM;
          // the legacy API packs it into the session's init data instead, which
          // is why it is mandatory there and merely usual here.
          let certificateRequest: Promise<Uint8Array<ArrayBuffer> | undefined> | undefined;
          const serverCertificate = () =>
            (certificateRequest ??= (async () => {
              const url = resolveDrmUrl(entry.serverCertificateUrl);
              if (url === undefined) return undefined;

              return fetchServerCertificate(fairPlayAirPlayKeySystem, entry, url, signal);
            })());

          /**
           * The current source's license server, or a report and `undefined`. Resolved per request, like the headers
           * and transforms the session reads: the gate proved a server once, but the receiver asks again on disconnect,
           * and a same-URL source swap that drops the entry never exits this state. Saying so beats POSTing to a
           * literal "undefined".
           */
          const receiverLicenseUrl = (): string | undefined => {
            const licenseUrl = resolveDrmUrl(entry.licenseUrl);
            if (licenseUrl !== undefined) return licenseUrl;

            report({
              code: SVTA_UNSUPPORTED_DRM_SYSTEM,
              data: {
                keySystems: [fairPlayAirPlayKeySystem.keySystem],
                reason: 'no license server for the receiver',
              },
            });
            return undefined;
          };

          const negotiate = async (): Promise<MediaKeys | undefined> => {
            const negotiated = await requestKeySystemAccess(
              [fairPlayAirPlayKeySystem],
              { video: [AIRPLAY_CONTENT_TYPE], audio: [] },
              undefined
            );

            if (!negotiated) {
              report({ code: SVTA_UNSUPPORTED_DRM_SYSTEM, data: { keySystems: [fairPlayAirPlayKeySystem.keySystem] } });
              return undefined;
            }

            let mediaKeys: MediaKeys;

            try {
              mediaKeys = await negotiated.access.createMediaKeys();
            } catch (error) {
              report({ code: SVTA_DRM_INITIALIZATION_ERROR, data: { reason: String(error) } });
              return undefined;
            }

            // FairPlay needs its application certificate before the CDM will
            // generate an SPC, so this precedes the attach and every caller
            // awaits it. `serverCertificate` answers `undefined` when none is
            // configured; EME, unlike the legacy API, can proceed without one.
            try {
              const certificate = await serverCertificate();

              if (certificate) await mediaKeys.setServerCertificate(certificate);
            } catch (error) {
              if (signal.aborted) return undefined;

              report({
                code: SVTA_DRM_CERTIFICATE_ERROR,
                data: { keySystem: fairPlayAirPlayKeySystem.keySystem, reason: String(error) },
              });
              return undefined;
            }

            if (signal.aborted) return undefined;

            await attachMediaKeys(mediaElement, mediaKeys);

            // The cleanup may have run while the attach was in flight; undo it
            // on the spot rather than leaving the element holding a CDM nobody
            // owns.
            if (signal.aborted) {
              attachMediaKeys(mediaElement, null).catch(() => {});
              return undefined;
            }

            attached = mediaKeys;
            return mediaKeys;
          };

          // One negotiation per session, shared by every request. Kicked off by
          // the first request rather than by entry: a session on a FairPlay
          // source is not itself evidence the receiver wants anything from this
          // CDM.
          let negotiation: Promise<MediaKeys | undefined> | undefined;

          /** Settles once no revoked MediaSource blob is left among the element's `<source>` children. */
          const blobSourceDetached = () =>
            new Promise<void>((resolve) => {
              const blobSource = () => mediaElement.querySelector('source[src^="blob:"]');
              if (!blobSource()) return resolve();

              const observer = new MutationObserver(() => {
                if (blobSource()) return;

                observer.disconnect();
                resolve();
              });

              observer.observe(mediaElement, { childList: true });
              signal.addEventListener(
                'abort',
                () => {
                  observer.disconnect();
                  resolve();
                },
                { once: true }
              );
            });

          /**
           * The legacy path, for a sender whose EME refuses to generate a request during the session. Reached only from
           * that refusal, so an unaffected WebKit never installs the old key system at all.
           */
          const serveLegacy = async (initData: ArrayBuffer) => {
            if (signal.aborted) return;

            const licenseUrl = receiverLicenseUrl();
            if (licenseUrl === undefined) return;

            // Mandatory here, unlike EME: it is packed into the session's init
            // data, so there is nothing to open a session with.
            let certificate: Uint8Array<ArrayBuffer> | undefined;

            try {
              certificate = await serverCertificate();
            } catch (error) {
              if (signal.aborted) return;

              report({
                code: SVTA_DRM_CERTIFICATE_ERROR,
                data: { keySystem: FAIRPLAY_LEGACY_KEY_SYSTEM, reason: String(error) },
              });
              return;
            }

            if (signal.aborted) return;

            if (!certificate) {
              report({
                code: SVTA_DRM_CERTIFICATE_ERROR,
                data: {
                  keySystem: FAIRPLAY_LEGACY_KEY_SYSTEM,
                  reason: 'the legacy key system packs the certificate into the session, so one must be configured',
                },
              });
              return;
            }

            try {
              openLegacyLicenseSession({
                mediaElement,
                module: fairPlayAirPlayKeySystem,
                entry,
                licenseUrl,
                certificate,
                initData,
                signal,
                report,
              });
            } catch (error) {
              report({
                code: SVTA_DRM_INITIALIZATION_ERROR,
                data: { keySystem: FAIRPLAY_LEGACY_KEY_SYSTEM, reason: String(error) },
              });
            }
          };

          /**
           * Hand the session over to the legacy API. EME has to release the element's keys before the old API can claim
           * them, and reloading the resource supplies the fresh `webkitneedkey` payload that resumes the exchange.
           */
          const fallBackToLegacy = async (error: unknown) => {
            if (useLegacy) return;

            if (!isAirPlayGenerateRequestRefusal(error, mediaElement) || !supportsWebKitFairPlay(mediaElement)) {
              report({
                code: SVTA_DRM_LICENSE_REQUEST_GENERATION_FAILED,
                data: { keySystem: fairPlayAirPlayKeySystem.keySystem, reason: String(error) },
              });
              return;
            }

            useLegacy = true;

            // Awaited, not fired off: EME must have released the element before
            // the legacy API claims it, and `webkitSetMediaKeys` is synchronous
            // — so racing them installs the old key system onto an element the
            // CDM still holds. No identity check here, unlike the state-exit
            // detach: `setupMediaKeys` cannot have re-attached while the session
            // is live, so whatever is on the element is ours.
            if (attached) {
              attached = undefined;
              await attachMediaKeys(mediaElement, null).catch(() => {});
            }

            if (signal.aborted) return;

            // Wait out the MediaSource detach first. Resource selection takes
            // the `<source>` children in order, the engine *prepends* the
            // MediaSource blob and `setupAirPlay` *appends* the native-HLS
            // fallback — so reloading while a revoked blob is still first
            // selects it, which is what `WebKitBlobResource error 1` is. The
            // detach is `setupMediaSource`'s to do and it is already underway
            // by here; this only declines to race it. Bounded by the behavior's
            // own signal rather than a timer: if the session ends while
            // waiting, the abort resolves it and the reload never happens.
            await blobSourceDetached();

            if (signal.aborted) return;

            // Reload the resource, as the shipped native path does. Serving the
            // `webkitneedkey` payload already in hand was tried first and the
            // CDM refused the session outright — `MEDIA_KEYERR_UNKNOWN`, no
            // OSStatus, no license ever requested — measured against a receiver
            // on macOS/Safari 26.6.2. Releasing EME's keys is evidently not
            // enough to leave the element servable by the old API; the load
            // algorithm has to run again. The fresh `webkitneedkey` that follows
            // drives the exchange, so the cached payload is deliberately not
            // reused: it belongs to the resource being replaced.
            //
            // Resource selection re-runs over the `<source>` children, where
            // `setupAirPlay`'s native-HLS fallback still sits, so the receiver
            // keeps its stream.
            //
            // The load algorithm resets `currentTime` to 0 and forces `paused`,
            // so the position and the playing state are captured here and put
            // back once metadata is available. Without it, engaging AirPlay
            // mid-playback silently leaves the receiver paused at the start and
            // the viewer has to press play again — measured on a receiver.
            //
            // Restored here rather than through `state.startPosition`:
            // `setupAirPlay` is that slot's only writer and binds it to the
            // session's *falling* edge, so a second writer on the rising edge
            // would be writing over a command it does not own. The reload is
            // this behavior's, so the repair is too.
            const position = mediaElement.currentTime;
            const wasPlaying = !mediaElement.paused;

            listen(
              mediaElement,
              'loadedmetadata',
              () => {
                if (signal.aborted) return;

                if (position > 0) mediaElement.currentTime = position;

                if (!wasPlaying) return;

                // The user gesture that started the session may have expired by
                // now, so this can be refused; degrade to paused-at-position,
                // as `setupAirPlay`'s own session-end resume does.
                mediaElement.play().catch((error) => {
                  console.warn('[setupAirPlayFairPlay] resume after handover rejected — staying paused:', error);
                });
              },
              { signal, once: true }
            );

            mediaElement.load();
            legacyReady = true;
          };

          const serve = async (initDataType: string, initData: Uint8Array<ArrayBuffer>) => {
            if (useLegacy) return;

            const mediaKeys = await (negotiation ??= negotiate());
            if (!mediaKeys || signal.aborted || useLegacy) return;

            const licenseUrl = receiverLicenseUrl();
            if (licenseUrl === undefined) return;

            openLicenseSession({
              mediaKeys,
              keySystem: fairPlayAirPlayKeySystem.keySystem,
              module: fairPlayAirPlayKeySystem,
              entry,
              licenseUrl,
              initDataType,
              initData,
              signal,
              report,
              onGenerateRequestError: (error) => void fallBackToLegacy(error),
            });
          };

          // Armed from entry but inert until the reload completes, so the old key
          // system is never installed on a sender whose EME works. Both events
          // fire for the same key; after the reload it is this one that carries
          // the request the legacy CDM can serve.
          listen(
            mediaElement,
            'webkitneedkey',
            (event) => {
              const { initData } = event as MediaEncryptedEvent;
              if (!initData || !legacyReady) return;

              void serveLegacy(initData);
            },
            { signal }
          );

          listenForEncryptedInitData(
            mediaElement,
            (initDataType, initData) => void serve(initDataType, initData),
            signal,
            {
              dedupe: false,
              initDataTypes: [AIRPLAY_INIT_DATA_TYPE],
            }
          );

          // State-exit cleanup — session ends, source unload, element detach, or
          // destroy. The abort kills in-flight license work and the listeners
          // first, then closes each session; the detach releases the element
          // only while these MediaKeys are still the ones on it, since
          // `setupMediaKeys` re-negotiates off the same falling edge.
          return () => {
            controller.abort();

            if (attached && mediaElement.mediaKeys === attached) {
              attachMediaKeys(mediaElement, null).catch(() => {});
            }
          };
        },
      },
    },
  });
}

export const setupAirPlayFairPlay = defineBehavior({
  stateKeys: ['presentation'],
  contextKeys: ['mediaElement', 'mediaKeys'],
  setup: ({
    state,
    context,
    config,
  }: {
    state: AirPlayFairPlayStateMap;
    context: AirPlayFairPlayContextMap;
    config: AirPlayFairPlayConfig;
  }) => setupAirPlayFairPlaySetup({ state, context, config }),
});
