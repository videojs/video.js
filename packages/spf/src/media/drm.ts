/**
 * DOM-free DRM model helpers: the `source.drm`-shaped config contract, HLS `KEYFORMAT` → EME key-system identity
 * mapping, manifest-declared key collection, and key-system candidate selection. The browser-touching EME half (access
 * negotiation, MediaKeys attachment, init-data decoding, license POST) lives in `dom/eme.ts`, which re-exports these.
 */
import { toValue, type ValueOrFunction } from '@videojs/utils/function';

import { SVTA_UNSUPPORTED_ENCRYPTION_METHOD, type SvtaError } from './errors';
import {
  getMediaPlaylistMetadata,
  isResolvedTrack,
  type MaybeResolvedPresentation,
  type MediaPlaylistKey,
} from './types';
import { getAllTracks } from './utils/tracks';

/**
 * A configured DRM URL: the value itself, or a resolver asked for it.
 *
 * A resolver exists because license servers are per-source while engine config is per-engine. A Media holding a
 * structured source names the key systems it could ever license once, and resolves each URL from whatever source is
 * current — no engine rebuild when the source changes.
 *
 * `undefined`, returned or given outright, means this key system has no license server for the current source. Its
 * renditions then prune exactly as an unnamed system's do, so "named but unlicensable" and "not named" agree.
 *
 * Synchronous by necessity: {@link keySystemCandidates} runs inside rendition pruning, which is a synchronous selection
 * constraint. Resolvers are called during pruning as well as at license time, so keep them cheap and free of side
 * effects.
 */
export type DrmUrl = DrmValue<string>;

/** A configured DRM value: the value itself, or a resolver asked for it. See {@link ValueOrFunction}. */
export type DrmValue<T> = ValueOrFunction<T>;

/** Extra license-request headers, or a resolver asked for them. */
export type DrmHeaders = DrmValue<Record<string, string>>;

/** A fetch credentials mode for the DRM exchanges, or a resolver asked for it. */
export type DrmCredentials = DrmValue<RequestCredentials>;

/**
 * Where one key system's licenses come from. Accepts `@videojs/media`'s `DrmSystemConfig` — a `source.drm` entry passes
 * through adapters unchanged — and additionally takes a resolver per URL. Defined locally so driving an engine directly
 * costs no `@videojs/media`.
 */
export interface DrmSystemConfig {
  /** License server the CDM's license request is POSTed to. */
  licenseUrl: DrmUrl;
  /**
   * URL of the DRM server (application) certificate. FairPlay needs one unless its CDM is pre-provisioned; Widevine and
   * PlayReady ignore it.
   */
  serverCertificateUrl?: DrmUrl;
  /**
   * Extra headers for this system's license request.
   *
   * How most providers authenticate: Axinom reads an `X-AxDRM-Message` entitlement, BuyDRM a `customdata`, others an
   * `Authorization`. A license URL alone can only carry a token a provider agrees to take as a query param.
   *
   * Merged with the headers the request already needs rather than replacing them, and the derived ones win — a classic
   * PlayReady challenge names the headers its own CDM requires, and those are not negotiable.
   *
   * Deliberately plain data, not a resolver like {@link DrmUrl}: it is the field most likely to be worth promoting to
   * `@videojs/media`'s shared source contract, and a function there would make every source assignment rebuild the
   * hls.js and Shaka engines, which compare `source.drm` structurally.
   */
  headers?: DrmHeaders;
  /**
   * Extra headers for this system's certificate request.
   *
   * Deliberately separate from {@link headers}: a custom header forces a CORS preflight, and most certificate endpoints
   * are public hosts that would refuse one — so license auth never rides the certificate GET implicitly. A deployment
   * that gates its certificate behind the same token (Vualto's shape) names it in both fields.
   */
  certificateHeaders?: DrmHeaders;
  /**
   * Fetch credentials mode for this system's license and certificate exchanges. `'include'` sends cookies on a
   * cross-origin exchange (the server must answer CORS with `Access-Control-Allow-Credentials`) — the escape hatch
   * other engines expose as Shaka's `allowCrossSiteCredentials` or dash.js's `withCredentials`. Unset leaves fetch's
   * `same-origin` default, so a cross-origin license POST carries no cookies.
   */
  credentials?: DrmCredentials;
  /**
   * Decorate this system's license request after the key system's own shaping — add an auth header, mint a per-session
   * token, rewrite the URL. Composed _after_ the module default (which owns the wire protocol, e.g. PlayReady's
   * envelope), so it decorates an already-correct request rather than replacing that shaping.
   */
  licenseRequest?: DrmRequestTransform;
  /**
   * Unwrap this system's license response before the CDM sees it — a CKC out of XML or JSON, a JSON-wrapped license.
   * Composed after the module default; must return the raw bytes `session.update` expects.
   */
  licenseResponse?: DrmResponseTransform;
  /** Decorate this system's app-certificate request. Composed after the module default. */
  certificateRequest?: DrmRequestTransform;
  /**
   * Unwrap this system's app-certificate response, returning the raw certificate bytes. Composed after the module
   * default.
   */
  certificateResponse?: DrmResponseTransform;
  /**
   * How this provider's `skd://` key URI names the asset, for the legacy FairPlay path only — see
   * {@link FairPlayContentId}. Defaults to {@link defaultFairPlayContentId}.
   *
   * Not a transform, and deliberately not reachable from one: the content id is packed into the session's
   * initialization data, so the CDM has already sealed it inside the SPC by the time any request exists. A provider
   * that instead sends its asset id _beside_ the SPC — KeyOS's `assetId` form field, Irdeto's URL query — wants
   * {@link licenseRequest}, not this.
   */
  fairPlayContentId?: FairPlayContentId;
}

