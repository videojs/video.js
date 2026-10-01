---
status: draft
date: 2026-05-20
definition: coarse
---

# Content steering

HLS content-steering protocol implementation. Server-side advertises
a dynamically-updateable host pool + pathway preferences via
`#EXT-X-CONTENT-STEERING:SERVER-URI="..."` (Apple-defined HLS spec
extension); client periodically fetches the steering manifest and
biases URI selection accordingly. Sister to
[multi-cdn-failover](./multi-cdn-failover.md) — multi-CDN handles
static alternate-URI lists; this feature handles dynamic
server-advertised host preferences that update during playback.

A **Media-src feature** for sources that opt into content steering
(server declares `EXT-X-CONTENT-STEERING` in the multivariant
playlist). Layered with **Player feature** at Tier 2 (customer-
policy hooks override server-advertised priorities).

## Status

- **Composition:** not implemented in the `hls/video` engine. Parser
  doesn't recognize `EXT-X-CONTENT-STEERING` tag; no steering-manifest
  fetch behavior; no pathway-priority state slot.
- **Definition depth:** coarse — scope from the HLS content-steering
  spec + composition with multi-cdn-failover; SPF touchpoints sketched
  at the cluster level. Implementation details (steering-manifest data
  shape, reload-loop primitive sharing with live-stream-support,
  pathway-priority composition with multi-cdn-failover's URI list)
  tracked as open questions.
- **Hard prerequisites:** [network-resilience](./network-resilience.md)
  for steering-manifest fetch retry/backoff; [multi-cdn-failover](./multi-cdn-failover.md)
  for the alternate-URI rotation primitive that pathway-priority
  composes with.

## Phases of complexity

[Tier 1 / Tier 2 framing](./clusters.md#tier-1-spec-compliant-baseline-vs-tier-2-custom-behavior).
Each phase notes Naive vs Full depth where the
[Naive vs Full framing](./clusters.md#naive-vs-full-implementation-depth)
applies.

| Phase | Tier | What | Notes |
|---|---|---|---|
| Parse `EXT-X-CONTENT-STEERING` tag | Tier 1 | Parser extracts `SERVER-URI` and optional `PATHWAY-ID` from the multivariant playlist's content-steering tag. Presentation data shape gains a `contentSteering: { serverUri: string; pathwayId?: string }` field | Parser extension; [presentation-modeling](../presentation-modeling.md)'s multivariant-parser surface grows. **Naive:** support the required attributes only. **Full:** support optional attributes (e.g., per-rendition `PATHWAY-ID`) and the `PATHWAY-CLONES` extension |
| Initial steering-manifest fetch | Tier 1 | On presentation resolve, if content-steering is declared, fetch the steering manifest from `SERVER-URI`. Parse the response (JSON: `{ VERSION, PATHWAY-PRIORITY, RELOAD-URI?, TTL, CDN-RESET-SECONDS?, PATHWAY-CLONES? }` per spec) | One-shot fetch on resolve; gates first URI selection if pathway-priority differs from manifest default ordering. Uses [network-resilience](./network-resilience.md) retry/backoff for the steering-manifest fetch |
| Apply pathway-priority to URI selection | Tier 1 | Bias [multi-cdn-failover](./multi-cdn-failover.md)'s URI selection by the server-advertised pathway-priority order. Each alternate URI tagged with a pathway-id (from multivariant `PATHWAY-ID` or from steering-manifest mapping); pathway-priority orders them | Composition with multi-cdn-failover is the cross-cutting question. Two shapes: (a) content-steering writes a `pathwayPriority` slot that multi-cdn-failover's rotation reads as the ordering policy; (b) content-steering reorders the active alternate-URI list directly. Lean: (a) — keeps multi-cdn-failover's slot semantics clean; pathway-priority is the bias input, rotation is the consumer |
| Periodic steering-manifest refresh | Tier 2 | After initial fetch, periodically re-fetch the steering manifest at the `TTL` interval (or from `RELOAD-URI` if different from `SERVER-URI`). New pathway-priority takes effect on subsequent URI selections | Reload-loop shape similar to [live-stream-support](./live-stream-support.md)'s playlist reload loop but for the steering manifest. **Naive:** simple TTL-driven re-fetch; pause on errors. **Full:** jitter + error handling via network-resilience. Open: share live-stream-support's reload-loop primitive vs separate |
| `CDN-RESET-SECONDS` handling | Tier 2 | Server-side mechanism to instruct the client to reset per-pathway circuit-breaker / cooldown state after a duration. When the steering manifest advertises `CDN-RESET-SECONDS: N`, mark all CDN-rotation state (from `network-resilience`'s circuit-breaker + `multi-cdn-failover`'s rotation history) as reset after `N` seconds | Composes with `network-resilience`'s circuit-breaker state + `multi-cdn-failover`'s rotation history. Server can recover a CDN that the client marked unhealthy; spec mechanism for server-side health-signal propagation |
| Customer-policy hooks | Tier 2 | Pluggable hooks for consumer overrides: `selectPathway(steeringManifest, history) → pathwayId`, `shouldFetchSteeringManifest(source) → boolean`. Customer can override server-advertised priority, opt out of steering for specific sources, A/B test pathways | Tier 2 customer-policy surface. Above the Tier 1 server-advertised defaults; hooks override when set |

## What's in scope vs out of scope

**In scope:**
- All six phases above for HLS sources opting into content steering
- Parser support for `#EXT-X-CONTENT-STEERING` tag (multivariant
  playlist) + per-rendition `PATHWAY-ID` attribute support
- Steering-manifest JSON parser
- Periodic reload-loop for the steering manifest (TTL + RELOAD-URI)
- Pathway-priority state slot + composition with multi-cdn-failover
- `CDN-RESET-SECONDS` handling — reset multi-cdn-failover rotation
  state + network-resilience circuit-breaker state on server cue
- `PATHWAY-CLONES` extension (deferred to Full depth; verify in-scope
  vs separate)
- Customer-pluggable pathway-selection + opt-out hooks

**Out of scope (separate cluster G sister features):**
- **[network-resilience](./network-resilience.md)** *(prerequisite)*
  — retry + backoff + circuit-breaker. Content-steering consumes for
  steering-manifest fetch retries.
- **[multi-cdn-failover](./multi-cdn-failover.md)** *(prerequisite)*
  — alternate-URI rotation primitive. Content-steering's pathway-
  priority is the dynamic-input variant of multi-cdn-failover's
  static-manifest input.

**Out of scope (different architectural layer):**
- Steering-server implementation. Service-side concern.
- Pathway-priority decision algorithm at the server (load balancing,
  cost optimization, regulatory routing). Service-side.
- Customer-facing UI for "current pathway" / "steering active"
  indicators.
- Steering-manifest hosting / TLS / authentication infrastructure.

## Likely cross-cutting impact

Things this feature probably forces decisions on, not just additions:

- **Composition shape with multi-cdn-failover.** Per phase 3: write
  a `pathwayPriority` slot that multi-cdn-failover reads (option a)
  vs reorder the active alternate-URI list directly (option b). Lean
  (a) — keeps multi-cdn-failover's slot semantics clean. Open: should
  `pathwayPriority` be a constraint+filter (narrowing candidates) or
  a sort key (ordering candidates)? Sort key matches the spec's
  intent.
- **Reload-loop primitive sharing.** Live-stream-support's reload
  loop (not yet implemented) and content-steering's steering-manifest
  reload loop share shape: periodic re-fetch with TTL pacing, error
  handling, source-bound lifecycle. Two implementations or a shared
  primitive? Worth designing the primitive at live-stream-support's
  landing or when content-steering implementation work begins.
- **`CDN-RESET-SECONDS` interaction with circuit-breaker.** Server's
  reset instruction supersedes client-side health tracking. Cross-
  cutting with network-resilience's circuit-breaker (whose state
  reset is the implementation) and multi-cdn-failover's rotation
  history (which feeds preferred-URI selection). The reset clears
  *all three* state surfaces. Composition question: where does the
  reset behavior live? Lean: in content-steering (it's the
  consumer of the spec-defined reset), but the writes affect
  network-resilience's + multi-cdn-failover's state slots.
- **Per-rendition vs presentation-wide pathway-id.** HLS spec
  supports per-rendition `PATHWAY-ID` (different bitrate variants
  can advertise different pathway memberships) and presentation-wide
  declarations. Both should be supported; affects parser shape and
  pathway-priority application shape (per-rendition pathway-priority
  resolution).
- **`PATHWAY-CLONES` extension.** HLS spec allows the steering
  manifest to generate new URIs via URL-rewriting rules
  (`PATHWAY-CLONES`). Real complexity — affects parser, alternate-
  URI surface, multi-cdn-failover's URI list. Likely Full-depth or
  deferred to a follow-on.
- **Steering-manifest fetch authorization.** Does the steering-
  manifest fetch use the same playback token as media fetches
  (Mux-style)? Spec doesn't mandate; customer/integration question.
  Lean: same auth as content URIs (consumer's existing token-
  handling propagates).
- **Source-replacement cascade.** Steering-manifest reload loop +
  pathway-priority state tear down with the source via the standard
  resolved/unresolved cascade.

## Open questions

- **Composition shape with multi-cdn-failover.** Slot-bias (option a)
  vs URI-list-reorder (option b). Lean a.
- **Reload-loop primitive sharing.** Reuse live-stream-support's
  primitive vs separate. Resolution likely when both features land
  implementation work.
- **Per-rendition vs presentation-wide pathway-id semantics.** Spec
  supports both; implementation favors which?
- **`PATHWAY-CLONES` scope.** In-scope (Full depth) vs deferred.
- **`CDN-RESET-SECONDS` write coordination.** Reset clears state in
  this feature, network-resilience, and multi-cdn-failover. Where the
  reset behavior physically lives (cluster F-style absorption-in-
  network-resilience vs cluster A-style separate behavior) is open.
- **Steering-manifest fetch authorization.** Same playback token as
  media fetches? Customer-configurable?
- **Customer-hook contract.** Function signatures + async semantics
  + failure handling for `selectPathway` and `shouldFetchSteeringManifest`.
  Harmonize with network-resilience + multi-cdn-failover hook shapes.
- **Mid-stream pathway changes during live + LL-HLS.** Content
  steering + live + LL-HLS = three reload loops + dynamic pathway-
  priority updates. Cross-feature coordination complexity. Out of
  scope for v1.

## Related features

- **[network-resilience](./network-resilience.md)** *(hard
  prerequisite)* — retry/backoff for steering-manifest fetches +
  circuit-breaker state that `CDN-RESET-SECONDS` resets.
- **[multi-cdn-failover](./multi-cdn-failover.md)** *(hard
  prerequisite)* — alternate-URI rotation primitive. Content-
  steering's pathway-priority composes with multi-cdn-failover's
  static-manifest URI list.
- **[presentation-modeling](../presentation-modeling.md)** —
  multivariant-parser surface grows to recognize
  `EXT-X-CONTENT-STEERING` tag + per-rendition `PATHWAY-ID`.
- **[live-stream-support](./live-stream-support.md)** *(not
  implemented)* — reload-loop primitive sharing question. Both
  features have similar periodic-fetch shape.
- **[source-replacement](./source-replacement.md)** — pathway-
  priority + steering-manifest state tears down via the resolved/
  unresolved cascade.

## See also

- [HLS Content Steering specification (Apple Developer)](https://developer.apple.com/streaming/HLSContentSteeringSpecification.pdf)
  — primary source for the protocol
- [HLS Spec (RFC 8216bis)](https://datatracker.ietf.org/doc/html/draft-pantos-hls-rfc8216bis)
  — `EXT-X-CONTENT-STEERING` attribute reference
- [clusters.md § Selection resilience](./clusters.md#selection-resilience)
  — cluster G description; sister to multi-cdn-failover on the
  selection-side resilience axis
- [clusters.md § Feature classification axes](./clusters.md#feature-classification-axes)
  — Tier 1 / Tier 2 framing
- [network-resilience.md](./network-resilience.md) — prerequisite;
  retry/backoff foundation
- [multi-cdn-failover.md](./multi-cdn-failover.md) — prerequisite;
  alternate-URI rotation primitive
