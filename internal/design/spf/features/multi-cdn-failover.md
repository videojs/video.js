---
status: draft
date: 2026-06-08
definition: implemented
---

# Multi-CDN failover

CDN selection and failover for HLS sources that publish the same content
on more than one host (e.g. Mux Video's `?redundant_streams=true`). The
redundant variants parse as ordinary candidate tracks — one per
(rendition × CDN) — so the work is **selecting which CDN to use and
keeping the whole presentation on it**, modeled inside the
[track-switching rule model](../track-switching-model.md) rather than as
URL rewriting at fetch time.

Two sub-features, mapping onto the two rule kinds in that model:

1. **Sticky CDN pick** *(implemented)* — a session-level behavior picks a
   CDN (the manifest-head host) and holds it; a shared **scope** rule
   (`preferActiveCdn`) narrows every track type's candidates to that CDN,
   so video / audio / text resolve from one host. This is the
   *active-pathway scope* the track-switching model lists for
   multi-cdn-failover.
2. **Failover** *(implemented)* — **site-adds, behavior-expires.** Fetch
   sites add a CDN to a `failedCdns` set on a failed fetch (the *trip*); a
   shared **constraint** (`excludeFailedCdns`) prunes that CDN's tracks from
   the candidate set so the scope falls to the next CDN; `setupFailoverMonitor`
   removes the CDN once a cooldown lapses (the *expiry*) and the scope returns
   to it. This is the *failed-CDN constraint* the model lists. It shipped
   **self-contained** — a cooldown timer, *not*
   [network-resilience](./network-resilience.md)'s circuit-breaker. Retries are
   a future refinement that would sit *below* the trip (so it sees post-retry
   terminal failures), not a prerequisite.

A **Media-src feature** for sources that genuinely require failover, with
a **Player feature** surface at the failover tier (customer-customizable
CDN policy). Notion epic #9 classifies as "Media-src? / Player?" — the
ambiguity reflects that split.

## Status

- **Composition:** both sub-features are implemented in
  the `hls/video` engine and the audio-only engine. `deriveCdnPriority`
  owns the `cdnPriority` signal (manifest-ordered CDN list); the
  `preferActiveCdn` scope rule narrows candidates to the highest-priority CDN
  with surviving tracks (shared by the video + audio chains). For failover:
  the `excludeFailedCdns` constraint prunes tracks whose CDN is in the
  `failedCdns` set; fetch sites trip a CDN into `failedCdns` on a failed fetch
  (`failoverFetch` for media playlists in `resolve-track`, `failoverFetchBytes`
  for segments in `setup-buffer-actors`); `setupFailoverMonitor` owns `failedCdns`
  and removes each CDN once its cooldown lapses.
- **Definition depth:** implemented.
- **Detection (self-contained, no hard prerequisite):** a CDN trips on the
  **first terminal fetch failure** (network error or non-OK status); cooldown
  is the only back-off. `setupFailoverMonitor` is a per-source cooldown timer,
  *not* a circuit-breaker imported from
  [network-resilience](./network-resilience.md). Retries are a future
  refinement *below* the trip (so it would observe only post-retry terminal
  failures), not a dependency — this feature ships without
  `network-resilience` existing.
- **Governing model:** [track-switching-model.md](../track-switching-model.md)
  — multi-CDN is the canonical *constraint + scope* feature there. Both halves
  are now built: the active-CDN scope (soft filter in the rule chain) and the
  failed-CDN constraint (hard filter in the constraints pre-pass —
  `applyConstraints` + the `constraints` config slot now exist).

## How redundant streams are modeled

There is no `alternateUris` field and no fetch-time URL rotation. A
redundant-streams manifest lists each rendition once per CDN (duplicate
`#EXT-X-STREAM-INF` / `#EXT-X-MEDIA` entries on different hosts), and the
existing parser already emits one `Track` per entry with a unique id and
its own absolute `url`. So the candidate set for each type *already*
contains one variant per CDN. CDN identity is derived from each track
URL's origin (`getCdnId`, overridable via engine config — e.g. to key on
Mux's `cdn=` query param); the set of CDNs is published as a single
per-presentation ordered signal (`cdnPriority`, most-preferred first —
mirroring HLS content steering's `PATHWAY-PRIORITY`). The *active* CDN is
not stored: the scope derives it as the highest-priority `cdnPriority`
entry that still has tracks after the constraints pass. Selecting a
CDN-tagged track id means `resolveTrack` / segment loading fetch from that
CDN with no further plumbing.

This list shape is what makes failover fall out cleanly: the failed-CDN
constraint prunes a cooled-down CDN's tracks, so "first-with-survivors"
moves to the next CDN automatically and returns to the primary when it
recovers — no reactive rewrite of an "active" value. Content steering,
likewise, just reorders `cdnPriority` (pathway priority as a sort key).

This is why the feature needed **no parser change** and no new data shape
— only selection behaviors, a scope rule, and a constraint over existing
tracks, plus a fetch decorator that records failures into `failedCdns`.

## Phases of complexity

| Phase | Sub-feature | Kind | What | State |
|---|---|---|---|---|
| Sticky CDN pick | 1 | scope | `deriveCdnPriority` publishes the manifest-ordered CDN list (`cdnPriority`); `preferActiveCdn` narrows every type's candidates to the highest-priority CDN with surviving tracks, falling through when nothing matches. Shared list → all types on one CDN | **Implemented** |
| Constraints pre-pass | 2 | — | `applyConstraints` + the `constraints` config slot in `setupTrackSwitching` (the hard-filter pre-pass that runs before the rule chain). Reusable by capability-probing | **Implemented** |
| Failed-CDN constraint | 2 | constraint | `excludeFailedCdns` prunes tracks whose CDN ∈ `failedCdns`; the scope falls to the next `cdnPriority` entry and snaps back on recovery | **Implemented** |
| Per-CDN failure tracking | 2 | — | **Site-adds, behavior-expires**: fetch sites trip a CDN into `failedCdns` on a failed fetch (`failoverFetch` / `failoverFetchBytes`); `setupFailoverMonitor` expires it after a cooldown. Self-contained (trip-on-first-failure + cooldown), not a `network-resilience` circuit-breaker | **Implemented** |
| Customer CDN-id derivation | 2 | config | Pluggable `getCdnId` (engine config) for non-origin identity, threaded to all four CDN-id sites; origin-based default | **Implemented** |
| CDN priority override / steering | 2 | scope | Reorder `cdnPriority` to bias the pick (region-preferred, weighted, or content-steering's pathway priority). No reactive "active" rewrite needed — the order *is* the policy | Deferred (content-steering) |

## What's in scope vs out of scope

**In scope (all implemented):**
- Sticky per-presentation CDN selection
- Failover via the failed-CDN constraint + derived active-CDN rotation
- Self-contained per-CDN failure tracking (trip-on-first-failure + cooldown)
- Customer-configurable CDN-id derivation (`getCdnId`)

**Out of scope (separate cluster G sister features):**
- **[network-resilience](./network-resilience.md)** *(optional future
  refinement, not a prerequisite)* — retry + backoff + error-classification.
  Would sit *below* the failover trip to reduce false trips; failover ships
  without it.
- **[content-steering](./content-steering.md)** — HLS content-steering
  protocol (server-advertised, dynamically-updated host pool). Different
  mechanism than static redundant streams, but the *same* active-pathway
  scope shape: content-steering picks the active pathway dynamically; the
  scope reflecting it is the one implemented here. Designed-with-in-mind:
  `cdnPriority` is a reorderable list a steering behavior writes (pathway
  priority as a sort key), and the scope honors the order unchanged.

**Out of scope (different architectural layer):**
- Adapter-layer customer-facing UI ("Switch CDN" buttons). Consumer
  policy is expressed via the failover tier's config seam.
- CDN-side load balancer / origin-shield infrastructure. Service-side.
- DRM key-server failover — lives under [drm-support](./drm-support.md).

## Likely cross-cutting impact

- **Per-presentation, not per-rendition (resolved).** A single
  `cdnPriority` list governs all track types — the per-presentation
  coherence requirement. The track-switching model's
  "cross-type consistency is a composition convention" applies: both the
  video and audio chains reference the *same* `preferActiveCdn` definition
  reading the *same* list, so they agree on the CDN even if their per-type
  track arrays differ. (The doc's earlier per-rendition lean is superseded.)
- **`cdnPriority` writer composition.** `deriveCdnPriority` is the sole
  writer today (publishes the manifest order). Failover needs no second
  writer — the failed-CDN constraint prunes tracks and the scope re-derives
  the active CDN. Content-steering would *reorder* `cdnPriority` (still a
  single owning behavior; the list reflects one upstream priority).
- **Active CDN is derived, not stored.** The scope computes "highest
  priority with surviving tracks," so failover and recovery need no extra
  state: pruning moves the pick to the next CDN, un-pruning returns it to
  the primary. This is why the array beats a single reactive `activeCdn`
  value — the failed-set information is applied once (in the constraint),
  not duplicated into an active-value rewrite.
- **Constraints pre-pass (now built).** The failed-CDN constraint runs in
  `setupTrackSwitching`'s `applyConstraints` pre-pass — the `constraints`
  config slot, applied to `candidateSet` before the rule chain.
  capability-probing can reuse it. One piece is deliberately *not* built: a
  terminal "everything pruned" state — today an all-CDNs-failed candidate set
  is empty and the prior pick is left in place (see *Follow-up candidates*).
- **Live + multi-CDN.** During live playback the reload loop re-resolves
  the presentation; `deriveCdnPriority` re-publishes only when the CDN set
  changes (idempotent for a stable manifest). Cross-feature with
  [live-stream-support](./live-stream-support.md) (not yet implemented).
- **Failover state is per-source.** Both `cdnPriority` and `failedCdns` tear
  down with the source via the resolved/unresolved cascade (per
  [source-replacement](./source-replacement.md)) — `setupFailoverMonitor` clears
  `failedCdns` and its cooldown timers on unload, so no failover state leaks
  across sources. (If `network-resilience` lands later, its per-host state may
  choose to outlive a source — that's its call, not failover's.)

## Open questions

- **Composition with content-steering.** Static redundant CDNs + a dynamic
  steered host pool: does steering replace, intersect, or reprioritize the
  candidate CDNs? Open until content-steering lands; the reorderable
  `cdnPriority` list keeps it tractable (steering reorders it).

## Follow-up candidates

Known, intentionally-deferred refinements — none block the feature; worth
tracking as a future effort:

- **No cooldown extension on re-failure.** A CDN's removal is scheduled when it
  first enters `failedCdns`; re-failing it mid-cooldown doesn't push the deadline
  out (set-membership watch). Fine for trip-on-first; revisit with a
  windowed/decaying health metric.
- **Flapping.** A flaky-but-not-dead CDN can oscillate — trip → cooldown lapses →
  re-preferred (it's `cdnPriority[0]`) → fails again. No hysteresis or
  growing back-off on repeated trips.
- **All-CDNs-down has no terminal state.** When every CDN is pruned the candidate
  set is empty and the prior pick is silently left in place; a distinct "nothing
  playable" state is unmodeled (shared with the constraints-pre-pass work).
- **HTTP-status classification is coarse.** The trip fires on a thrown fetch or a
  non-OK media-playlist status; finer classification (5xx-with-body vs 4xx,
  segment-side status codes) is deferred to `network-resilience`.
- **Retries below the trip.** `network-resilience` retry/backoff would sit under
  the fetch sites so the trip sees only post-retry terminal failures (fewer false
  trips). A refinement, not a dependency.
- **`switchAudioTrack` config tidiness (cosmetic).** Audio spreads `...config`, so
  video-only ABR fields ride into the shared ranker harmlessly (audio has no
  `bandwidthState`). A cross-cutting-only shared config type would keep them out.

### Resolved during implementation

- **Signal shape** → a per-presentation ordered `cdnPriority` list (active =
  first-with-survivors, derived), not a stored `activeCdn` and not per-rendition.
  The list makes failover a pure constraint and composes with content-steering as
  a reorder; matches the one-shared-list cross-type coherence requirement.
- **Failover detection** → **site-adds, behavior-expires**: fetch sites trip on
  the first terminal failure; `setupFailoverMonitor` expires after a cooldown.
  Self-contained — no `network-resilience` circuit-breaker dependency.
- **CDN-id derivation** → configurable via the `getCdnId` engine config (origin
  default), threaded to all four CDN-id sites so the keys stay comparable.
- **Constraints pre-pass** → built (`applyConstraints` + `constraints` config
  slot in `setupTrackSwitching`).
- **Parse failures don't trip** — a 200 with an unparseable body is a content
  issue, not CDN unavailability; only fetch/non-OK failures trip.
- **Manifest syntax / parser** → no change; redundant variants already parse as
  separate per-CDN tracks (no `alternateUris` field).
- **Architecture** → constraint + scope in the track-switching model, not
  active-URI rotation in `resolveTrack`.

## Implementation surface

- **`media/utils/cdn.ts`** — `getCdnId(url)` (origin-based default) + the
  `GetCdnId` type; `getOrderedCdnIds(presentation, getCdnId?)`;
  `addFailedCdn(failed, cdn)` (pure, idempotent dedup-append).
- **`playback/behaviors/derive-cdn-priority.ts`** — `deriveCdnPriority` owns
  `cdnPriority` (publishes `getOrderedCdnIds` on resolve, skips unchanged
  writes, clears on exit).
- **`playback/behaviors/setup-failover-monitor.ts`** — `setupFailoverMonitor`
  owns `failedCdns`; per-source, watches the set and schedules a cooldown
  removal per CDN, clears on src unload. Config `failover?: { cooldownMs }`.
- **`playback/behaviors/resolve-track.ts`** — `failoverFetch(state, config)`
  decorates the media-playlist fetch (`fetchResolvableText`); a failed/non-OK
  fetch adds the CDN to `failedCdns` via `addFailedCdn`.
- **`playback/behaviors/dom/setup-buffer-actors.ts`** — `failoverFetchBytes`
  decorates the per-type segment fetch (`trackedFetch` / `fetchStream`) the same way.
- **`playback/behaviors/track-switching.ts`** — `preferActiveCdn` scope +
  `excludeFailedCdns` constraint (shared by the video + audio chains via the
  `CdnRuleConfig` view that carries `getCdnId`); `applyConstraints` pre-pass +
  `constraints` config slot; `SwitchableTrack` gains `url`.
- **`playback/engines/hls/engine.ts` + `engine-audio-only.ts`** —
  `deriveCdnPriority` + `setupFailoverMonitor` composed after
  `resolvePresentation`; `failover?` + `getCdnId?` engine config; `cdnPriority?`
  + `failedCdns?` engine state.
- **`network/fetch.ts`** — `FetchText` type + `fetchResolvableText` default
  (fetch → reject on non-OK → text), the text analog of `FetchBytes`.

State signals: `cdnPriority?: string[]` (owned by `deriveCdnPriority`) and
`failedCdns?: string[]` (owned by `setupFailoverMonitor`; tripped by the fetch
sites, read by the `excludeFailedCdns` constraint).

## Verification

- `media/utils/tests/cdn.test.ts` — `getCdnId` (origin; same/different host;
  scheme+port; unparseable fallback); `getOrderedCdnIds` (order; dedupe; single;
  unresolved → `[]`); `addFailedCdn` (append; order; idempotent same-reference).
- `playback/behaviors/tests/derive-cdn-priority.test.ts` — publishes the
  manifest-ordered list; single-CDN; skips the write on a same-CDN swap; updates
  on reorder; clears on unload/destroy; re-publishes after reset.
- `playback/behaviors/tests/setup-failover-monitor.test.ts` — a tripped CDN is
  removed once its cooldown lapses; independent per-CDN cooldowns; clears
  `failedCdns` on src unload; sensible cooldown default.
- `playback/behaviors/tests/track-switching.test.ts` — `preferActiveCdn` (narrow
  to highest-priority surviving CDN; fall-through; cross-type coherence);
  `excludeFailedCdns` + `applyConstraints` (prune failed CDNs; order-independence;
  failover via the constraint).
- `playback/engines/hls/tests/engine.test.ts` — integration: redundant-stream →
  `cdnPriority` = manifest order + pick on primary; reordering re-narrows;
  **auto-failover** (a failing media-playlist fetch trips the CDN and selection
  falls over to the backup, no external write); a **custom `getCdnId`** (keyed on
  a query param) honored across `cdnPriority`, the trip, and the constraint/scope
  end-to-end.
- `playback/engines/hls/tests/failover-smoke.test.ts` — **gated live smoke test**
  (behind `VITE_FAILOVER_SMOKE`) against a real Mux `?redundant_streams=true`
  source: block one origin → trip → failover → recovery. Skipped by default.

Deferred:

- E2e through the html player + real MSE — deferred; apps/e2e pages are generated
  from `media.ts`, so a redundant source would sweep into every generic + visual
  spec. The engine smoke test covers the round-trip (including recovery, which
  isn't observable at the player DOM).
- A dedicated segment-failover integration test — the trip logic is unit-covered
  (`addFailedCdn`) and mirrors the tested media-playlist path.

## Related features

- **[track-switching-model.md](../track-switching-model.md)** *(governing
  model)* — multi-CDN is its canonical constraint + scope feature; the
  active-CDN scope is implemented against the rule chain it specifies.
- **[network-resilience](./network-resilience.md)** *(optional refinement,
  not a prerequisite)* — retry/backoff below the trip would reduce false
  trips; failover ships self-contained.
- **[content-steering](./content-steering.md)** — dynamic host-pool
  sibling; shares the active-pathway scope shape (`cdnPriority` as a
  reorderable reflected list — pathway priority as a sort key).
- **[capability-probing](./capability-probing.md)** — can reuse the
  constraints pre-pass (now built for the failed-CDN constraint).
- **[live-stream-support](./live-stream-support.md)** *(not implemented)*
  — reload-loop re-resolution; `cdnPriority` is republished only when the
  CDN set changes.
- **[source-replacement](./source-replacement.md)** — `cdnPriority` tears
  down via the resolved/unresolved cascade on source change.
- **[video-abr](./video-abr.md)** / **[audio-abr](./audio-abr.md)** — ABR
  ranks within the CDN-narrowed set; the scope runs before the ranker.

## See also

- [multi-cdn-failover-prior-art.md](../multi-cdn-failover-prior-art.md) —
  how eight OSS players model CDN redundancy/failover, read against this
  design (two architectural families, content-steering convergence, and the
  prior art behind the 300s cooldown default + the open follow-ups)
- [track-switching-model.md](../track-switching-model.md) — the rule
  model (constraints → soft filters → ranker) this feature composes into
- [clusters.md § Selection resilience](./clusters.md#selection-resilience)
  — cluster G; this feature is the selection-side resilience sister to
  `network-resilience`'s response-error handling
- [clusters.md § Selection / filtering across clusters](./clusters.md#selection--filtering-across-clusters)
  — cluster G's role: alternate-CDN selection within the chosen track
- [network-resilience.md](./network-resilience.md) — retry/backoff that
  would sit below the failover trip (optional refinement, not consumed today)
- [SPF Epics Working Doc](https://www.notion.so/35f97a7f89d08123a13fecab1ca1cac4)
  — source material; epic #9 (Multi-CDN Failover)
- [Mux Video — `?redundant_streams=true`](https://www.mux.com/docs/guides/play-back-on-multiple-cdns)
  — Mux Video convention for redundant-CDN sources
