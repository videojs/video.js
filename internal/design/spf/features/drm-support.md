---
status: partial
date: 2026-09-22
definition: coarse
---

# DRM support

Digital Rights Management for protected content via the W3C
Encrypted Media Extensions (EME) specification. Covers MediaKeys /
MediaKeySession lifecycle, license-server interaction, key delivery,
and the per-key-system specifics for Widevine, PlayReady, and
FairPlay. The cluster F foundation that consumer-facing protected-
playback features (e.g., a Mux Player `drm-token` integration) build
on.

A **Media-src feature** in the framing from
[clusters.md § Feature classification axes](./clusters.md#feature-classification-axes):
without it, DRM-protected sources don't play. The engine has to set
up MediaKeys, negotiate a MediaKeySession, fetch and respond to
licenses, and deliver keys before the browser will decrypt segments.
*Which* key systems are supported is owned by
[capability-probing](./capability-probing.md) (cluster D); *setting
up* the chosen key system is owned by this feature.

Tracked via **[GitHub issue #1776](https://github.com/videojs/v10/issues/1776)**
("Feature: SPF DRM"). The non-SPF DRM work that once shared this doc's
tracking epic has shipped and is now prior art:
[#1411](https://github.com/videojs/v10/issues/1411) (retitled "DRM API for
Legacy Engine Medias"), [#1772 hls.js](https://github.com/videojs/v10/issues/1772),
[#1775 Mux integration](https://github.com/videojs/v10/issues/1775), and the
per-key-system sub-issues
[#1412](https://github.com/videojs/v10/issues/1412)–[#1414](https://github.com/videojs/v10/issues/1414)
(all closed). Milestone: GA. Prior art: the in-repo DRM modules
(`@videojs/media`'s `core/drm.ts` contract, the hls.js bridge in
`adapters/hlsjs-video/src/drm.ts`, the native FairPlay implementation in
`adapters/native-hls-video/src/fairplay-eme.ts` + `fairplay-webkit.ts`,
and `adapters/mux-video/src/drm.ts` token-derived license URLs),
[videojs-contrib-eme](https://github.com/videojs/videojs-contrib-eme)
(Video.js v8 plugin), [Mux Player DRM integration](https://www.mux.com/docs/guides/protect-videos-with-drm)
(Widevine + PlayReady + FairPlay via `drm-token` attribute).

## Status

- **Composition:** implemented in the `hls/video` engine, which composes
  `exchangeLicenses` then `setupMediaKeys` unconditionally and defaults
  `canPlayTrack` / `reportUnsupportedTrackConditions` to their DRM-aware
  variants over `config.drm`. Absent or empty `drm` is the degenerate
  case: encrypted renditions refuse exactly as a DRM-less engine
  refuses them, pruned before selection with
  `SVTA_UNSUPPORTED_DRM_SYSTEM` causes. `parseMediaPlaylist` surfaces
  structured `#EXT-X-KEY` metadata (`MediaPlaylistKey`; the boolean
  `encrypted` derives from it). `#EXT-X-SESSION-KEY` is still
  unrecognized, which matters: Mux emits no session-key tag in the
  multivariant playlist, so encryption is undiscoverable until a media
  playlist is fetched — hence pruning at resolve time rather than at
  manifest parse.
- **Behavior split:** two behaviors, not one. `setupMediaKeys`
  negotiates a key system, applies the server certificate, attaches
  MediaKeys, and owns the `segmentLoadingBlocked` load gate, which
  holds from setup and each new source until the source is confirmed
  clear or its MediaKeys attach, so it doesn't depend on composition
  order. Clear means each selected track type has a resolved rendition
  and nothing declares keys: a type's renditions are assumed to be all
  clear or all encrypted, so mixed renditions within one type and
  clear-lead content are out of scope;
  `exchangeLicenses` opens sessions and exchanges licenses. The handoff
  is `context.mediaKeys` + `state.negotiatedKeySystem`, published
  together only after the certificate is applied — which is what
  carries the "certificate before `generateRequest`" ordering across
  the boundary. `exchangeLicenses` is composed **first**:
  `createComposition` calls cleanups in registration order, so its
  sessions must close before the detach.
- **FairPlay-AirPlay handoff:** implemented and verified playing on a
  receiver (macOS/Safari 26.6.2 → Roku TV, 2026-09-16), by way of the
  legacy `WebKitMediaKeys` fallback the measured sender bug makes
  mandatory (see Open questions).
  A live AirPlay session takes playback off MSE onto the native-HLS
  fallback `<source>`, whose key requests arrive as `skd` — which the
  MediaKeys negotiated for `sinf`/`cenc` cannot serve. `setupMediaKeys`
  reads an observed `loadingSuspended` as `preconditions-unmet`, so the
  session routes through its existing state-exit cleanup (the
  MediaKeys-only reset) and re-negotiates on the falling edge with no
  extra machinery. `setupAirPlayFairPlay`
  (`behaviors/dom/setup-airplay-fairplay.ts`) negotiates
  `com.apple.fps` a second time in the gap, against
  `fairPlayAirPlayKeySystem` (`initDataTypes: ['skd']`) and the
  manifest content type, licensing through the same `openLicenseSession`
  fetch and transform layers. It writes no slots — publishing receiver
  MediaKeys into `context.mediaKeys` would wake `exchangeLicenses` to
  license a pipeline that is not playing — and dedupes nothing, because
  the receiver re-proxies its SPC on connect and on disconnect. Composed
  ahead of `setupMediaKeys` so its detach precedes that re-attach on the
  shared falling edge. Costs **1,028 B brotli** on `/hls`, all recoverable
  by omitting the behavior — of which **612 B** is the legacy fallback
  alone, separately deletable when WebKit stops needing it
  (`engine-drm-optional.test-d.ts` pins the behavior slot-neutral, and
  `media/dom/fairplay-legacy.ts` is reachable only through it).
  Video engine only: the audio-only engine composes no DRM. When EME
  refuses `generateRequest` during the session — measured, not
  hypothetical — the behavior hands over to `media/dom/fairplay-legacy.ts`
  on that refusal alone, awaiting the EME detach first because
  `webkitSetMediaKeys` is synchronous, then reloading the resource once
  the revoked MediaSource blob has left the `<source>` children. Serving
  the cached `webkitneedkey` payload instead was tried and the legacy CDM
  refused the session outright (`MEDIA_KEYERR_UNKNOWN`, no license ever
  requested), so the `load()` is required and the payload from before it
  is not reused; position and playing state are restored across it.
- **Per-key-system composability:** each system is one
  `KeySystemModule` value (`media/drm.ts` for the DOM-free contract,
  `media/dom/key-systems.ts` for `widevineKeySystem`,
  `playReadyKeySystem`, `fairPlayKeySystem`, `DEFAULT_KEY_SYSTEMS`),
  carrying its `keyFormats`, request-string variants, init-data types,
  preferred video robustness, encryption-scheme fallback, manifest
  init-data projection, and license-message shaping. `config.keySystems`
  narrows the list; dropping `playReadyKeySystem` removes its PSSH wrap,
  its XML envelope unwrap, and `DOMParser` from the bundle. Each shipped
  module carries its id as a literal type, and the DRM behaviors type
  `drm` as `NegotiableDrmSystemsConfig`, a `KeyedBy` record that
  `createComposition` (and each engine's `createEngine`) checks against
  the composed `keySystems`, so a config entry no module claims is a type
  error (it replaced a dev-only runtime warning). Replaces six
  string-keyed lookup tables that previously split one system's facts
  across the DOM boundary.
- **Droppability (measured 2026-08-27):** DRM costs +2,760 B gzipped
  over the pre-DRM engine; a composition omitting the two behaviors and
  the two DRM-aware config defaults recovers 2,512 B of that (**91%**),
  leaving ~248 B residue — ~130 B parser key metadata, 11 B `drm`
  config threading, 10 B the gate read in `load-segments`, the rest
  unrelated branch-era churn. Pinned by
  `playback/engines/hls/tests/engine-drm-optional.test-d.ts`, which
  asserts the DRM-free composition materializes none of the three DRM
  slots. The DRM-free **engine variant** is not built yet; the
  measurement patches `engine.ts` directly. A spread-based additive
  variant (`[...BASE_PRE, setupMediaKeys, ...BASE_POST]`) typechecks
  with inference intact, so it needs no duplicated behavior list — the
  cost that sank the short-lived `createDrmHlsVideoEngine`.
- **Consumer contract already landed:** `source.drm` is typed by
  `@videojs/media`'s `DrmSystemsConfig` (`packages/media/src/core/drm.ts`) —
  license servers keyed by EME key-system id, `licenseUrl` + optional
  `serverCertificateUrl` — and is already consumed by the hls.js bridge
  (`adapters/hlsjs-video/src/drm.ts`), the native FairPlay implementation
  (`adapters/native-hls-video/src/fairplay-eme.ts` + `fairplay-webkit.ts`,
  including a DRM error taxonomy), and the Mux token derivation
  (`adapters/mux-video/src/drm.ts`, one DRM token → all three systems' URLs). The SPF `mux-video` adapter derives
  Mux's three license servers from `drm.token`, with entries naming
  servers outright overriding them; the SPF `hls-video` adapter consumes
  `source.drm` directly, naming every composed key system up front with a
  resolver that reads whatever source is current, so the engine is never
  rebuilt when the source changes. A Mux DRM CMAF
  playlist fixture (Widevine PSSH + PlayReady PRO + FairPlay `skd://`, all
  `METHOD=SAMPLE-AES`) exists at
  `packages/spf/src/media/hls/tests/fixtures/drm-cmaf-video.m3u8`.
- **Definition depth:** sketched — scope identified from GitHub issue
  + prior art (including a 2026-08 survey of hls.js, Shaka, dash.js,
  and rx-player DRM architecture), and the EME setup / license flow /
  per-key-system phases below are implemented and tested, and the
  `keystatuschange` report-only baseline landed (see Open questions).
  Still coarse: the key-status *policy* layer (re-request, exclusion)
  and security-level probing. The AirPlay handoff is built, unit-tested
  against stubs, and verified on a receiver from a macOS sender; an
  iPhone sender is unverified and has reported failures (see Open
  questions and § AirPlay session recovery below).
- **Hard prerequisite:** [capability-probing](./capability-probing.md)'s
  "Key-system capability probing" phase. The probe must resolve
  before this feature commits to a key system, sets up MediaKeys,
  or fetches a license. Crisp boundary per
  [clusters.md § Encrypted media (DRM)](./clusters.md#encrypted-media-drm):
  probing answers "can we?"; this feature answers "set it up."

## Phases of complexity

Scope slices around the implementation layers. Per-key-system
specifics are listed within a single phase row rather than as
separate phases.

| Phase | What | Notes |
|---|---|---|
| EME setup pipeline | Capability-probing's key-system verdict drives `navigator.requestMediaKeySystemAccess(...)`, which produces a `MediaKeys` instance attached via `mediaElement.setMediaKeys(mediaKeys)`. Ordering relative to MediaSource attachment is **not** spec-constrained the way this doc once claimed: Shaka and rx-player attach MediaKeys *after* `src`/MediaSource is linked (rx-player documents that ordering), hls.js gates fragment *loads* rather than MSE setup, dash.js gates nothing. The functional invariant is only that keys exist before encrypted data must decode. Sessions start manifest-driven (`MediaKeySession.generateRequest` with playlist-derived init data), with the `encrypted` event as fallback | Shared infrastructure regardless of key system. The SPF composition question is where the readiness gate composes — see Likely cross-cutting impact; the lean is a gate on the segment-load path, leaving `setupMediaSource` untouched in every variant |
| License flow | Per-source license-server configuration via the landed `DrmSystemsConfig` contract (`licenseUrl` + optional `serverCertificateUrl` per key system). `MediaKeySession.message` event → POST message to server → `MediaKeySession.update(licenseResponse)`. Per-key-system request/response quirks (PlayReady challenge-unwrap, FairPlay SPC/CKC bodies) live in internal adapters, as every surveyed engine does | The consumer contract is settled: `source.drm` (`packages/media/src/core/drm.ts`), already how Mux, hls.js, and native FairPlay are configured. Callback hooks (`licenseXhrSetup`-style request/response shaping) are deferred until a concrete need |
| Per-key-system specifics | Widevine, PlayReady, FairPlay. Per-system: init-data format (PSSH for Widevine, PRO box for PlayReady, content-id derivation for FairPlay), license URL conventions, license body format, server-certificate handshake (FairPlay), browser-API quirks. **FairPlay-AirPlay is a distinct key system from standard FairPlay** (see [capability-probing](./capability-probing.md)'s four-key-system enumeration) — active when content streams via AirPlay; entering/exiting AirPlay mid-playback is a *runtime state change*, not a compose-time variant, handled as a runtime handoff (built; see Status) | The shared pipeline + license flow above handle most of the machinery; each key system adds its own init-data + license-format adapters. In-repo references: `adapters/native-hls-video/src/fairplay-eme.ts` (FairPlay SPC/CKC + certificate handshake) and `fairplay-webkit.ts` (the legacy `WebKitMediaKeys` fallback); the Mux fixture shows Widevine/PlayReady keys arriving as complete PSSH / PRO `data:` URIs in `#EXT-X-KEY`. FairPlay-AirPlay sits as a runtime-switchable variant of FairPlay specifically |
| Key delivery and `keystatuschange` reactivity | Browser receives keys via `MediaKeySession.update()`; encrypted segments decrypt automatically. `MediaKeySession.keystatuses` Map tracks per-key status (`usable`, `expired`, `output-restricted`, `released`, etc.); `keystatuschange` event fires on changes. Engine reacts to status transitions (e.g., expired key → re-request) | The report-only baseline is implemented in `exchangeLicenses`: `expired` / `output-restricted` / `internal-error` transitions report SVTA 4003 / 4007 / 4014 so the silent-stall shapes are diagnosable. Richer handling stays consumer-policy-driven. Prior-art consensus (hls.js, Shaka, dash.js, rx-player): `output-restricted` / `internal-error` map to rendition-level exclusion, never a fatal error — SPF's constraint+filter pattern beside `excludeUnplayableTracks` |
| Security-level capability and constraint filtering | Probe device security level (Widevine L1 hardware-backed / L2 hybrid / L3 software-only; PlayReady SL150 / SL2000 / SL3000; FairPlay key-duration / persistent-vs-streaming model) via `MediaKeySystemAccess.getConfiguration()`. HDCP output-protection requirements similarly probed. Match against per-rendition security-level requirements (e.g., 4K HDR HEVC often requires L1 Widevine) and license-server policy. Write a `deviceSecurityLevel` constraint slot read by ABR / variant selection; renditions exceeding the device's level filter out, or the engine surfaces a failure when no compatible rendition remains | Constraint+filter pattern parallel to [rendition-selection-caps](./rendition-selection-caps.md) and [hevc-variant-selection](./hevc-variant-selection.md). Probing extends [capability-probing](./capability-probing.md)'s key-system probe with security-level configuration. Borderline classification (Media-src for "play protected content correctly"; Player for customer-policy caps) — current scope leans Media-src |
| Parser surface for key tags | `parseMediaPlaylist` surfaces structured key metadata (METHOD / KEYFORMAT / URI / KEYID) from `#EXT-X-KEY`, replacing today's boolean `encrypted` flag; multivariant parser surfaces `#EXT-X-SESSION-KEY` at presentation resolution. For Widevine / PlayReady the key URI is a `data:` URI carrying a complete PSSH / PRO (Mux emits this), so manifest-driven init data flows from the parsed-track output to the EME pipeline | Parser-side change. Today `#EXT-X-KEY` is recognized only enough to flag a rendition `encrypted`; the structured detail is dropped and `#EXT-X-SESSION-KEY` is unrecognized |
| Encrypted-event handling on `SourceBuffer` / mediaElement | `encrypted` event on `mediaElement` triggers session creation via init-data. Once keys are delivered, segment-append proceeds normally; the engine doesn't intervene per-segment | Cross-cluster MSE concern; segment-append flow is unchanged for encrypted streams aside from the key-readiness gate |

## What's in scope vs out of scope

**In scope:**
- All seven phases above for HLS protected content with EME-supported
  key systems (Widevine, PlayReady, FairPlay)
- MediaKeys / MediaKeySession lifecycle management (per-source setup,
  source-change cleanup)
- License fetcher with consumer-pluggable URL / headers / body
  transformation hooks
- Parser surface for `#EXT-X-KEY` and `#EXT-X-SESSION-KEY` tags
- `keystatuschange` event reactivity baseline (surface failures)
- Engine-composition variant for DRM-required content
- Security-level probing extension to capability-probing's key-system
  probe (returns supported security levels per key system via
  `MediaKeySystemAccess.getConfiguration()`)
- Security-level constraint slot (`deviceSecurityLevel`) + filter-
  pattern integration with rendition selection (parallel to
  `userVideoTrackSelection` in video-abr.md and per-cap slots in
  rendition-selection-caps.md)
- HDCP output-protection requirement detection and gating

**Out of scope (separate Media-src candidate features):**
- **Key-system capability probing** — owned by
  [capability-probing](./capability-probing.md). Crisp boundary:
  probing answers "can we?"; this feature answers "set it up."
- **Full-segment clear-key AES** (`METHOD=AES-128` and the AES-256
  family) — owned by [clear-key-aes](./clear-key-aes.md). Not DRM: a
  segment-pipeline decrypt keyed off the `identity` keyformat, no EME.
  The boundary is the keyformat. Such content misreports
  `SVTA_UNSUPPORTED_DRM_SYSTEM` today; correcting that diagnosis to name
  the real gap is this feature's error-surface concern, and lands ahead
  of any decryptor.

**Out of scope (different architectural layer):**
- Adapter-layer customer-facing API surfaces (e.g., a Mux Player
  `drm-token` attribute, a consumer-passed license-server URL config).
  The SPF feature owns the engine-side license fetcher with pluggable
  hooks; the adapter / consumer provides the actual URL, headers,
  authentication tokens. videojs-contrib-eme's `keySystems` config
  shape is one reference for the consumer surface.
- License-server hosting and DRM token signing. Service-side concerns.
- Per-device key-system installation, content-decryption-module
  updates. Browser / OS responsibilities.
- DRM error UX (license expired, output not permitted) above the
  engine. Engine surfaces failures; adapter renders UX.

## Likely cross-cutting impact

Things this feature probably forces decisions on, not just additions:

- **Key-readiness gate placement — composition-variant placement.**
  The functional requirement is that keys are available before
  encrypted data must decode; no surveyed engine gates MediaSource
  attachment on MediaKeys. Prior art: Shaka sets `video.src` first and
  calls `setMediaKeys()` after (deferring further for FairPlay);
  rx-player attaches MediaKeys only once the MediaSource is linked and
  blocks segment push until then; hls.js gates fragment loads on key
  readiness (including the last clear fragment before an `#EXT-X-KEY`
  boundary); dash.js gates nothing and lets the element stall. Today's
  MSE gates per [mse-mms-pipeline.md](./mse-mms-pipeline.md):
  MediaElement + presentation URL + `'open'` readyState gate
  `setupMediaSource`; resolved track + open MediaSource gate
  `setupSourceBuffers`. Per the failure-mode catalog's composition-
  variant entry: variant-specific behaviors compose into DRM-required
  engine variants, not as runtime branches in always-on behaviors.
  Three shapes:
  - **(a)** DRM-required engine variant composes a *different*
    `setupMediaSource` that gates on a `mediaKeysReady` signal before
    attaching; standard `setupMediaSource` composes into non-DRM
    engines unchanged.
  - **(b)** A new `setupMediaKeys` behavior writes to a generic
    "ready-to-attach" gate slot that `setupMediaSource` reads;
    standard engines provide a default-true writer for the slot.
  - **(c)** `setupMediaSource` is untouched in every variant; the DRM
    variant composes the gate on the **segment-load path** (an FSM
    precondition on `mediaKeysReady` in the load behaviors), mirroring
    hls.js's fragment-load gate and rx-player's push-block, and
    matching the existing gate-shape convention (FSM precondition
    state with `monitor`-driven exit).
  **Resolved: (c).** Implemented as `state.segmentLoadingBlocked`, read
  by the `load*Segments` dispatchers and deliberately *not* by
  `setupMediaSource` — that asymmetry in what each gate forbids is why
  it is a separate slot from `loadingSuspended` rather than folded into
  it. The slot names the prohibition, not the domain, so
  `load-segments` carries no DRM vocabulary.
  Beyond that gate, additional DRM gates fire downstream:
  capability-probing's key-system verdict (Tier 1 gate, fires once
  per source); per-session license obtained + `keystatuschange`
  confirms at least one `usable` key (fires on key delivery,
  decryption is async beyond this gate).
- **Composition variant for DRM-required content.** DRM-required
  engine variants compose additional behaviors (MediaKeys setup,
  license fetcher, encrypted-event handler) atop the standard
  composition; DRM-free engines don't carry the machinery. Same
  shape as the live / DVR / LL-HLS variant pattern. The decision
  point — does the consumer opt into a DRM variant upfront, or does
  the engine detect DRM from `#EXT-X-KEY` / `#EXT-X-SESSION-KEY`
  parser output and route accordingly — is open. Adapter-upfront
  is simpler; detect-and-route is more adaptive.
- **State slots for DRM lifecycle.** Resolved as three, each
  single-writer: `state.segmentLoadingBlocked` (the load gate,
  `setupMediaKeys`), `state.negotiatedKeySystem` (the chosen system, or
  the `NO_KEY_SYSTEM` sentinel when negotiation was refused), and
  `context.mediaKeys`. No `drmReady`: nothing needed the conjunction.
  The sentinel exists because "not yet negotiated" and "refused" are
  different facts for rendition pruning, and encoding the second as a
  reserved string keeps the slot `string | undefined` — real key-system
  ids are reverse-DNS, so they cannot collide.
- **Verdict ownership.** `setupMediaKeys` reports only the *cause*
  (`SVTA_UNSUPPORTED_DRM_SYSTEM`). The *verdict* stays
  `track-switching`'s: publishing `NO_KEY_SYSTEM` re-fires its
  constraint chain, where `excludeRefusedKeySystems` prunes every
  encrypted rendition, so a type left with nothing reports
  `SVTA_NO_SUPPORTED_{VIDEO,AUDIO}_TRACK` from its owner and a type
  keeping a clear rendition still reports nothing. The constraint
  reaches the chain through the engine's `videoConstraints` /
  `audioConstraints` config, which replace each variant's whole
  pre-pass: the engine defaults them to `[...DEFAULT_*_CONSTRAINTS,
  excludeRefusedKeySystems]`.
- **Encrypted-segment buffer behavior.** Once keys are delivered,
  the MSE pipeline appends encrypted segments unchanged. The
  encrypted-event flow happens *before* steady-state appending. No
  per-segment decrypt overhead from the engine's perspective; the
  browser handles decryption transparently. The MSE codec-change
  check does not fire — DRM doesn't change codec.
- **Source-replacement cascade under DRM.** When the consumer
  changes `presentation.url`, the existing MediaKeys / MediaKeySession
  tear down; the new source's DRM setup runs fresh. Standard
  resolved/unresolved cascade per
  [source-replacement.md](./source-replacement.md), with MediaKeys
  cleanup as an additional in-place cleanup target.
- **License-fetcher composability.** The consumer contract is settled:
  `source.drm`'s `DrmSystemsConfig` (`packages/media/src/core/drm.ts`) —
  declarative license-server URLs per key system — already describes
  Mux (`createMuxDrmSystems` derives every URL from one DRM token),
  hls.js, and native FairPlay. Per-key-system body/header quirks live
  in internal adapters. Pluggable request/response hooks
  (videojs-contrib-eme's `getLicense`, hls.js's `licenseXhrSetup`) are
  deferred until a concrete consumer need; nothing in the Mux path
  requires them.
- **Per-key-system browser-API differences.** Widevine, PlayReady,
  FairPlay all have spec-compliant EME surfaces, but the
  init-data formats, license-message formats, server-certificate
  handshakes, and key-status semantics differ. Per-key-system adapter
  modules (one per sub-issue) handle the system-specific logic; the
  shared EME pipeline calls into them via a uniform interface.

## Verification

Unit tests cover the key-system configuration the engine builds, including the invariant that a
negotiation offers no unstamped capability. That invariant is not self-evident, so it is worth stating
why it exists: Chromium warns "It is recommended that a robustness level be specified" for **any
configuration in the requested list** that omits `robustness` — not only the one it accepts. Reading the
accepted configuration instead is what let three separate fixes ship believing the warning was gone.

Confirming the warning is actually absent needs a real CDM, so it lives in an opt-in E2E suite:

```bash
pnpm test:e2e:drm
```

`apps/e2e/suites/drm` negotiates against a real Widevine CDM and asserts both halves — every requested
capability names a tier, and Chromium logs no robustness warning. It borrows the CDM from a local Google
Chrome install and runs headed, because a CDM will not provision otherwise; where Chrome is absent the
suite skips itself rather than failing. It is deliberately outside `test:all`, since hosted CI cannot
satisfy it.

The `drmContext` fixture in that suite owns the launch recipe — a persistent profile with the CDM copied
in, and the component updater left enabled. Four simpler shapes were measured and all reach ClearKey
only; the fixture's own comment records them, so a second DRM test inherits a working CDM rather than
rediscovering it.

### EZDRM over AirPlay: unresolved

EZDRM plays locally on this branch — Safari/macOS, over MSE, where the `sinf`
session decrypts and no content id is involved. **Over AirPlay it has not played
yet.** Recorded here because the next person will otherwise re-derive it.

What was measured (macOS/Safari 26.6.2 → Roku TV, 2026-09-16):

- Two attempts died during WebKit's pipeline switch before the receiver ever
  requested a key — `WebKitBlobResource error 1`, which is resource selection
  hitting the revoked MediaSource blob.
- One attempt reached the legacy license exchange and EZDRM answered **HTTP
  500**, retried four times by `fetchWithRetry` and reported as SVTA 4004.
- That 500 is uninformative on its own: the endpoint answers 500 for *any*
  malformed input, including an empty body (probed directly).

Two fixes landed **after** those runs and have never been exercised together on
EZDRM — the content-id resolver and the blob-source guard on the handover's
reload. The 500 attempt in particular predates the resolver, so it was sending a
content id we now know was wrong.

Research says the shapes are right. Shaka's shipped EZDRM helper derives the
content id as `initDataAsString.split(';').pop()`, which is byte-for-byte what
`hls-drm-ezdrm`'s `fairPlayContentId` now does, and its request handler is
`octetStreamFairPlayRequest_` — the raw-SPC octet-stream POST that is already
this engine's default. Worth noting how unstandardised this is: Shaka's *default*
content id is the URI's **domain**, where Apple's sample and this engine's
default take everything after the scheme. Three defaults, three answers.

So a further attempt is justified, and the open question is narrow: whether the
session survives the handover at all on this stream. If it does and EZDRM still
500s, the next evidence would have to come from EZDRM — the demo endpoint gives
nothing back to work with.

One thing that attempt has already established: **EZDRM over AirPlay fails in
Shaka too** (macOS Safari 26.6.2 → Roku), at the same `generateRequest` refusal,
on its native-HLS path. So this is not an EZDRM-versus-this-engine problem —
every player hits the same wall, and this engine is the only one that tries to
get past it.

### Android Chrome / Widevine L1: verified 2026-09-17

Closed on a **SauceLabs real Android device** driving the public Vercel preview of
the `spf-drm` sandbox page. This was the last cell with no empirical signal, and
the one that mattered most: the ladder began leading with `HW_SECURE_ALL` on
2026-09-08, and every desktop CDM in the matrix stops at `SW_SECURE_DECODE`, so
nothing else ever exercised the leading rung.

The probe answered it outright — `com.widevine.alpha` accepted **all six** rungs:

```
HW_SECURE_ALL, HW_SECURE_DECODE, HW_SECURE_CRYPTO,
SW_SECURE_DECODE, SW_SECURE_CRYPTO, (unstamped)
```

A hardware-backed CDM, so a genuine L1 device rather than a farm image degraded to
L3. On the Mux source it then negotiated `com.widevine.alpha` over MSE
(`sources: ['blob(mse)']`, `initDataType: 'cenc'`, 570-byte init data) with keys
attached on both sides (`mseKeys` and `elementKeys` true) and an empty `errors`
list. CWIP, Axinom and Axinom MultiKey behaved as on every other environment, and
the unlicensed source refused with 4008 causes then the 2011 verdict.

**One soft edge, recorded honestly:** the status readout prints the negotiated
*key system*, not the negotiated *robustness*. That the CDM accepts `HW_SECURE_ALL`
is measured; that the engine's negotiation actually settled on it is inferred —
soundly, because `HW_SECURE_ALL` is the ladder's first rung and the CDM accepts
it, so the first pass succeeds and no path descends to a lower rung. Surfacing the
negotiated robustness in the readout would make this direct rather than inferred,
and is the obvious small follow-up if the distinction ever matters.

The original worry — the hardware-first rung negotiating a configuration Android
then cannot decode over MSE — did not materialize.

**How to re-run this cell**, since the mechanics are non-obvious:

- SauceLabs **supports DevTools for Android Chrome**, so the console is readable;
  this is what made the probe line reachable at all.
- Use the branch's Vercel preview for a public HTTPS origin. EME needs a secure
  context, so a plain-HTTP tunnel will not do.
- **Do not read the video region.** An L1 CDM decodes into secure memory and
  Android excludes secure surfaces from screen capture, so a working L1 stream is
  *black* in any device-farm view. Judge by `framesDecoded`, `currentTime` and
  `errors` instead — pixels are evidence of nothing here, in either direction.

### AirPlay handoff: manual

No automated coverage reaches this path — Playwright cannot drive an AirPlay picker, and the receiver is
a second physical device. The unit tests pin protocol and lifecycle against stubs; the device pass below
is what proves it. **Passed 2026-09-16** on macOS/Safari 26.6.2 → Roku TV for the Mux source with AirPlay
engaged mid-playback; the other steps remain unexercised. Re-run it whenever the handoff or the legacy
module changes:

1. Start the opt-in HTTPS sandbox (`apps/sandbox/vite.config.https.ts`; `SANDBOX_HTTPS_CERT` /
   `SANDBOX_HTTPS_KEY` for a warning-free origin) and open the `spf-drm` page in macOS Safari.
2. On `hls-drm` (Mux) and `hls-drm-ezdrm`: play locally, engage AirPlay mid-playback, and confirm the
   receiver keeps playing *decrypted*. Disengage; confirm local playback resumes decrypted at position.
3. Repeat engaging AirPlay *before* first play, and changing source during a live session.
4. Watch the errors sequence at every transition — SVTA 4004 / 4013 / 4016 / 4021 are the handoff's
   failure surface, and a silent stall means the receiver never got a key.

5. Repeat 2 and 3 with an **iPhone** as the sender. Unverified as of 2026-09-22, with failures reported —
   see § AirPlay session recovery. Attach Safari Web Inspector to the phone first: the `[spf-drm]`
   transition log and any `[setupMediaSource]` warning are the evidence to capture.

If a request never reaches `setupAirPlayFairPlay`, check `generateRequest` for `NotSupportedError`: that
is the Apple sender bug the deferred legacy fallback exists for (see Open questions), not a fault in this
path.

### AirPlay session recovery: after a failed source, and after an iPhone session

Two measured facts and one reported one, recorded together because the next person will otherwise
re-derive them.

**A failed source leaves the session engaged, and nothing on the page can end it** (macOS/Safari 26.6.2,
2026-09-16). With a source that fails mid-session, removing the element and reloading the page both leave
the AirPlay session live, and the native picker will not offer "turn off" without a playable resource. The
only recovery found is to give the element something playable again — detach it from the engine, drop its
`<source>` children, set a clear `src`, `load()` — after which the picker becomes usable and the *user*
disconnects. That is a recovery affordance, not a disconnect, and the engine does not perform it. It
supersedes an earlier note that a page reload disconnects, which held only with a playable source. The
programmatic disconnect the Remote Playback API specifies (`disableRemotePlayback = true`, §5.3.2) is not
honored by WebKit for AirPlay, measured 2026-07-31. There is no known way to force a disconnect from code,
which is also why no automated coverage reaches this path.

**Reported 2026-09-21 by Santi Puppo, iPhone sender, not yet reproduced with instrumentation:** after an
AirPlay session ends — whether it failed, was paused and resumed before disconnecting, or was engaged
before first play — the engine is left with the sandbox readout showing one `blob(mse)` source, every
media value at zero, and `negotiatedKeySystem` reading `com.apple.fps`. Also reported: casting sometimes
starts audio-only, and does not start at all while muted, both recovering on pause then play.

**What that readout is consistent with, from the code (a hypothesis until the phone is instrumented):**
the post-session MediaSource rebuild never reaching `sourceopen`. On the falling edge `setupMediaKeys`
re-enters and negotiates, which sets `negotiatedKeySystem`; `setupMediaSource` rebuilds, prepends the blob
`<source>`, calls `load()`, and publishes `context.mediaSource` only once the MediaSource opens, so nothing
downstream starts until then; with no published MediaSource and no live session, `setupAirPlay`'s source
effect removes the native fallback, leaving `sources=[blob(mse)]`. `setupMediaSource` warns when the
MediaSource lands non-open before its first `sourceopen` and calls the state "recoverable on next source
reset", but nothing triggers a reset, so it is a dead end; the case where `sourceopen` never fires at all
warns nothing. Why an iPhone's MediaSource would not open after a session is not known — candidates are the
element having been through native HLS with legacy WebKit keys released on the same edge the rebuild loads
on, and the wireless flag flapping differently on iOS than the macOS sequence the settle window was tuned
against. A device pass with the Web Inspector attached decides it.

**Is this iPhone-specific? There is no evidence either way.** The macOS receiver pass covered one
transition — engage mid-playback, receiver plays — and this record's open question lists disengage as
unexercised. The disengage round trip that *was* verified on a receiver (2026-07-31, both playing and
paused branches) predates every DRM behavior. So the post-session rebuild with DRM composed — `setupMediaKeys`
re-entering, the legacy path having already reloaded the element and released its keys — has never been
device-tested from any sender. The one measured macOS-only fact is the unkillable session after a failed
source, and Santi could disconnect on the iPhone, which may be receiver rather than OS. Reproduce his
sequences from macOS first: it is the cheaper rig, and if the deadlock reproduces there it is the DRM
falling edge, not iOS.

**Scope — decided 2026-09-22:** the failed-connection cases were placed out of scope for this push because
they cannot be forced programmatically, and that decision applies to these reports as well. They are the
same class — the engine's state after an AirPlay session ends badly — and there is no evidence of a new
one. They are recorded here and deferred, not gates on #2291, even though the post-session disconnect is
inside this record's own manual checklist (step 2), which has never run with DRM composed. The candidate
fix is a self-healing rebuild in `setupMediaSource` (re-derive a fresh attach when the open-wait lands
non-open, bounded per presentation), preceded by the instrumented device pass above; it is a change to the
MediaSource lifecycle, not to the DRM behaviors, and is tracked as
[#2944](https://github.com/videojs/v10/issues/2944).

## Open questions

- **Variant-decision signal source.** Adapter-upfront opt-in (consumer
  knows the source is DRM-protected, instantiates a DRM-capable
  engine variant) vs detect-from-parser (engine sees `#EXT-X-KEY` and
  routes to DRM-capable composition). Adapter-upfront is simpler;
  detect-and-route is more adaptive but adds composition-time-
  decision complexity.
- **Composition-variant shape for the key-readiness gate.** Per the
  cross-cutting note: variant `setupMediaSource` (a) vs generic
  ready-to-attach slot (b) vs segment-load-path gate (c). The
  prior-art survey removed the premise that `setMediaKeys` must
  precede MediaSource attachment, which is what made (a) attractive.
  Lean: (c) — confirm against the load behaviors' FSM shape when
  implementation starts.
- **FairPlay-AirPlay runtime handoff.** Resolved 2026-09-11, built
  2026-09-16 including the legacy fallback, and **verified playing on a
  receiver the same day**: macOS/Safari 26.6.2 → Roku TV, Mux FairPlay
  source, AirPlay engaged mid-playback. EME is refused, the session hands
  over to the legacy key system, and the receiver plays decrypted.

  Verified on one sender, one receiver, one provider, one transition.
  Still unexercised from a macOS sender: engaging before first play, a
  source change during a session (its license-URL re-resolve is now
  guarded per request, `59dfff448`, but not device-exercised), EZDRM,
  and Apple TV — the last matters least now, since the sender bug
  reproduces independently of receiver. **An iPhone sender was exercised
  by Santi Puppo on 2026-09-21 and fails after the session ends** — see
  § AirPlay session recovery for the report, the code-level hypothesis,
  and the scope call.

  **The legacy `WebKitMediaKeys` / `com.apple.fps.1_0` fallback is no
  longer deferred — it is required.** Its deferral was conditioned on a
  device re-check of the Apple sender bug that elements PR
  [muxinc/elements#1277](https://github.com/muxinc/elements/pull/1277)
  works around, on the guess that iOS/macOS 26.1–26.2 "may since be
  fixed". That re-check ran on 2026-09-16 and it is not fixed:

  - **macOS/Safari 26.6.2 → Roku TV**, driving this engine: negotiation
    for `initDataTypes: ['skd']` succeeds, then `generateRequest` throws
    `NotSupportedError` — SVTA 4021, with `webkitneedkey` firing for the
    same key alongside the `skd` `encrypted` event.
  - **iOS 26.6.1 → macOS 26.6**, driving Apple's own FPS sample player
    against a Mux asset — no engine involved. Plays on the sender, fails
    when cast. Independently reproduced by Santi Puppo; the sample is
    archived in Slack (`FairPlay DRM AirPlay bug test suite iOS 26`).
  - **Shaka Player 5.x**, its own demo, macOS Safari 26.6.2 → Roku TV.
    Both Mux and EZDRM fail on engaging AirPlay with
    `DRM.FAILED_TO_GENERATE_LICENSE_REQUEST`, whose payload is the same
    `NotSupportedError`. Shaka uses **native HLS** for FairPlay on Safari
    (`useNativeHlsForFairPlay`), so this reproduces with no MediaSource
    anywhere — the bug is not MSE-specific.

  Three independent implementations, two providers, two receivers, two
  sender OS versions, and both the MSE and native-HLS pipelines. The
  fault is WebKit's, not this composition's, and not any engine's.

  **Shaka has no legacy fallback and stops there; this engine plays.**
  That is the clearest statement of what the fallback buys: on the same
  Mux source, same Safari, same receiver, the player without it fails and
  the player with it does not. That sample
  also corroborates the implementation: it filters to `skd`, negotiates
  against `application/vnd.apple.mpegurl`, and POSTs the raw SPC as
  `application/octet-stream` for a raw CKC — the conventions the engine
  already encodes.

  The fallback is not optional on this Safari: it is the only path that
  reaches a playing receiver today. Legacy lacks SPC v3 and works for
  `src=` only, so it stays the fallback and never the primary path — EME
  is still attempted first, and resumes being the path that works the
  moment WebKit stops refusing it. The EME handoff is needed
  regardless: the init-data type, not the bug, is what the MSE
  negotiation cannot satisfy. Delete the fallback when WebKit fixes this
  — nothing sniffs an OS, so a fixed sender stops taking the path on its
  own and the code goes cold before it goes away.

- **MediaKeys re-use across sources.** When the consumer changes
  sources within the same key system + license server, should the
  engine re-use the existing MediaKeys instance or tear down and
  recreate? Re-use saves the `requestMediaKeySystemAccess` cost but
  complicates lifecycle. Prior art splits: rx-player re-uses via a
  WeakMap-keyed attacher (MediaKeys + session cache across loads,
  guarded by config compatibility); hls.js tears down per manifest,
  serializing CDM cleanup across instances through a static promise;
  videojs-contrib-eme tears down per-source. Lean: teardown-per-source
  initially (matches the resolved/unresolved cleanup cascade); re-use
  is an optimization with prior art when needed.
- **`keystatuschange` reactivity policy.** The report-only baseline
  landed in `exchangeLicenses`: each session's `keystatuschange` is
  observed, and a key transitioning to `expired` / `output-restricted`
  / `internal-error` reports SVTA 4003 / 4007 / 4014 with the key id,
  deduped per key so CDM re-fires stay quiet while recovery-then-
  re-failure re-reports. Still open is the *policy* layer: automatic
  re-request on expiry, and rendition exclusion on output restriction
  (prior-art consensus: exclusion, never fatal). Defaulting matters
  because keystatus changes can fire mid-playback.
- **Init-data extraction location.** Partially resolved by prior art +
  Mux's manifests: for Widevine and PlayReady the `#EXT-X-KEY` URI is
  a `data:` URI carrying a complete PSSH / PRO (hls.js uses it as-is),
  so parser-side manifest-driven init data is the primary path and the
  `encrypted` event is the fallback; FairPlay's `skd://` URI has no
  playlist init data, so it stays event-driven (`sinf`). Residual:
  where the fallback listener lives and how the two paths dedupe
  sessions.
- **Cross-feature: DRM + live / DRM + DVR.** Live and DVR streams
  with DRM are valid use cases. The reload-loop interacts with key
  renewal cadence (if licenses expire during a long live session,
  the reload-loop + license-fetcher may both need re-trigger logic).
  Cross-cluster A + F open question; resolution likely after both
  clusters have implementation work.
- **Key rotation ≠ live (current scope).** Rotation and liveness are
  independent, and only one cell is unsupported. `exchangeLicenses`'
  manifest loop licenses every key declared at entry, so **VOD key
  rotation** (all `EXT-X-KEY` present at load) is covered, and
  **FairPlay live rotation** rides the `encrypted` fallback (each key
  licensed as its segment appends). **Single-key live** (Mux) is
  covered. The one gap is **mid-stream rotation for Widevine /
  PlayReady on a live reload**: the entry captures the presentation
  once (single-positive-state reactor, for source identity), later
  reloads' keys are never re-scanned, and the `encrypted` fallback
  isn't armed for manifest-licensed content. The fix — a reactive
  re-scan of `declaredDrmKeys` (dedup by manifest attribute identity,
  reusing `toInitData` → `openSession`), or licensing on `encrypted`
  encounter — also subsumes the eager per-key license fan-out, so the
  two are one design question. Unverified even for VOD: no
  temporal-rotation asset exists in the test set, and generating a
  real-DRM one needs a license server serving rotating keys
  (clear-key / CENC rotation wouldn't exercise the WV/PR/FP path).

  **The same entry-time capture has a second consequence, on VOD, found
  by Cursor Bugbot on #2291 and confirmed 2026-09-17: per-tier keys are
  licensed only for the variant selected at entry.** `resolve-track`
  gates on a selection, so only the selected rendition's media playlist
  is resolved, and `declaredDrmKeys` counts keys on resolved tracks
  only. A studio-policy ladder with a distinct KEYID per tier therefore
  declares one key at entry; `exchangeLicenses` cannot re-enter to see
  the rest, because `derivedStateSignal` stays `'licensing'` for any
  resolved presentation. An ABR switch across a key boundary then has
  no session for the new key. `#EXT-X-SESSION-KEY` — the standard way
  to declare every key up front — is deliberately not parsed, so
  nothing masks it. The multi-key pin test passes because it is handed a
  presentation with every variant already resolved, which the engine
  does not produce at entry.

  **Axinom's MultiKey vector is a live repro, measured from its
  manifests 2026-09-17:** five variants, **two** distinct KEYIDs split
  at the 480->720 boundary (288/360/480 on `C83C4EA8...`, 720/1080 on
  `C868C702...`), no `EXT-X-SESSION-KEY`, and each variant playlist
  declaring only its own key — as a Widevine PSSH and an `skd://` URI
  naming the same keyid. It plays because a smoke that stays on one side
  of that boundary only ever needs the key it licensed. Crossing it
  needs a key with no session. This also corrects a claim carried in
  the sandbox source comment and the risk assessment, that the asset
  shows a license POST per ladder key at startup: only the selected
  variant is resolved, so exactly one key is declared and one license
  fetched. The fan-out is over *declared* keys, which in production is
  one.

  The fix is the same reactive re-scan named above, which is why this is
  tracked with on-demand licensing in #2863 rather than separately.
- **Output-protection-aware ABR coordination.** Renditions tagged
  with security-level / HDCP requirements interact with video-ABR
  and hevc-variant-selection. ABR's candidate set should be filtered
  by the `deviceSecurityLevel` constraint slot before bandwidth-
  driven selection runs. Filter ordering: capability filter
  (physics) → policy caps → security-level → bandwidth-driven
  selection. Per-rendition requirement tagging is open: parser-
  surfaced HLS extension attributes vs runtime-probed via license-
  server policy vs both. Server-side conventions vary.
- **Per-rendition security-level tag surface.** HLS doesn't have a
  spec-defined attribute for "this rendition requires L1 Widevine."
  Providers commonly encode the requirement in proprietary attributes
  (`URI-SECURITY-LEVEL`, etc.) or imply it from `RESOLUTION` thresholds
  (4K+ requires hardware DRM by convention on many platforms). Parser
  needs an extension axis for surfacing the requirement; license-
  server policy is the orthogonal source.

## Related features

- **[capability-probing](./capability-probing.md)** *(hard
  prerequisite)* — owns key-system probing; this feature consumes the
  verdict. Crisp boundary: probing = "can we?"; this feature =
  "set it up."
- **`[fairplay-airplay-workaround]`** *(candidate)* — the legacy
  `WebKitMediaKeys` fallback for senders whose EME cannot generate a
  request during an AirPlay session. Real work only if the device
  re-check shows the Apple bug persists; the EME handoff itself lands in
  this feature.
- **[mse-mms-pipeline](./mse-mms-pipeline.md)** — DRM gates MSE
  setup; encrypted-event flow on `mediaElement` triggers session
  creation. Once keys are delivered, segment append proceeds
  unchanged.
- **[capability-probing](./capability-probing.md)** — also relevant
  for `changeType()` probing if mid-stream codec changes interact
  with DRM (uncommon but possible).
- **[source-replacement](./source-replacement.md)** — MediaKeys /
  MediaKeySession cleanup on source change. Standard resolved/
  unresolved cascade with DRM additions.
- **[live-stream-support](./live-stream-support.md)** *(not yet
  implemented)* — DRM + live combines naturally; license-renewal
  cadence during long live sessions is the open question.
- **[dvr-event-stream-support](./dvr-event-stream-support.md)** *(not
  yet implemented)* — DRM + DVR with back-seek through history; key
  delivery for back-seek-fetched segments needs verification.
- **[video-abr](./video-abr.md)** / **[hevc-variant-selection](./hevc-variant-selection.md)**
  — output-protection-aware variant filtering when `drm-security-
  levels` lands.

## See also

- [GitHub issue #1776 — Feature: SPF DRM](https://github.com/videojs/v10/issues/1776)
  — the tracking issue; the shipped legacy-engine work lives under
  [#1411](https://github.com/videojs/v10/issues/1411) ("DRM API for
  Legacy Engine Medias") and its closed sub-issues
- [clusters.md § Encrypted media (DRM)](./clusters.md#encrypted-media-drm)
  — cluster F description; this feature is the foundation
- [clusters.md § Capability probing](./clusters.md#capability-probing)
  — cluster D; the probing prerequisite this feature consumes
- [clusters.md § Feature classification axes](./clusters.md#feature-classification-axes)
  — Media-src feature framing
- [capability-probing.md](./capability-probing.md) — hard
  prerequisite; key-system probing
- [videojs-contrib-eme](https://github.com/videojs/videojs-contrib-eme)
  — Video.js v8 prior art; key-system detection in
  [`src/cdm.js`](https://github.com/videojs/videojs-contrib-eme/blob/main/src/cdm.js)
- [Mux Player DRM integration](https://www.mux.com/docs/guides/protect-videos-with-drm)
  — adapter-layer prior art; `drm-token` attribute on `<mux-player>`
- [W3C Encrypted Media Extensions](https://www.w3.org/TR/encrypted-media/)
  — EME spec; [`MediaKeySystemAccess.getConfiguration()`](https://www.w3.org/TR/encrypted-media/#dom-mediakeysystemaccess-getconfiguration)
  is the security-level probing surface
- [HDCP specification (DCP LLC)](https://www.digital-cp.com/) —
  output-protection requirements; the protection-level data this
  feature gates on for high-resolution / premium content
- [HLS Spec — `EXT-X-KEY` / `EXT-X-SESSION-KEY`](https://datatracker.ietf.org/doc/html/rfc8216bis)