/**
 * `state.negotiatedKeySystem` when negotiation ran and every candidate was refused.
 *
 * A sentinel rather than `null` or a second slot, so the slot stays `string | undefined` and its three meanings read
 * off one value: absent means negotiation hasn't settled, this means it settled on nothing, anything else is the chosen
 * key system. Cannot collide with a real id — those are reverse-DNS (`com.widevine.alpha`).
 *
 * The distinction is load-bearing for pruning: "not yet" must leave encrypted renditions alone, while "refused" is the
 * late fact that makes them unplayable (see `excludeRefusedKeySystems`).
 */
export const NO_KEY_SYSTEM = 'none';

/**
 * License servers keyed by EME key-system id, for the ids `Id` names. The HLS video adapter's options use it to key
 * `drm` by the default modules' ids when no `keySystems` is named, so a config entry no composed module could ever
 * negotiate is a type error rather than a silent miss at negotiation time.
 */
export type DrmSystemsConfigFor<Id extends string> = Partial<Record<Id, DrmSystemConfig>>;

/**
 * License servers keyed by EME key-system id — the shape of `source.drm`. The runtime form, keyed by any id: a source
 * is data, so it cannot be checked against a composition. It assigns to any {@link DrmSystemsConfigFor} — an index
 * signature satisfies optional properties — so a source-derived config still flows into a typed engine config.
 */
export type DrmSystemsConfig = DrmSystemsConfigFor<string>;

/**
 * The DRM slice of an engine's config: the license servers it can reach and the key systems it can negotiate. What the
 * DRM-aware capability probe (`canPlayTrackWithDrm`) and condition reporter (`reportUnsupportedTrackConditionsWithDrm`)
 * read off the config they are handed — through a cast rather than a constraint on their function types, for the same
 * reason the selection rules read their own config that way: those types compose into configs that share nothing else.
 */
export interface DrmConfig {
  drm?: DrmSystemsConfig;
  keySystems?: readonly KeySystemModule[];
}

/**
 * Resolve a {@link DrmUrl}. Called from a selection constraint, so a resolver that throws answers `undefined` rather
 * than failing the pruning pass — see {@link toValue}.
 */
export function resolveDrmUrl(url: DrmUrl): string | undefined {
  return toValue(url);
}

/** Resolve configured license-request headers. See {@link resolveDrmUrl}. */
export function resolveDrmHeaders(headers: DrmHeaders): Record<string, string> | undefined {
  return toValue(headers);
}

