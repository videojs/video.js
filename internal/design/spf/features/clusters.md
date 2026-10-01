---
status: draft
date: 2026-05-20
---

# Feature Clusters & Cross-Cluster Patterns

Heuristics for grouping SPF features by the areas of state and behavior they touch. Used by the `extend-feature` skill (and, later, the intake/scoping skill) to identify related features, point the skill at the right reference material, and surface cross-cutting impacts when a new feature lands.

## How the skill uses this doc

When a feature is being documented or extended, two questions recur:

1. **What other features does this likely interact with?** Cluster membership is the first-order answer.
2. **What cross-cutting concerns does this likely involve?** Cross-cluster patterns are the second-order answer.

The skill consults this doc at multiple steps:

- **Source gathering** — trigger signals identify likely clusters from the user's invocation, expanding the related-context net.
- **Code grounding** — clusters point Explore at the right files.
- **Cross-cutting concern checks** — clusters and patterns drive which checks fire (e.g., buffer-touching → MSE codec-change check; new state-slot writer → multi-writer characterization).
- **Relationships** — clusters' existing + anticipated docs become the seed set for `Related features`.
- **Cross-doc cascade** — clusters identify which other docs are candidates for narrow update once the new feature lands.

## How this doc grows

Both clusters and patterns are extract-from-real-work — no speculative additions. Triggers for updating:

- A new feature surfaces a signal not covered → extend an existing cluster or file a new one.
- A pattern recurs across two or more clusters → add to Cross-cluster patterns.
- A new feature gets documented → add it to the relevant cluster's Docs list.

## Notation

Existing features cite their file: `subtitles`, `video-abr`, `multi-language-audio`. Notion-cluster cross-references (e.g., "Notion cluster C") point at the SPF Epics Working Doc taxonomy.

Some features are **cluster-crossing**: every cluster produces into them and none owns them, so they carry no cluster membership and appear in no Docs list. [errors](./errors.md) is the first — each cluster's features detect their own error conditions, while that doc owns the representation, the fatal-vs-non-fatal derivation, and the adapter boundary. Look for it from any cluster rather than under one.

Unscoped feature candidates that previously appeared inline as bracketed names (e.g. `[ll-hls-support]`) have been pulled out — they're tracked separately as an unscoped backlog rather than as sibling-feature placeholders in cluster Docs lists. Documenting any of them routes through `/document-spf-feature`, which applies the decomposition rubric at invocation time and decides whether the item becomes a new doc, a phase of an existing doc, or absorption into another doc.

---

## Feature classification axes

Orthogonal to cluster membership, features can be classified along axes that surface during scoping. These distinctions are extracted from the SPF Epics Working Document (Notion) and recur during planning and doc work. They're useful both for new feature docs (knowing what category an item is) and for existing ones (locating where the feature sits on each axis when surfacing what's not implemented).

### Media-src vs Player vs Borderline

The primary cut for unimplemented work.

| Category | Definition | Examples |
|---|---|---|
| **Media-src feature** | Required to support a media-src permutation. Without it, the source either doesn't play or doesn't play correctly. "Correctness" means the engine handles the *presence* of the permutation type — playing one audio track of a multi-language source isn't supporting multi-language audio | `live-stream-support`, `multi-language-audio` |
| **Player feature** | Additive functionality not tied to making any source work. Player chooses to do it | *(no documented examples yet — shapes include billing- / viewport-driven selection caps and composition-mode features)* |
| **Borderline** | Accounts for technically valid but suboptimally-formed-or-delivered content (*content compensation*) or for response errors that emerge from playback behavior (*response-error handling*). The source plays; the work makes it play better in specific quirky cases | *(no documented examples yet — shapes include content-compensation for suboptimal sources and response-error handling)* |

### Naive vs Full implementation depth

Within a single feature; both depths are valid implementations. Used to scope inside a feature doc, not to split features.

| Example | Naive | Full |
|---|---|---|
| Termination detection (in `live-stream-support`) | `#EXT-X-ENDLIST` recognition only | ENDLIST + unchanged-playlist miss-counter fallback |
| Response error handling | Generic 4xx retry/backoff (≈ what hls.js does today) | Response-aware: detect specific signatures, adjust pacing |
| Stalled-playback detection | Don't detect — accept the stall | Heuristic detection of pseudo-ended state; fire `ended` correctly |
| Token expiry | Treat 4xx as fatal (≈ hls.js) | Provider-aware refresh / recovery hooks |

