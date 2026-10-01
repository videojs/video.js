---
status: draft
date: 2026-05-07
---

# SPF evaluation axes

> Reference frame for evaluating SPF code — both **cleanups** of existing code and **new feature work** added to behaviors, composition, and the surrounding media/network layers. The axes name the dimensions a change is scored on, the decision criteria for each, and the tensions that show up when an axis is pushed in isolation.

## Purpose

Establish a stable, reusable lens so that:

- Cleanup pushes are evaluated against the same criteria across iterations and contributors (human or agent).
- Feature additions are scored on the same axes a cleanup would be — preventing regressions that "ship a feature" but degrade the codebase against a stated axis.
- Tradeoffs are made explicitly. Each axis has natural tensions with the others; pushing one without acknowledging tension on another is the normal failure mode.

This doc is the *axes*. Companion docs (`conventions/`) define **when to reach for which SPF primitive** and the patterns those choices entail. Implementation-level "how it works" lives in `architecture.md`, `primitives.md`, `signals.md`, and `packages/spf/docs/hls-engine.md` — so a Reactor implementation refactor doesn't force editing the "when to use a Reactor" guidance.

## Scope

Applies to `packages/spf/src/**`. The axes are framed broadly enough to apply to VJSv10 outside SPF (especially **E — Size**, which is cross-cutting), but examples and tensions in this doc are SPF-specific.

The first concrete user is the cleanup pass tracked in `.claude/plans/spf/behaviors-and-media-cleanup.md`. Future feature work (DRM, audio-only, instant clips, multi-language audio, LL-HLS, codec capability checks, multi-CDN, …) should evaluate the same way.

## The five axes

### A — Reusability under feature pressure