/** Resolve a configured fetch credentials mode. See {@link resolveDrmUrl}. */
export function resolveDrmCredentials(credentials: DrmCredentials): RequestCredentials | undefined {
  return toValue(credentials);
}

/**
 * Everything one key system needs to be negotiated and licensed, as a value a composition includes or omits.
 *
 * The unit of DRM composability. Per-system knowledge used to sit in six string-keyed lookup tables spread across this
 * module and `dom/eme.ts`, which made every system's code reachable from every composition and split a single system's
 * facts across the DOM boundary. Here each system is one value: drop `playReadyKeySystem` from an engine's `keySystems`
 * and its request-string variants, its PSSH wrap, and its XML envelope unwrap all leave with it.
 *
 * Declared DOM-free so the pruning path (`keySystemCandidates`) can consume modules without a DOM dependency; the
 * modules themselves live in `dom/key-systems.ts`, since license-message shaping needs browser APIs.
 */
export interface KeySystemModule<Id extends string = string> {
  /**
   * EME key-system id. What a CDM is asked for, and what `source.drm` and the negotiated-system state are keyed by.
   * Carried as a literal type by the shipped modules so a composition's `drm` config can be keyed by exactly the ids it
   * composes (see {@link KeySystemId}); a module typed with the default `string` opts out of that narrowing.
   */
  readonly keySystem: Id;
  /**
   * The HLS `KEYFORMAT` identities that declare this system. Widevine declares itself by its DASH system-id URN;
   * PlayReady's KEYFORMAT happens to equal its key system; FairPlay uses Apple's streaming-key-delivery name.
   */
  readonly keyFormats: readonly string[];
  /**
   * Request strings to try, most-preferred first. Defaults to `[keySystem]`. Exists because PlayReady exposes a second
   * id (`.recommendation`) selecting the hardware security level, and the two are not interchangeable.
   */
  readonly requestVariants?: readonly string[];
  /**
   * `MediaKeySystemConfiguration.initDataTypes` for this system. Defaults to `['cenc']`. FairPlay's are its own —
   * Safari rejects a cenc-only configuration; on the MSE path its init data arrives as `sinf`.
   */
  readonly initDataTypes?: readonly string[];
  /**
   * Video robustness tiers, strongest first. Each becomes one configuration, so a device that has the top tier
   * negotiates it and one that doesn't descends the ladder instead of being refused.
   *
   * A ladder rather than a single preference because EME accepts or refuses a configuration **as a unit**: pairing one
   * video tier with an audio tier means an unavailable video tier discards the audio tier with it, and both
   * capabilities fall through to the unstamped configuration. Measured on macOS Chrome (Widevine L3), where
   * `HW_SECURE_ALL` is refused: a single-preference pair left both levels unspecified.
   */
  readonly videoRobustnessTiers?: readonly string[];
  /**
   * Audio robustness tiers, strongest first, paired rung-for-rung with {@link videoRobustnessTiers}. A shorter list
   * clamps to its last entry, which is the usual shape — the audio tier rarely varies by device even where the video
   * tier does.
   *
   * Worth naming at all because Chromium warns on any capability that omits `robustness`, and an unspecified level
   * leaves the choice to the CDM, which is free to change it between versions.
   */
  readonly audioRobustnessTiers?: readonly string[];
  /**
   * Whether to offer an encryption-scheme-unstamped fallback configuration alongside the stamped one. Defaults to
   * `true`. Windows PlayReady is why it exists: it decrypts cbcs content but refuses a cbcs-stamped configuration,
   * which is why hls.js leaves the member unset altogether. Set `false` on a system whose CDMs are known to honour the
   * member, to negotiate one configuration instead of two.
   */
  readonly schemeFallback?: boolean;
  /**
   * Project a manifest-carried key URI into EME init data, or `undefined` when this URI carries none. Omit the field
   * entirely for a system whose manifest never carries init data (FairPlay's `skd://`), which routes it to the
   * `encrypted`-event path.
   */
  readonly toInitData?: (uri: string) => { initDataType: string; initData: Uint8Array<ArrayBuffer> } | undefined;
  /**
   * Transform the outgoing license request for this system — its own default, before any per-source override. Defaults
   * to identity (POST the raw CDM message as octet-stream, which is what Widevine and FairPlay want; Mux's FairPlay
   * server takes the bare SPC). PlayReady overrides it to unwrap the challenge envelope.
   */
  readonly licenseRequest?: DrmRequestTransform;
  /**
   * Transform the license server's response before `session.update` — its own default, before any per-source override.
   * Defaults to identity (the server returns the raw CDM license, which is what Mux and EZDRM do). A system whose
   * server wraps the license — a CKC inside XML or JSON — overrides it to unwrap the bytes the CDM expects.
   */
  readonly licenseResponse?: DrmResponseTransform;
  /**
   * Transform the outgoing app-certificate request for this system. Defaults to identity (the plain `GET` the
   * certificate fetch performs). No shipped system needs one; it exists so a system whose certificate endpoint expects
   * a POST or its own auth can shape the request rather than forcing that onto every source.
   */
  readonly certificateRequest?: DrmRequestTransform;
  /**
   * Transform the app-certificate response before `setServerCertificate`. Defaults to identity (the raw certificate
   * bytes, which is what FairPlay's `.cer` endpoints return). Exists for a system whose endpoint wraps the bytes.
   */
  readonly certificateResponse?: DrmResponseTransform;
}