A feature doc may describe phases that span depth: a partial implementation at one depth still counts as work toward the feature.

### "Can play" vs actual support

For some features, the difference between "source plays" and "feature supported" is *not* a matter of implementation depth — it's the difference between unrelated correctness happening to hold and the feature actually being supported.

| Example | "Can play" (not partial credit) | Actual support |
|---|---|---|
| `multi-language-audio` | Source plays via the default audio track | Tracks recognized, exposed via API, selectable |
| `subtitles` (already supported) | Source plays without subtitles displaying | Tracks parsed, exposed, displayable |

The "can play" state does *not* count as partial credit toward the feature.

### Tier 1 (spec-compliant baseline) vs Tier 2 (custom behavior)

Especially applicable within the selection cluster but useful as a general lens. Tier 1 is generally a prerequisite for Tier 2 and easier to verify.

| Item | Tier 1: Spec-compliant | Tier 2: Custom behavior |
|---|---|---|
| `multi-language-audio` | Recognize tracks; honor `DEFAULT` / `AUTOSELECT` | Programmatic select + persistence API |

### Composition vs Policy vs middle pattern

A feature's *implementation shape* falls along a spectrum:

| Mechanism | Definition | Where it lives | Examples |
|---|---|---|---|
| **Policy** | Pure config / function variation consumed by an existing behavior. No new behaviors | Inside an existing behavior | *(no documented examples yet — shape: a height cap consumed by a `selectQuality` config)* |
| **Middle pattern** | A new state-producing behavior monitors an external signal and updates state; existing consumer behaviors update to respect that state. Heavier than pure policy but lighter than composition | New behavior + targeted edits to consumers | *(no documented examples yet — shapes: `ResizeObserver` → cap state → switching; CDN-tracking → selection state → failover; buffer-state monitor → ended signal; `initPTS` detection → offset state → append)* |
| **Composition** | A different composed engine. Alternative compositions assemble a variant via one or more composition mechanisms (subtract / add / alternative-implementation / alternative-default-configuration), in any combination, to handle different *modes* or *delivery scenarios*. See [`use-cases/README.md`](../use-cases/README.md) for the full doc-type, mechanism taxonomy, and decomposition rubric | At the Adapter level, on initial conditions | *(no instance docs yet; candidates in [`use-cases/README.md`](../use-cases/README.md) Index — `audio-only-mode-override`, `video-only-mode-override`, `background-video`)* |

Composition is bounded to **modes** and **delivery scenarios** — see [`use-cases/README.md`](../use-cases/README.md) for the doc-type that captures composition variants. Most "feels like composition" items actually fit the middle pattern.

---

## Clusters

### Engine lifecycle

Engine instantiation, source loading lifecycle, and per-source identity resets. The cross-cutting concerns that bracket everything else — preload semantics gate when work begins, source resolution drives the resolved/unresolved cascade that every downstream behavior rides.

**Signals.** `state.presentation` lifecycle (unresolved `{ url }` ↔ resolved `Presentation`); `state.preload` + `state.loadActivated` as the loading gate; `resolvePresentation`'s 4-state FSM (`'preconditions-unmet' → 'idle' → 'resolving' → 'resolved'`); `isResolvedPresentation` predicate; "ride resolver's resolved/unresolved lifecycle" pattern; `AbortController`-bound-to-state-exit cleanup; per-source-identity resets (`loadActivated`, `selected*TrackId`); cross-source preservation (`bandwidthState` for ABR resume).

**Docs.** `preload-modes`, `source-replacement`, `engine-adapter-integration`.

**Foundational primitives.** `state.presentation` as the source-identity slot; resolved/unresolved routing in `resolvePresentation` as the cleanup-cascade driver; the per-presentation-gated behavior cleanup contract (state-exit detaches DOM / destroys actors / aborts in-flight fetches); the composition's own `state` / `context` as the external write surface, with `declareInputs` for keys no behavior declares.