**Decision criterion:** can this code accommodate any feature on the upcoming-features pressure list (see [Pressure list](#pressure-list-axis-a-target)) without architectural surgery?

"Reusable" is **not** "supports any imagined consumer" — that produces gold-plating. Reusable means *doesn't bake in things we already know we'll need to vary*. The pressure list is the concrete forcing function.

Healthy patterns:
- Configuration-driven branching for things that vary per asset/session (DRM, codec, audio-only).
- Behaviors that operate on signal contracts, not specific concrete sources.
- Pre-append wait conditions exposed as composable hooks (DRM key handshake) rather than baked-in `if` checks.

Anti-patterns:
- Hardcoded video+audio source buffer creation when audio-only is on the pressure list.
- Implicit "HLS parser is always present" assumption baked into behavior bodies.
- Pre-flight checks that can't be extended (e.g., a startup gate that doesn't compose with future DRM gates).

### B — Robustness

**Decision criterion:** does this code make implicit ordering, lifecycle, or state assumptions that break under realistic concurrency, error, or teardown patterns?

The MS/SB lifecycle (MediaSource readiness, SourceBuffer `updating` state, append/remove sequencing) is the canonical place this axis surfaces in SPF. Brittleness here is rarely about "missing error handling" — it's about implicit protocol assumptions between actors.

Healthy patterns:
- Sequencing made explicit through actor message ordering or signal-derived gates, not timing.
- Teardown that runs under `AbortController` so partial state never leaks.
- Failure modes that surface as state, not silent dead-ends.

Anti-patterns:
- "It works because the previous step always finishes first."
- Cleanup paths that assume happy-path ordering.
- Locks/flags that protect a sequence the type system could have enforced.

### C — Patternability

**Decision criterion:** does this code follow an established SPF pattern? If not, should one exist — and if so, the cleanup produces both the convention and the code that follows it.

Patternability is what makes code **subjectively** easier to reason about: a reader who has paid the learning cost for the pattern once can scan any conforming code at low cost. This is the axis where the conventions docs are *produced* — by mining for what is and isn't pattern-shaped.

Healthy patterns:
- Behavior helpers shaped like behaviors (so wiring looks the same).
- Read/write intent annotated uniformly via `Signal<T>` / `ReadonlySignal<T>` typing.
- Repeated problems solved the same way at every layer (initial selection, error mapping, teardown).

Anti-patterns:
- Three different ways to extract a helper from a behavior (factory, free function, closed-over signal access).
- Bespoke flag-based state machines (`abrDisabled`) when the codebase has primitives for the same job.
- One-off naming/shape conventions that don't match any nearby code.

### D — Simplicity

**Decision criterion:** is this code more elaborate than the problem requires? Can existing primitives (Reactor, Task + Runner, Signal, Actor) replace ad-hoc machinery?

Simplicity is about **objective** complexity reduction — fewer moving parts for the same behavior. This is distinct from C (which is about conformance) and from E (which is about size in compiled output): code can be small but elaborate, or large but trivial.

Healthy patterns:
- Replacing ad-hoc subscribe/cleanup with Reactor when the shape fits.
- Collapsing "two flags and a callback" into a single signal-derived state.
- Using `defineBehavior` consistently rather than hand-rolled behavior objects.

Anti-patterns:
- Four-step state machines for what is really a derived signal.
- Hand-rolled task scheduling alongside Tasks + Runners.
- Coordination protocols between behaviors that should be one behavior.

### E — Size

**Decision criterion:** does this code minimize compiled output size? Cross-cutting (applies broadly to VJSv10) and uniquely **measurable** among the axes — `pnpm -F @videojs/spf size` (public API) and `size:all` (all exports) provide direct numbers.

Size is its own axis because **smaller** and **simpler** are correlated but not identical. Terse code via higher-order abstractions, FP composition, or metaprogramming can shrink output while *increasing* line-by-line density. That tradeoff is acceptable when (a) the abstraction is a documented convention and (b) comments cover the non-obvious why. Size is also load-bearing for SPF specifically — it is shipped to browsers and the public API surface has measured size budgets.

Healthy patterns:
- Shared helpers with narrow surfaces, exported once, reused broadly.
- Conditional features behind tree-shakable subpath imports rather than runtime branches.
- Small declarative configs over imperative wiring repeated per call site.

Anti-patterns:
- Per-behavior copies of the same wiring scaffold.
- Defensive runtime guards for invariants the type system already enforces.
- Wide enums/discriminants that prevent dead-code elimination.

## Tensions

Pushing one axis tends to apply pressure to another. These are the recurring ones:

| Tension | What it looks like |
| ------- | ------------------ |
| **A vs D** | Pushing assumptions to config can inflate code with branches/options. The right call is per-case: if the assumption is on the pressure list, A wins; if speculative, D wins. |
| **A vs E** | More configurability = more code paths in the bundle. Mitigate via subpath splitting (`/dom`, `/playback-engine`) so each consumer pays only for what they import. |
| **A vs C** | A new feature may need a new convention. Stretching an existing pattern beyond fit is worse than introducing a new one — but introducing one without writing it down is worse still. |
| **B vs D** | Defensive code reads as bigger and more elaborate. The real fix is usually to repair the protocol so the guard becomes unnecessary, not to add the guard. |
| **B vs E** | Same as above, in compiled output terms. |
| **C vs D** | Conventions can mandate elaborate-feeling shapes (always wrap in X). Sometimes inline is simpler in isolation but harder to scan in aggregate — the convention earns its keep across many call sites, not at any one. |
| **C vs E** | A convention can either *be* the size win (shared helpers) or *cost* size (mandatory wrappers). Conventions doc should note which when it matters. |
| **D vs E** | Terse-via-HOF/metaprogramming can shrink size while reading denser. Acceptable when the abstraction is a convention with a documented `when-to-use`. |

## Pressure list (axis A target)

The concrete forcing function for **A — Reusability**. From the [Mux Video Content Permutations doc](https://www.notion.so/mux/Mux-Video-Content-Permutations-Media-Renderer-Support-Matrix-32c97a7f89d08191b84dd30f06685490), filtered to items in or imminent for SPF (MPEG-TS explicitly out of near-term scope):

- **DRM** — Widevine, PlayReady, FairPlay (incl. legacy `com.apple.fps.1_0` fallback and AirPlay path); pre-append key handshake gating.
- **DRM security level configurations** — per-asset/session policy enforcement.
- **Audio-only streams** — no video source buffer; UI/feature suppression.
- **Multi-language audio** — `AudioTrackList` wiring, BCP-47-aware default selection.
- **Multi-bitrate audio (audio ABR)** — quality selection across audio renditions, not just video.
- **Instant clips / non-zero PTS** — timeline normalization equivalent to hls.js `initPTS` / `timestampOffset`.
- **LL-HLS** — blocking reload, partial segments, delta playlists, preload hints.
- **Live / DVR sliding window** — manifest re-polling, sliding/growing playlist handling.
- **Multi-CDN failover** — alternate-URI rotation on persistent rendition failure.
- **Codec capability detection** — HEVC, 5.1 surround, etc.; `isTypeSupported`-based filtering.
- **Mux platform behaviors** — pseudo-ended detection, edit-list compensation, VRLT pacing audit, 1080p+ cap, stream termination (`#EXT-X-ENDLIST`), playback token expiry, buffer stall recovery.

When evaluating axis A on a piece of code, the question is "which of these would force me to rewrite this?" — not "could I imagine any future change?"

## Mapping back to the original framing

The five axes consolidate the original six goals while preserving their distinctions:

| Original goal | Lands on axis |
| ------------- | ------------- |
| 1. Cleanliness / complexity reduction (with subjective ease of reasoning) | C (subjective half) + D (objective half) |
| 2. Implementation detail changes (`abrDisabled`, smarter initial track selection) | Backlog items, scored on multiple axes — not an axis itself |
| 3. Brittleness | B |
| 4. Reduce assumptions | A |
| 5. Code consistency (helpers conform to behavior shape, establish patterns) | C |
| 6. Code size | E |

Goal 2 is the meaningful exception: it's a category of work, not a cleanup principle. `abrDisabled` rework scores on C + D + A; smarter initial track selection is feature-leaning and tagged as such on the backlog so it isn't conflated with axes-driven cleanup.

## Related docs

- `internal/design/spf/conventions/` *(to be drafted)* — when to reach for which SPF primitive, paired patterns. Cross-references this doc for axes; cross-references `architecture.md` / `primitives.md` for implementation.
- `internal/design/spf/architecture.md` — current implementation snapshot.
- `internal/design/spf/primitives.md` — Tasks, Actors, Reactors, State.
- `internal/design/spf/signals.md` — signals decision and tradeoffs.
- `packages/spf/docs/hls-engine.md` — current HLS engine composition walkthrough.
- `.claude/plans/spf/behaviors-and-media-cleanup.md` — the cleanup pass driving the first concrete use of these axes.
- `.claude/plans/spf/behaviors-and-media-assessment.md` *(to be drafted)* — current-state mapping of in-scope code against these axes.