/** The key-system ids a list of modules composes — `string` if any module is typed with the default id. */
export type KeySystemId<Modules extends readonly KeySystemModule[]> = Modules[number]['keySystem'];

/**
 * One DRM network request as it is about to be sent — the value a {@link DrmRequestTransform} rewrites. Shaped as a
 * subset of a `fetch` request so it slots into the eventual network layer: `method` is `'POST'` for a license and
 * `'GET'` for a certificate (a transform may change it — e.g. a provider that gates its certificate behind a POST);
 * `body` is the CDM message for a license, `null` for the certificate GET.
 */
export interface DrmRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: BufferSource | null;
  /** Fetch credentials mode; unset leaves fetch's `same-origin` default. */
  credentials?: RequestCredentials;
}

/**
 * Rewrite a DRM request (URL, headers, body, credentials) before it is sent. Async — a provider may mint a per-session
 * token.
 */
export type DrmRequestTransform = (request: DrmRequest) => DrmRequest | Promise<DrmRequest>;

/**
 * Derive the content id a FairPlay session binds to, from the key's `skd://` URI.
 *
 * Provider-specific because the URI's structure is: Mux carries a query (`skd://mux?keyId=…&playbackId=…`), EZDRM an
 * asset id after a `;`, Axinom a `keyid:iv` pair. No rule covers them, so the deployment that knows its provider says.
 *
 * Only the legacy `WebKitMediaKeys` path consults this, and only because the content id is packed into the session's
 * initialization data there — the CDM then embeds it in the SPC, so nothing downstream can correct it. The EME path
 * derives no content id at all: `generateRequest('skd', …)` hands the CDM the URI untouched.
 */
export type FairPlayContentId = (keyUri: string) => string;

/**
 * What a FairPlay content id is when a source names no {@link FairPlayContentId}: everything after the scheme, which is
 * Apple's own sample convention and what Mux's license server expects.
 */
export function defaultFairPlayContentId(keyUri: string): string {
  const start = keyUri.indexOf('skd://');

  return start === -1 ? keyUri : keyUri.slice(start + 'skd://'.length);
}

/**
 * Rewrite a DRM response — a license or an app certificate — before it reaches the CDM. Async, for the same reason a
 * {@link DrmRequestTransform} is: an unwrap may need to fetch. Returns the bytes the CDM expects (`session.update` /
 * `setServerCertificate`), unwrapping any server envelope (CKC in XML/JSON, a JSON license) the raw bytes carry.
 */
export type DrmResponseTransform = (
  response: Uint8Array<ArrayBuffer>
) => Uint8Array<ArrayBuffer> | Promise<Uint8Array<ArrayBuffer>>;

/**
 * Every DRM key declaration across the presentation's resolved tracks, deduped by full attribute identity. Empty until
 * at least one encrypted rendition's media playlist has resolved — `EXT-X-KEY` is a media-playlist tag, and Mux emits
 * no `EXT-X-SESSION-KEY` in the multivariant.
 */