**Common cross-cluster touchpoints.** Every other cluster. Track & variant registry, MSE / Buffer management, and Presentation modeling all gate on resolved presentation; their setup behaviors tear down via the resolved/unresolved cascade. Time normalization survives across resets (`currentTime` DOM-side mirror via `trackCurrentTime`). Manifest reload loop is presentation re-resolution under live conditions — a special case of the same cascade.

**Key check.** New behaviors that gate on `isResolvedPresentation` MUST honor the state-exit cleanup contract: detach DOM resources / destroy actors / clear context slots / abort in-flight fetches on state exit. The in-place source-replacement validation test (`engine.test.ts` → "cleanly replaces source in place via state.presentation overwrite") pins this contract against regression.

---

### Track & variant registry

The selection model — which audio / video / text tracks are available, which is active, who can change the selection.

**Signals.** Track selection, switching, filtering, sorting; per-type tracks; state slots named `selected{Audio,Video,Text}TrackId`; behaviors named `select*Track`, `switch*Quality`, `sync*Tracks`; multi-writer track-id slots; manifest renditions with `LANGUAGE` / `NAME` / `DEFAULT` / `AUTOSELECT` / `FORCED` / `CHANNELS` attributes; `userVideoTrackSelection` and similar constraint slots.

**Docs.** `subtitles`, `video-abr`, `audio-playback`, `multi-language-audio`, `hevc-variant-selection` (cluster D consumer, video codec axis), `5.1-surround-selection` (cluster D consumer, audio channel-count axis), `audio-abr` (audio sibling of video-abr), `multi-signal-abr` (algorithm extension to ABR with non-bandwidth signals).

**Foundational primitives.** Per-track resolution (`resolveVideoTrack` / `resolveAudioTrack` / `resolveTextTrack` sharing `setupTrackResolution`); per-track selection (`selectVideoTrack` / `selectAudioTrack` for the simple default-pick path; `switchVideoTrack` / `switchAudioTrack` / `switchTextTrack` for the track-switching chain); the `selected*TrackId` slot family.

**Maps to Notion cluster C** ("Track & variant registry").