export function declaredDrmKeys(presentation: MaybeResolvedPresentation | undefined): MediaPlaylistKey[] {
  const keys: MediaPlaylistKey[] = [];
  const seen = new Set<string>();

  for (const track of getAllTracks(presentation?.selectionSets ?? [])) {
    if (!isResolvedTrack(track)) continue;

    for (const key of getMediaPlaylistMetadata(track)?.keys ?? []) {
      const identity = [key.method, key.uri, key.keyFormat, key.keyId, key.iv].join(' ');
      if (seen.has(identity)) continue;

      seen.add(identity);
      keys.push(key);
    }
  }

  return keys;
}

/** Encryption scheme per HLS `METHOD`, for the MKSA encryption-scheme query. */
const ENCRYPTION_SCHEME_BY_METHOD: Readonly<Record<string, 'cbcs' | 'cenc'>> = {
  'SAMPLE-AES': 'cbcs',
  'SAMPLE-AES-CTR': 'cenc',
  'SAMPLE-AES-CENC': 'cenc',
};

/**
 * The one encryption scheme the declared keys use, or `undefined` when they mix schemes or declare none we recognize.
 * Stamped onto negotiation capabilities so scheme-aware CDMs refuse content they can't decrypt (Mux serves `SAMPLE-AES`
 * — cbcs); UAs predating the encryption-scheme query ignore the member, so declaring it never costs support.
 */
export function declaredEncryptionScheme(keys: readonly MediaPlaylistKey[]): 'cbcs' | 'cenc' | undefined {
  const schemes = new Set(
    keys.map((key) => ENCRYPTION_SCHEME_BY_METHOD[key.method]).filter((scheme) => scheme !== undefined)
  );

  return schemes.size === 1 ? [...schemes][0] : undefined;
}

/**
 * The init data a presentation's manifest carries for one key system: every declared key the module claims, projected
 * through its `toInitData` (Widevine PSSH / PlayReady PRO as `data:` URIs). Empty when the module carries none
 * (FairPlay `skd://` keys have no inline init data) or declares no projection at all — which is what routes
 * `exchangeLicenses` to its event-driven fallback.
 */
export function manifestInitData(
  presentation: MaybeResolvedPresentation | undefined,
  module_: KeySystemModule | undefined
): { initDataType: string; initData: Uint8Array<ArrayBuffer> }[] {
  if (!module_?.toInitData) return [];

  const projected: { initDataType: string; initData: Uint8Array<ArrayBuffer> }[] = [];

  for (const key of declaredDrmKeys(presentation)) {
    if (key.keyFormat === undefined || key.uri === undefined || !module_.keyFormats.includes(key.keyFormat)) continue;

    const initData = module_.toInitData(key.uri);

    if (initData) projected.push(initData);
  }

  return projected;
}

/**
 * The key-system modules worth asking the CDM for: declared by the presentation's keys _and_ resolving to a license
 * server, in `keySystems` order. Keys without a `KEYFORMAT` any module claims (e.g. `identity` AES-128) contribute
 * nothing.
 *
 * Negotiation preference is the caller's array order rather than a table here — hls.js's order (the platform-native
 * system first, FairPlay existing only on Apple UAs so it costs nothing elsewhere) is what `DEFAULT_KEY_SYSTEMS`
 * encodes, and a composition that wants another just orders its own list.
 *
 * A resolved license server rather than a named entry is what counts, so a config naming every system it could ever
 * license still refuses the sources it holds no credentials for.
 */
export function keySystemCandidates(
  keys: readonly MediaPlaylistKey[],
  drm: DrmSystemsConfig,
  keySystems: readonly KeySystemModule[]
): KeySystemModule[] {
  const declared = new Set(keys.map((key) => key.keyFormat).filter((keyFormat) => keyFormat !== undefined));

  return keySystems.filter(
    (module_) =>
      module_.keyFormats.some((keyFormat) => declared.has(keyFormat)) &&
      resolveDrmUrl(drm[module_.keySystem]?.licenseUrl) !== undefined
  );
}