**Common cross-cluster touchpoints.** Multi-writer state slots (text + proposed audio); constraint + filter (video-abr's `userVideoTrackSelection`); per-type specialization (resolve / load / setup are per-type today).

---

### Selection policy

Modes, caps, and overrides layered on top of the registry. Where the engine's selection logic is constrained or biased by something other than bandwidth or default-selection logic.

**Signals.** Quality caps (max-height, max-bitrate, max-FPS, screen-size); modes (audio-only, video-only); user overrides via constraint slots; "respect billing constraints" / "respect device capabilities" framing; viewport adaptation.

**Docs.** `rendition-selection-caps`. `video-abr`'s `userVideoTrackSelection` is the constraint+filter precedent this cluster's caps build on.

**Foundational primitives.** Constraint slots that filter the candidate set before selection runs.

**Maps to Notion cluster E** ("Selection policy layer").

**Common cross-cluster touchpoints.** Capability probing (caps gate on device support); track & variant registry (policy filters the registry's candidate set); composition variants (audio-only is a subtract-down composition).

---

### Presentation modeling

Fetching, parsing, and modeling HLS / HAS media — the data structures the rest of the engine consumes.

**Signals.** Manifest fetching, multivariant playlist parsing, media playlist parsing, presentation modeling; `parseMultivariantPlaylist`, `parseMediaPlaylist`; state slot `presentation` (resolved vs unresolved); `presentation-resolved` state-machine transitions; `PartiallyResolvedTextTrack`-style modeling shapes; HLS attribute extraction.

**Docs.** `chapters` (its session-data slice: `#EXT-X-SESSION-DATA` recorded under `presentation.metadata`, read via `getSessionData`). The architectural deep-dive [`presentation-modeling.md`](../presentation-modeling.md) covers the format-neutral data shape and per-track resolution layer that feature docs in this cluster consume.

**Foundational primitives.** `Presentation` data shape; `resolvePresentation` behavior + the per-track `resolve*Track` family that patches resolved tracks back into `presentation`.

**Common cross-cluster touchpoints.** Track & variant registry (parser surfaces tracks the registry exposes); manifest reload loop (live presentations re-resolve over time); capability probing (parsed CODECS used for capability filtering).

---

### MSE / Buffer management

`MediaSource` lifecycle, `SourceBuffer` setup, append, flush, and end-of-stream coordination. The boundary between SPF and the browser's media pipeline.

**Signals.** `setupMediaSource`, `setupVideoBufferActors`, `setupAudioBufferActors`, `updateMediaSourceDuration`, `endOfStream`, `loadVideoSegments`, `loadAudioSegments`; SourceBuffer setup / append / remove / `changeType()`; per-type buffer setup; `SourceBufferActor` and `SegmentLoaderActor`; ManagedMediaSource (MMS) vs MediaSource (MSE) distinction; codec-bound mimeType ("video/mp4; codecs=..."); A+V SourceBuffer separation per CMAF; forward-buffer / back-buffer management; buffer flush mechanics.

**Docs.** `mse-mms-pipeline`, `buffer-management`. `subtitles`'s `loadTextTrackSegments` runs the same preload-aware loading FSM but does not touch MSE buffers. `video-abr`'s same-SourceBuffer-different-bitrate-segments pattern is the precedent for in-track switching.

**Foundational primitives.** Per-type `SourceBufferActor` + `SegmentLoaderActor` pair; `createTrackedFetch` (segment fetch with bandwidth sampling baked in); the preload-aware load FSM (`'preconditions-unmet' → 'dormant' → 'metadata-only' → 'full-range'`).

**Common cross-cluster touchpoints.** Track & variant registry (selection drives which buffer gets fed); gating (preload + DRM both gate buffer setup and append); time normalization (segment-boundary crossing drives load timing); per-type specialization (one buffer per type, paired actors).

**Key check.** For any feature that touches buffer behavior, identify whether the codec changes. Same codec → flush + replan, no setup re-entry. Codec change → `changeType()` or buffer recreation, routes to a codec-change feature (5.1 surround, HEVC).

---

### Time normalization

The mapping between media timeline, playlist position, and `<video>` element time. Where things go wrong when content has non-trivial timing (PTS offsets, edit lists, discontinuities, pseudo-ended states).

**Signals.** `currentTime` tracking; PTS / DTS offsets; seekable range; edit lists; instant clipping; non-zero PTS; pseudo-ended detection; buffer-stall recovery; segment-boundary math; timeline mapping.

**Docs.** None yet.

**Docs.** `non-zero-pts-support` (foundation — time-mapping primitive via `SourceBuffer.timestampOffset`; covers non-zero-PTS VOD, instant clips, and live).

**Foundational primitives.** The playlist-position-to-media-time mapping primitive lives in `non-zero-pts-support` and is consumed by every cluster A feature (live, DVR, LL-HLS) for correct `currentTime` / `seekable` semantics.

**Maps to Notion cluster B** ("Time / PTS normalization").

**Common cross-cluster touchpoints.** MSE/buffer management (time mapping affects what's appendable where); manifest reload loop (live presentations' time mapping evolves).

**Sub-cluster: Borderline content compensation.** Within cluster B, a distinct sub-group of features addresses defensive handling of content with sub-optimal or quirky timing information — technically valid but poorly-authored / poorly-delivered. These features sit in the *Borderline* category per [Feature classification axes](#media-src-vs-player-vs-borderline); they share a motivation (compensate for bad source data) but use different mechanisms (heuristic detection / parse-and-offset / detect-and-recover). Docs: `pseudo-ended-detection` (heuristic detection of stall near duration boundary on Safari), `edit-list-compensation` (init-segment elst-box parsing + middle-pattern offset application; the canonical "middle pattern" example), `buffer-stall-recovery` (mid-stream stall detection + recovery action escalation: seek-nudge → flush + refetch → source reset). The general time-mapping primitive these defensive features build on is shared with `non-zero-pts-support` (the cluster B foundation).

---

### Manifest reload loop

The polling cycle for live and DVR content — reloading the media playlist, tracking sliding windows, pacing reloads against target duration.

**Signals.** Live / DVR / event-stream content; `#EXT-X-ENDLIST`; sliding window; target-duration pacing; LL-HLS blocking reload, delta playlists, preload hints; reload miss-counter; partial segments.

**Docs.** `live-stream-support` (includes termination detection), `ll-hls-support` (low-latency extension on top of live-stream-support's reload loop), `dvr-event-stream-support` (growing-window extension on the same reload loop; orthogonal to LL-HLS).

**Foundational primitives.** A reload-loop scheduler (the sliding-window + target-duration pacing core); presentation re-resolution flow on each reload.

**Maps to Notion cluster A** ("Manifest reload loop").

**Common cross-cluster touchpoints.** Presentation modeling (re-resolution drives parser usage); time normalization (live timeline mapping); selection resilience (alternate URIs may rotate during reloads).

---

### Capability probing

Asking the browser what it can play before committing to a codec, container, or key system.

**Signals.** `canPlayType`, `MediaSource.isTypeSupported`, `requestMediaKeySystemAccess`; codec filtering; container support gating; key-system probing; HEVC support detection; channel-count probing; HDR support.

**Docs.** `capability-probing` (covers codec / container filtering, multivariant CODECS filtering, key-system probing, `changeType()` probing, error surfacing).

**Foundational primitives.** A capability-probe utility wrapping the various browser APIs uniformly. None today.

**Maps to Notion cluster D** ("Capability probing primitive").

**Common cross-cluster touchpoints.** Track & variant registry (probing filters the candidate set before selection); selection policy (caps depend on capability data); DRM (key-system probing is shared with selection-time capability checks).

---

### Selection resilience

Fallback and recovery when network requests or the selected URI / rendition fail. Spans two axes: **response-error handling** (retry/backoff/circuit-breaker, VRLT-aware throttling response, playback-token-expiry refresh — the Borderline-flavored work for content with poor/unstable network behavior) and **selection-side resilience** (alternate-URI rotation, content-steering protocol — selecting a different URI when the current one fails).

**Signals.** Alternate URIs; HLS spec-extension URIs; CDN rotation; retry / backoff; content steering protocol; `?redundant_streams=true`-style query params; VRLT (Viewer Rate Limiting Token) response handling; playback-token-expiry; circuit-breaker per host.

**Docs.** `network-resilience` (foundation — retry/backoff, error classification, VRLT, token-expiry, customer hooks), `multi-cdn-failover` (alternate-URI rotation built on network-resilience), `content-steering` (HLS content-steering protocol; pathway-priority composes with multi-cdn-failover's rotation).

**Foundational primitives.** A retry/backoff policy + circuit-breaker primitive (lives in `network-resilience`). An alternate-URI rotation primitive (lives in `multi-cdn-failover`; consumed by `content-steering`'s pathway-priority bias).

**Maps to Notion cluster G** ("Selection resilience").

**Common cross-cluster touchpoints.** Presentation modeling (alternate URIs are part of parsed presentation); manifest reload loop (failover during reload); track & variant registry (per-rendition fallback).

---

### Encrypted media (DRM)

Key system handling for protected content — EME, license fetch, key-rotation, security levels.

**Signals.** EME, `MediaKeys`, `requestMediaKeySystemAccess`, key system identifiers (Widevine / PlayReady / FairPlay / FairPlay-AirPlay); `#EXT-X-KEY` in playlists; license server URLs; security level constraints; encrypted-event handling on the SourceBuffer.

**Docs.** `drm-support` (foundation; GitHub issue #1776). Key-system capability probing is owned by `capability-probing` (cluster D); this cluster owns EME setup, license handling, and key delivery downstream of probing's verdict.

**Foundational primitives.** EME + license-handling base, under issue #1776.

**Maps to Notion cluster F** ("DRM").

**Common cross-cluster touchpoints.** Gating (DRM gates MSE setup, append, playback); capability probing (key-system support is probed before commit); MSE/buffer (encrypted events flow through buffer-append path).

---

## Cross-cluster patterns

Patterns that recur across clusters. Not clusters themselves — they're the shapes features take when they interact with each other.

### Gating / prerequisite chains

A feature delays, blocks, or conditionally proceeds with another feature's work until a prerequisite resolves.

**Signals.** "delay X until Y," "block setup until Z," "wait for K before append," `loadActivated`-style gate slots; FSM states named `'preconditions-unmet'`; `effect()` early-returns on missing context; `await keySystemReady` before MSE setup.

**Where it shows up.** Preload + load triggers gate manifest resolution and segment loading. DRM key-system readiness gates MSE setup + buffer append. Selection slots must resolve before `resolve*Track` fetches. Forward-buffer / current-time crossing gates segment-load dispatch.

**Skill action when this pattern is suspected.** Identify (a) what's gated, (b) the prerequisite signal, (c) where the gate lives (separate behavior, conditional inside a behavior, FSM state). New gating features should follow existing gate-shape conventions (FSM precondition state with `monitor`-driven exit) rather than ad-hoc early returns.

---

### Multi-writer state slots

Two or more behaviors write to the same state slot from different decision domains.

**Signals.** A `selected*TrackId` or similar slot named on more than one behavior's writer list; a "default + user-action" pattern; orthogonal-by-design coordination.

**Where it shows up.** Formerly `selectedTextTrackId` (default-on-load via `selectTextTrack` + DOM user-action via `syncTextTracks`) — since resolved to a single-writer output of `switchTextTrack`, with the dual-input relocated to the `userTextTrackSelection` *intent* slot (DOM `change` bridge + consumer through the adapter). That's the canonical resolution of this pattern: route differing inputs to a shared intent slot and let one owner derive the resolved slot, rather than co-writing the resolved slot. Proposed `selectedAudioTrackId` for multi-language audio (default + programmatic write).

**Skill action when this pattern is suspected.** Characterize the existing writer(s) and the proposed writer along three axes: (1) decision domain (config vs DOM vs intent vs derived), (2) trigger (one-shot transition vs ongoing reactive), (3) cost (cheap write vs side-effect-heavy write — e.g., audio writes trigger flush + re-resolve + replan). If the proposed writer doesn't share decision domain or cost with the existing pattern, the multi-writer convention may not transfer cleanly.

---

### Constraint + filter

A state slot that *narrows the candidate set* a selection behavior operates over, distinct from writing the selection directly.

**Signals.** `userVideoTrackSelection`-style slots; "ABR short-circuits when only one candidate remains"; filter-then-select dispatcher shape.

**Where it shows up.** `userVideoTrackSelection` for video ABR (consumer narrows candidates, ABR picks within the narrowed set).

**Skill action when this pattern is suspected.** Distinguish from multi-writer slots — constraint + filter has *one writer on the selection slot* and *separate filter slots* the writer reads. This is the pattern for "user overrides" / "caps" / "modes" — anywhere a third party wants to bias a selection without taking over writing it.

---

### Per-type specialization

Parallel behaviors for video / audio / text with a shared `setup*` helper or `make*` factory.

**Signals.** Behavior names ending in `Video` / `Audio` / `Text`; helpers named `setup*`, factories named `make*`; parameterization by typed key (`selectedKey: 'selectedVideoTrackId' | 'selectedAudioTrackId' | 'selectedTextTrackId'`); sibling iteration in engine composition.

**Where it shows up.** `resolveVideoTrack` / `resolveAudioTrack` / `resolveTextTrack` (shared `setupTrackResolution`). `loadVideoSegments` / `loadAudioSegments` / `loadTextTrackSegments`. `setupVideoBufferActors` / `setupAudioBufferActors`.

**Skill action when this pattern is suspected.** When adding a new per-track-type capability, default to the per-type-split shape with a shared `setup*` helper unless a cross-type constraint forbids it. The split-vs-merge decision belongs in `/change-spf-behavior` → `/change-spf-behavior` if the feature surfaces during refactor work; for new features, follow precedent. See `conventions/behaviors.md` "Per-type specialization."

---

### Sampling-baked-into-loading

A side-effecting fetch (or segment-load) wrapper produces signals another feature consumes, without a dedicated sampling behavior.

**Signals.** Fetch wrappers that emit per-chunk samples (`createTrackedFetch` → `bandwidthState`); state slots populated by a behavior whose nominal purpose is something else (segment loading writes `bandwidthState`); "sampling is structurally co-located with loading, not a separate behavior."

**Where it shows up.** Video ABR's bandwidth signal is written by `setupVideoBufferActors`'s `createTrackedFetch`, not by an ABR-specific behavior. Audio segment loading uses plain `fetchStream` today — a one-line change to use `createTrackedFetch` would unlock audio ABR.

**Skill action when this pattern is suspected.** When designing a feature that needs ongoing observation of an existing flow (network throughput, segment timing, append duration), prefer baking the sample emission into the existing flow's wrapper over adding a parallel monitoring behavior. Note in the feature doc which behavior is the sample producer (it's not always obvious).

---

### Selection / filtering across clusters

The end-to-end "filter, prioritize, select among track candidates" axis. The selection lifecycle for any track type (audio / video / text) crosses cluster C plus four neighbor clusters whose features participate at distinct points in the pipeline:

| Cluster | Role in selection | Example features |
|---|---|---|
| **C — Track & variant registry** | Owns the slot (`selected*TrackId`) and the picker that chooses among candidates. | `selectAudioTrack`, `switchVideoQuality`, `audio-playback`, `multi-language-audio`, `video-abr`, `audio-abr` |
| **D — Capability probing** | Filters the candidate set *before* selection runs. CODECS / `isTypeSupported` / `changeType()` gating shrinks the set the picker operates over. | `capability-probing`, `5.1-surround-selection` (consumer), `hevc-variant-selection` (consumer) |
| **E — Selection policy** | Caps and modes that *bias* the candidate set. Layered on top of the capability-filtered set; same filter shape, different motivation (config vs platform). | `rendition-selection-caps` |
| **G — Selection resilience** | Alternate URI rotation *within* the selected track. Swaps URIs for the same selection without changing which track is selected; wraps fetch primitives consumed by track resolution and segment loading. | `multi-cdn-failover`, `content-steering`, `network-resilience` |
| **H — Encrypted media (DRM)** | Key-system support *gates which tracks can be selected*. Similar to capability-probing but along a different axis (key system rather than codec). | `drm-support` |

**Skill action when this pattern is suspected.** A feature in cluster C nearly always interacts with the four neighbor clusters above. When enumerating fold-in candidates in `/implement-spf-feature` Step 2c, walk all four explicitly — even when the feature doc's *Related features* list names only a subset. Candidates often land as "design-with-in-mind" rather than full fold-in (each cluster owns its own primitives), but surfacing them keeps the cluster-C feature's shape from painting into a corner.

Worked example: `multi-language-audio` should surface `capability-probing` (codec-filter the audio rendition list), `rendition-selection-caps` (audio caps as a future bias), `multi-cdn-failover` (alternate URI rotation per language playlist), and `drm-support` (per-language key-system filtering) as fold-in candidates — even when the feature doc's *Related features* lists only `capability-probing`. The likely outcomes are *design-with-in-mind* / *ignore for now* for most; the discipline is to *surface and assess* rather than silently omit.

**The destination-architecture sibling shape.** Within cluster C itself, one sibling often carries the destination slot-owner shape that other siblings anchor on (e.g., `switchVideoQuality` for video selection; `switchAudioQuality` per `audio-abr` Phase 3 for audio selection). When implementing a feature that writes the same slot, anchor on the destination sibling's shape — not on whatever extends-the-current-code-shape happens to be available. The "implement the destination sibling first" ordering is a real fold-in outcome; see `/implement-spf-feature` Step 2's *Order-inversion not surfaced* discipline.

---

## Where this doc fits

Read alongside:

- `internal/design/spf/features/README.md` *(not yet written)* — registry index
- `internal/design/spf/presentation-modeling.md` — architectural deep-dive for the format-neutral data shape, parser interface, and per-track resolution layer that every feature consumes
- `internal/design/spf/text-track-architecture.md` — peer architectural deep-dive for the text-track implementation
- `internal/design/spf/conventions/behaviors.md` — when to define a behavior; per-type specialization details
- `internal/design/spf/conventions/signals.md` — multi-writer slot conventions
- `internal/design/spf/conventions/config.md` — when a tunable becomes config vs hardcoded
- Notion: SPF Epics Working Document — broader feature inventory + cluster taxonomy (A–G)