/**
 * The HLS default `KEYFORMAT`: a key file (URL key), not a DRM key system. RFC 8216 makes it the value when the
 * attribute is absent, so an absent or `identity` keyformat marks non-DRM (clear-key) encryption — `AES-128` /
 * `SAMPLE-AES` decrypted from a fetched key, a different subsystem from EME (see `clear-key-aes.md`).
 */
export const IDENTITY_KEY_FORMAT = 'identity';

/**
 * The first declared key that is non-DRM (`identity`-keyformat) encryption, or `undefined` when every declared key
 * names a DRM key system. Distinguishes "the source is clear-key encrypted, which this engine can't decrypt" from "a
 * DRM system was declared and refused or is unlicensable" when negotiation yields no usable key system.
 */
export function firstNonDrmEncryptionKey(keys: readonly MediaPlaylistKey[]): MediaPlaylistKey | undefined {
  return keys.find((key) => key.keyFormat === undefined || key.keyFormat === IDENTITY_KEY_FORMAT);
}

/**
 * The cause to report when encryption the engine cannot decrypt is why a source or rendition will not play, given its
 * declared keys — or `undefined` when a DRM system is the right thing to blame. An `identity`-keyformat key (AES-128 /
 * SAMPLE-AES over HTTP) is not EME at all and this engine has no decryptor for it, so the cause names the unsupported
 * _encryption method_ rather than a DRM system that was never involved. `data` rides on the condition beside the method
 * and key format.
 *
 * Shared by `setupMediaKeys` (at negotiation) and the condition reporter (at resolve), so the two never disagree about
 * which gap to name.
 */
export function unsupportedEncryptionMethodCause(
  keys: readonly MediaPlaylistKey[],
  data: Record<string, unknown> = {}
): SvtaError | undefined {
  const nonDrmKey = firstNonDrmEncryptionKey(keys);
  if (!nonDrmKey) return undefined;

  return {
    code: SVTA_UNSUPPORTED_ENCRYPTION_METHOD,
    data: { ...data, method: nonDrmKey.method, keyFormat: nonDrmKey.keyFormat },
  };
}

/**
 * Build the engine-facing DRM config a Media hands its engine once: one entry per key system whose every field reads
 * the _current_ source (via `getDrm`) at call time, so switching source re-licenses without rebuilding the engine.
 *
 * URL and header fields resolve to a plain value the engine re-resolves harmlessly. The four transform fields are
 * stable functions that apply the current source's transform, or pass the value through when it names none. Transforms
 * cannot ride {@link DrmUrl}'s resolver union: {@link toValue} tells a function from a value by `typeof ===
 * 'function'`, which a transform — itself a function — collides with. Wrapping here is what lets a source carry
 * transforms without the engine ever holding, or structurally comparing, the source's own function objects.
 */
export function sourceDrmSystems(
  getDrm: () => DrmSystemsConfig | undefined,
  keySystems: readonly KeySystemModule[]
): DrmSystemsConfig {
  return Object.fromEntries(
    keySystems.map(({ keySystem }) => {
      const entry = () => getDrm()?.[keySystem];

      return [
        keySystem,
        {
          licenseUrl: () => resolveDrmUrl(entry()?.licenseUrl),
          serverCertificateUrl: () => resolveDrmUrl(entry()?.serverCertificateUrl),
          headers: () => resolveDrmHeaders(entry()?.headers),
          certificateHeaders: () => resolveDrmHeaders(entry()?.certificateHeaders),
          credentials: () => resolveDrmCredentials(entry()?.credentials),
          licenseRequest: (request: DrmRequest) => entry()?.licenseRequest?.(request) ?? request,
          licenseResponse: (response: Uint8Array<ArrayBuffer>) => entry()?.licenseResponse?.(response) ?? response,
          certificateRequest: (request: DrmRequest) => entry()?.certificateRequest?.(request) ?? request,
          certificateResponse: (response: Uint8Array<ArrayBuffer>) =>
            entry()?.certificateResponse?.(response) ?? response,
          fairPlayContentId: (keyUri: string) =>
            entry()?.fairPlayContentId?.(keyUri) ?? defaultFairPlayContentId(keyUri),
        },
      ];
    })
  );
}
