---
name: implement-spf-feature
description: >-
  Implement a feature documented in the SPF feature registry. Consumes a
  feature doc at internal/design/spf/features/<name>.md and produces the
  engine-side code: new behaviors, updates to existing behaviors, media-layer
  / network-layer primitives, and tests. The implementation analog of
  /document-spf-feature (which produces the doc; this consumes it). Walks
  through resolving the doc's open questions before coding, maps phases to
  discrete chunks, applies the SPF conventions catalog, routes to downstream
  skills (/create-spf-behavior, /change-spf-behavior, /change-spf-behavior) per
  chunk shape, and updates the feature doc's Status / Implementation surface
  / Verification sections as code lands. Triggers: "implement feature",
  "implement SPF feature", "build feature", "code feature", "scope feature
  implementation", "implement <feature-name>".
---

# Implement an SPF Feature

Take a feature documented at `internal/design/spf/features/<name>.md` and
produce the engine-side code that satisfies its Phase 1 (and optionally Phase
2 / Phase 3) scope. The canonical failure mode without this discipline is
jumping from "implement audio-abr" to writing code — producing implementation
that doesn't match the doc's grounding, drifts beyond the agreed phase scope,
misses the conventions catalog, or skips the doc-update cascade that keeps
the feature registry current as code lands.

Steps 1–3 are the load-bearing setup. Skipping them produces implementations
that look superficially correct but anchor on the wrong scope, miss the doc's
open questions, miss adjacent features whose shape constrains this one, or
fail to coordinate with cross-cutting concerns. Steps 4–8 only make sense
once the feature, composition target, fold-ins, and intent are named. Step 9
(doc update as living artifact) is where the registry stays in sync with code.

## Usage

```
/implement-spf-feature [<feature-name>]
```

The arg is the feature doc's filename (without extension), e.g.
`audio-abr`. The skill reads the feature doc as its source of truth.

## Doc-as-starting-point principle

The feature doc is the **starting point for planning, not a hardened
specification**. This principle is load-bearing throughout the skill —
explicit because both directions of failure are real:

- **Silent override** (covered by `Feature-doc-grounding drift` failure
  mode) — implementation diverges from the doc without surfacing the
  divergence; the doc becomes stale silently.
- **Rigid following** (covered by `Treating feature doc as hardened spec`
  failure mode) — implementation refuses to revise the doc when new
  questions surface or drift is discovered; the doc becomes a misleading
  constraint.

Acknowledge the doc's `definition` depth explicitly when planning:

- **`coarse`** — feature sketched, many open questions. Implementation
  fills in significant detail; revisions to the doc are expected
  throughout. Planning is substantial.
- **`technical`** — scope and constraints articulated; specifics still
  open. Implementation maps to constraints; moderate planning + revision.
- **`sketched`** — implementation surface populated. Implementation
  primarily verifies; revisions for drift only.

Discipline:

- **Every doc revision is explicit and surfaced** to the user during the
  implementation pass. Never silent.
- **Step 9 consolidates** the cumulative doc update reflecting all
  revisions made during implementation — it's not the *only* revision
  point, just the cumulative one.
- **Open questions are markers**, not absent specs — the implementation
  resolves them through experience or explicitly defers them.

## Reference docs

Primary:

- `internal/design/spf/features/<name>.md` — **source of truth** for what
  to implement. Read end-to-end before scoping.
- `internal/design/spf/conventions/*.md` — when to reach for which primitive
  (behaviors, signals, reactors, actors, config). Applied throughout
  implementation.
- `internal/design/spf/evaluation-axes.md` — A–E axes the implementation is
  scored against. Cleanup pass and feature work share the same axes.
- `packages/spf/docs/hls-engine.md` — current HLS engine composition
  walkthrough; the baseline the implementation extends.
- `packages/spf/src/CLAUDE.md` — source layout + dependency rules.

Secondary:

- `internal/design/spf/use-cases/<name>.md` — if implementing for a
  use-case-specific path (variant composition).
- `internal/decisions/*.md` — past tactical decisions constraining shape.
- `internal/design/spf/architecture.md`, `primitives.md`, `signals.md` —
  implementation-level "how it works."
- Existing similar behaviors / actors as templates (e.g.,
  `switchVideoQuality` as a template for `switchAudioQuality` when
  implementing audio-abr).

Downstream skills routed-to:

- `.agents/skills/create-spf-behavior/SKILL.md` — new behaviors.
- `.agents/skills/change-spf-behavior/references/update.md` — existing behaviors whose
  purpose is changing.
- `.agents/skills/change-spf-behavior/references/refactor.md` — existing behaviors whose
  purpose is preserved but implementation improves.
- `.agents/skills/change-spf-behavior/references/split.md`, `.agents/skills/change-spf-behavior/references/merge.md`
  — structural changes.
- *(future)* media-layer / network-layer skills for `packages/spf/src/media/`
  and `packages/spf/src/network/` changes.

## Failure-mode catalog (seeded; grows with use)

- **Skipping disambiguation** — invoking with a name or description that
  ambiguously maps to (i) an existing feature, (ii) a different feature,
  (iii) a use case, (iv) cluster-E policy, (v) something not yet
  documented. Step 1's disambiguation must resolve before gathering
  sources or planning. Proceeding-with-assumption is the canonical
  failure shape. Worked example: invocation "implement resolution
  capping" — could be (i) the `rendition-selection-caps` feature (the
  right route; cluster-E selection policy), (ii) a use-case composition
  shape (incorrect — composition vs runtime config), or (iii) something
  else entirely. The disambiguation discipline catches it. Another
  worked example: invocation "implement audio-only" maps to the
  `audio-only-mode-override` use case (which absorbed what was
  previously framed as a separate `audio-only-composition` feature);
  the disambiguation is between use case and cluster-E policy, not
  between feature framings.

- **Routing-out failure** — Step 1's disambiguation should route
  confidently. The failure mode is "ambiguity discovered but not
  resolved" — silently picking one interpretation when the user could
  have meant another (especially: a request that's actually a use case
  routed-here as a feature, or vice versa). Always surface and confirm.

- **Standard-vs-use-case composition routing skipped** — Step 1 must
  confirm whether the implementation effort is for the base/standard
  composition or for a specific use-case composition. Default is
  base, but use-case-FOR implementations have different framing: the
  use-case doc supplies the destination-architecture sketch; cluster
  traversal narrows. Worked example: implementing
  `multi-language-audio` for the base engine forces the cluster's
  destination-architecture frame; implementing it as part of
  `audio-only-mode-override` Phase 2 narrows to the use case's
  variant engine.

- **Destination architecture unframed** — for features in the base
  composition, scoping without sketching the cluster's destination
  architecture produces local-optimal cuts that don't fit the larger
  shape. The destination sketch is Step 2's reference frame for the
  fold-in assessment; without it, the assessment defaults to "is
  this candidate adjacent to my feature?" rather than "does my
  feature need to align with where this cluster is heading?"

- **Doc-related-features-walked-without-cluster-traversal** —
  relying solely on the feature doc's flat *Related features* list
  misses architectural-axis siblings reachable via `clusters.md`
  (primary cluster siblings + cross-cluster axis siblings). The
  *Related features* list is a starting point; the cluster traversal
  is what surfaces the architectural axis. Worked example:
  `multi-language-audio`'s *Related features* list includes
  `capability-probing` as a "candidate," but doesn't loudly surface
  that capability-probing sits on the same
  "filtering/prioritizing/selecting tracks of a given type" axis —
  cluster traversal makes that axis explicit and the fold-in
  candidacy clearer.

- **Cross-cluster axis traversal short-circuit** — treating the
  feature doc's *Related features* list as the *ceiling* for
  cross-cluster candidates rather than the *floor*. Has two faces:
  (i) **surfacing failure** — not enumerating the cross-cluster
  cousins at all; (ii) **assessment failure** — enumerating them but
  rating them all "ignore for now," skipping past the
  design-with-in-mind landing zone.

  For cluster-C (track & variant registry) features, at minimum
  check capability-probing (D), rendition-selection-caps (E),
  multi-cdn-failover (G), drm-support (H) — these cousins all
  participate in the "filter / prioritize / select track candidates"
  axis (see `clusters.md` → *Selection / filtering across clusters*).
  Analogous cross-cluster cousins exist for other primary clusters;
  consult the clusters doc before defaulting to "no cross-cluster
  candidates."

  **DWIM is the default recommendation for cross-cluster cousins**,
  unless Impact-if-deferred pushes higher or Shape-constraint-if-
  deferred is genuinely low. The clusters doc names this
  explicitly: *"Candidates often land as design-with-in-mind rather
  than full fold-in (each cluster owns its own primitives), but
  surfacing them keeps the cluster-C feature's shape from painting
  into a corner."* See Step 2d's *Default-recommended outcome per
  candidate type* table — cross-cluster cousins are the row where
  DWIM is the prior, not Ignore.

  Worked example: `multi-language-audio`'s *Related features* lists
  `capability-probing` but omits `rendition-selection-caps`,
  `multi-cdn-failover`, `drm-support`. The implementation pass
  should rate all four as DWIM: codec filtering composes with the
  `userAudioTrackSelection` filter slot on the same axis; audio
  caps would bias the same candidate set the filter narrows;
  per-language URI rotation needs to stay extensible during
  mid-stream-switch design; per-language key-system filtering
  interacts with selection. Rating any of these "ignore" without
  surfacing as DWIM is the assessment-failure shape; rating all
  four as DWIM without surfacing each via `AskUserQuestion` is the
  narrative-batched-skip shape (see next entry).

- **Narrative-batched-skip of `AskUserQuestion` for "obvious"
  candidates** — collapsing multiple fold-in candidates into a single
  narrative sentence ("the remaining cross-cluster cousins all
  default to ignore for now") and skipping the per-candidate
  `AskUserQuestion` because the recommendation feels obvious. The
  structured presentation is the load-bearing pressure that surfaces
  assessment misjudgments — bypassing it lets misjudged
  recommendations slip through unchallenged. This failure mode often
  pairs with *Cross-cluster axis traversal short-circuit*'s
  assessment-failure face: candidates rated "ignore for now" feel
  uncontroversial enough to batch, and the batching is what hides
  the misjudgment.

  **Discipline.** Use `AskUserQuestion` per candidate **regardless of
  recommendation strength**, even when the recommendation feels
  obvious. If multiple candidates would otherwise be batched into one
  narrative paragraph, group by shared rationale into 2–3
  `AskUserQuestion` calls (4 candidates per call, per the
  `AskUserQuestion` cap) — but every candidate appears as a discrete
  row with discrete options, with DWIM and Ignore both visible in the
  option list for cross-cluster cousins specifically.

  Worked example: implementation pass enumerated 4 cross-cluster
  cousins (cap-probing / caps / CDN / DRM) and assessed all as
  "ignore for now," then narrative-batched ("the cross-cluster cousins
  all default to ignore"). User pushback identified 3 of 4 as
  design-with-in-mind that the narrative-batch silently suppressed.
  Per-candidate `AskUserQuestion` with DWIM visible would have caught
  the misjudgment by the first candidate.

- **Order-inversion not surfaced** — when this feature anchors on a
  sibling's slot-owner shape (a *destination-architecture sibling*),
  implementing the sibling first may be the right route. This is a
  legitimate fold-in outcome distinct from full / partial /
  design-with-in-mind / ignore — surface it explicitly to the user,
  don't silently reject as "we're implementing this feature, not
  that one." Signal: a sibling at `definition: technical` (or deeper)
  carries the destination architecture in its *Phases of complexity*
  table. Worked example: `multi-language-audio` anchors on
  `switchAudioQuality` (audio-abr Phase 3 + Phase 4 +
  `selectedAudioTrackId` triple-writer characterization in Phase 5).
  Implementing `multi-language-audio` while extending the current
  `selectAudioTrack` shape — instead of introducing
  `switchAudioQuality` per audio-abr's destination — would unwind
  when audio-abr ships. The "audio-abr first" ordering must be
  surfaced as an option before the fold-in walk, not buried inside
  one candidate's per-question outcomes.

- **Boil-the-ocean false positive** — rejecting fold-in candidates
  reflexively as "too big" without considering partial-implementation.
  The right question is "is there a focused partial-implementation
  cut?" not "is the full feature big?" Worked example: rejecting
  `audio-abr` as boil-the-ocean when a basic `switchAudioQuality`
  shape that establishes placement + slot pattern is a focused
  partial that gets audio-ABR's foundation in place without
  implementing the full feature.

- **Conflating partial-implementation with design-with-in-mind** —
  these are distinct fold-in outcomes. Partial = concrete code lands;
  design-with-in-mind = no new code, but this feature's shape is
  constrained by the candidate's eventual needs. Treating them as
  one outcome loses the distinction and produces either too little
  code (skipping high-impact partials) or too much (writing
  speculative code for design considerations). Worked example:
  `audio-abr` is partial-implementation (basic
  `switchAudioQuality`); `5.1-surround-selection` is
  design-with-in-mind (no codec-change code, but mid-stream flush
  orchestration left extensible).

- **Value-curve check skipped** — scoping to "spec-compliant
  baseline" without checking whether the cut produces
  user-meaningful capability. Per `clusters.md`'s "can-play vs actual
  support" distinction, a cut that ships only passive recognition /
  spec-compliance is a value-curve red flag — either fold in more,
  or be explicit with the user about the constraint. Worked example:
  `multi-language-audio` Tier 1 alone produces "the engine
  recognizes audio tracks and picks one at load time" — still only
  "can-play" at the cluster's value-curve, since the consumer can't
  dynamically select among them.

- **Treating feature doc as hardened spec** — refusing to revise the
  doc when implementation reveals new questions, refines framing, or
  surfaces drift. Inverse failure of silent-override (see
  `Feature-doc-grounding drift`). The right discipline is explicit,
  user-surfaced revision per the *Doc-as-starting-point principle*
  section above.

- **Skipping the open-questions discussion** — feature docs at coarse depth
  have unresolved open questions that block implementation. Resolving them
  silently via the edit loses the user's design intent. Always discuss
  before coding. Worked example: audio-abr's "Audio caps" open question
  needs resolution before Phase 1 — does the implementation honor a max-
  audio-bitrate cap as a constraint+filter, or is it deferred to Phase 2?

- **Implementing beyond the agreed phase scope** — feature docs have
  multiple phases. The skill must explicitly scope to one or a subset, not
  "implement the whole feature." Worked example: audio-abr Phase 1 is
  "BandwidthState reuse + switchAudioQuality behavior parallel to
  switchVideoQuality"; landing Phase 2 (multi-signal extensions) at the
  same time is scope creep.

- **Conventions catalog under-application** — SPF conventions (behaviors,
  signals, reactors, actors, config) all apply during implementation.
  Failing to consult them produces code that "works" but doesn't match
  patterns, requiring later refactor.

- **Feature-doc-grounding drift** — implementing something that doesn't
  match what the feature doc said. Either the doc is wrong (update it) or
  the implementation is wrong (fix it). Don't silently diverge — the doc
  is the spec, and divergence either way invalidates it.

- **Cross-cutting impact under-checked** — the doc's *Likely cross-cutting
  impact* section flags decisions the implementation forces elsewhere.
  Skip → cascading-impact misses. Worked example: implementing audio-abr
  without verifying `bandwidthState` multi-writer characterization (audio
  samples + video samples both writing) misses the EWMA-mixed-source
  concern the doc flags.

- **Multi-writer slot mishandling** — adding a writer to a slot another
  behavior already writes requires multi-writer characterization (per
  `conventions/signals.md`). Default-merge or default-overwrite without
  coordination is a bug.

- **Test-after-the-fact implementation** — TDD discipline per chunk: test
  → implement → verify. Implementation-first produces tests that pass by
  construction.

- **Composing into wrong engine factory** — variant-specific behaviors
  compose into the variant factory (per `use-cases/`); the default factory
  stays clean. Cross-ref to use-cases/README composition discipline. If a
  use case has a Case-2-only behavior, it doesn't belong in
  the `hls/video` engine.

- **Status / Implementation-surface update skipped** — feature doc
  transitions from coarse → sketched as code lands. The doc must be
  updated as part of the implementation; deferring means future agents
  see stale status. Step 9 enforces.

- **Downstream skill missing — silent inline implementation** — when a
  chunk hits a "Yes" row in the downstream-skill-needed table (new
  behavior, non-trivial behavior update), and the downstream skill
  doesn't exist yet, the failure mode is to silently apply discipline
  ad-hoc. Step 7 explicitly surfaces this: branch on (i) defer chunk
  pending downstream skill, (ii) build the downstream skill inline now,
  (iii) apply discipline ad-hoc with explicit "extract later" flag.

## Steps (do these in order; do not skip)

### Step 1 — Identify the feature + disambiguate the request

The load-bearing setup step. **Disambiguation comes first** — before
gathering sources or planning, confirm what the user actually wants.

**1a. Identify the candidate.**

- If the user passed a name → verify
  `internal/design/spf/features/<name>.md` exists.
- If the user passed a description (no name) → parse for candidates,
  match against existing feature docs.
- If multiple candidates match → surface options to the user.

**1b. Verify the candidate is actually a feature.**

Apply the discriminator from `features/clusters.md` and the use-cases
boundary:

- **Source-shape correctness or engine capability?** If yes → feature
  (Case-1), stay here.
- **Delivery-mode choice / variant assembly?** If yes → this is a
  **use-case composition** (Case-2) → route to `/implement-spf-use-case`.
- **Runtime policy tuning without composition change?** If yes → still
  a feature (cluster-E policy), but the implementation shape is
  config/middle-pattern, not composition; stay here.
- **Ambiguous between Case-1 and Case-2?** Same vocabulary often appears
  on both sides (audio-only, video-only, live). Surface to user; don't
  pick silently.

**1c. Route the request appropriately.**

- **Stays here** — confirmed feature, doc exists. Proceed to 1d.
- **No doc exists for the candidate** → route to `/document-spf-feature`
  to produce the doc; return here once doc lands.
- **It's actually a use case, doc exists** → route to
  `/implement-spf-use-case`.
- **It's actually a use case, no doc exists** → route to
  `/document-spf-use-case` first, then `/implement-spf-use-case`.
- **Ambiguous between options** → surface to user; do not pick silently.

**1d. Confirm composition target.** (Once routing is confirmed.)

The implementation effort's composition target shapes scope considerably.
Default is **standard composition** (the `hls/video` engine); use-case
compositions (the `hls/audio` engine, etc.) follow a narrower frame.

If not explicit in the invocation, surface and confirm. Three answers:

- **Standard composition** *(default)* — feature lands in
  the `hls/video` engine (or its constituents). Step 2's
  destination-architecture frame applies in full.
- **Use-case composition: `<use-case-name>`** — feature lands in the
  use case's variant engine. Step 2's destination-architecture frame
  is supplied by the use-case doc; fold-in traversal narrows.
- **Both** — feature lands in standard composition; one or more
  use-case compositions may need refactoring to absorb it. Treat
  each use-case refactor as a fold-in candidate in Step 2.

If the user didn't specify, default to **standard composition** and
flag the assumption in the Step 1 report so the user can correct.

**1e. Gather sources.** (Once routing and composition target are confirmed.)

Triangulate from every available source:

- **The user's invocation message.** Feature name? Phase scope target?
  Specific concerns?
- **The feature doc itself.** Read end-to-end. Pay attention to: Status
  block (what's already there?), Phases of complexity (what scope is
  available?), Open questions (what blocks implementation?), Likely
  cross-cutting impact (what will the implementation force elsewhere?),
  Implementation surface / What's not implemented (where in code?).
  Note the doc's `definition` depth and `status` per the *Doc-as-
  starting-point principle* above.
- **Constituent feature docs.** Per the use-cases/README.md framing,
  features may compose into use cases. If implementing for a use case,
  read the use-case doc to understand the composition target.
- **Similar implementations as templates.** Identify analog behaviors
  in the codebase. Worked example: implementing `switchAudioQuality`
  benefits massively from reading `switchVideoQuality` first — same
  shape, audio-axis.
- **Conventions catalog.** Skim `conventions/*.md` for relevance signals.
- **Recent ADRs.** Check `internal/decisions/` for tactical decisions
  that constrain the implementation shape.

**Stop and report back to the user** with:

1. The feature name.
2. The confirmed composition target (standard / use-case / both).
3. Sources consulted (with links).
4. Feature doc status — what's already there vs what needs implementing.
5. Likely template implementations (similar behaviors / actors / helpers).
6. The feature's phases (from the doc) — surfaced for context, with
   the phase-scope decision deferred to Step 3 once fold-in
   assessment in Step 2 has shaped it.

### Step 2 — Frame the work: destination architecture + fold-in assessment

Bridges "this feature, alone" and "this feature, as one slice of a
larger architectural concern." Without it, scope-narrow choices that
look reasonable in isolation produce implementations that don't fit
the destination architecture, get reworked when adjacent features
land, or ship capabilities of low user-meaningful value.

Five movements (2a–2e). All five are required for features in the
standard composition; for features being implemented FOR a specific
use-case composition (per Step 1d), 2b lightens considerably — the
use-case doc supplies the destination-architecture frame.

**2a. Identify the architectural axis / cluster.**

Per `features/clusters.md`, the feature lives in one or more clusters
and may also sit on a cross-cluster axis (e.g., "selecting /
filtering / prioritizing tracks of a given type"). Both matter:

- **Primary cluster** — the section in `clusters.md` the feature
  belongs to. Gives the direct siblings.
- **Cross-cluster axis** — abstractions shared with features in
  other clusters. The clusters doc's *Cross-cluster patterns*
  section captures some of these (multi-writer state slots,
  constraint + filter, per-type specialization,
  sampling-baked-into-loading). The axis the feature sits on is
  often inferable from the feature's verb-or-noun-phrase: "select" /
  "filter" / "prioritize" / "sample" / "load" / "recover" /
  "track-selection-for-type-X."

Surface both: "this feature is in cluster X; it sits on the
[axis-name] axis alongside features in clusters X, Y, Z."

**2b. Sketch the destination architecture.**

For features being implemented for the **standard composition** (the
default), sketch where the cluster's destination architecture is
heading — the larger shape this feature is one slice of. The sketch
is the reference frame for the fold-in assessment.

Format: a few sentences naming (i) the shape (multi-writer slot,
constraint + filter, per-type sibling triad, etc.), (ii) the moving
pieces (slots, behaviors, primitives), (iii) the open questions
about where things live (the cluster's known unknowns). The sketch
is necessarily approximate — its job is to give planning the right
frame, not commit to design.

**Mine sibling docs for already-articulated destination shapes.**
Before sketching from scratch, scan cluster siblings' feature docs
for an already-articulated destination shape. A sibling at
`definition: technical` (or deeper) often carries the destination
architecture in its *Phases of complexity* table — behavior names,
slot ownership, multi-writer characterization. If found, the sketch
becomes a cross-reference to that sibling's articulated shape rather
than a fresh draft. When the destination sibling is itself
unimplemented (e.g., `audio-abr`'s `switchAudioQuality` for
`multi-language-audio`), this triggers an **ordering question** —
surface it to the user in Step 2's report, before the per-candidate
fold-in walk, per the *Order-inversion not surfaced* failure mode.

For features being implemented **FOR a use-case composition**, the
use-case doc supplies most of this frame; cross-reference rather
than re-sketch.

**2c. Enumerate fold-in candidates.**

Walk three sources of candidates:

- **Cluster siblings** (from 2a's primary cluster).
- **Cross-cluster axis siblings** (from 2a's axis — features in
  other clusters that share the abstraction). For cluster-C
  (registry) features, at minimum check capability-probing (D),
  rendition-selection-caps (E), multi-cdn-failover (G), drm-support
  (H) regardless of whether the feature doc lists them — see
  `clusters.md` → *Selection / filtering across clusters*. Analogous
  cross-cluster cousins exist for other primary clusters; consult
  that section before defaulting to "no cross-cluster candidates."
- **The feature doc's *Related features* list** (catches anything
  the cluster traversal missed — but treat the list as the *floor*,
  not the ceiling).

Candidates can be (i) whole features, (ii) specific phases of
features, or (iii) use-case-composition refactors (a minor refactor
to a use case's variant engine to absorb this feature's new
behaviors counts as a fold-in candidate).

**2d. Assess each candidate; recommend an outcome.**

Four criteria per candidate. **Shape-constraint-if-deferred comes
first** because it's the criterion that catches *design-with-in-mind*
— the other three are oriented toward "should we write code for this
candidate now?" and miss the design-shape question if it's not asked
separately. Per the *Cross-cluster axis traversal short-circuit*
failure mode.

1. **Shape-constraint-if-deferred** — if we don't design this
   feature with the candidate's eventual shape in mind, will the
   structures we land make later integration awkward? Will slots,
   composition seams, layering decisions, or filter-pipeline order
   need to mutate when the candidate ships? High shape-constraint →
   design-with-in-mind (or stronger); low shape-constraint → ignore
   is safe.
2. **Impact if deferred** — would solving this feature without
   considering the candidate produce a solution that needs
   significant refactor / rework / re-characterization when the
   candidate later lands? Or that would be insufficient when the
   candidate lands?
3. **Overall speed if combined** — would partially or fully
   implementing the candidate now produce overall less work than
   serial implementation, even at moderate cost to this feature's
   specific velocity?
4. **Scope discipline** — is the candidate's bundled work focused
   enough to remain a discrete partial-implementation, or does it
   sprawl into ocean-boiling territory?

The fourth criterion is where the **boiling-the-ocean check** lives
— but it's a check on *scope sprawl*, not a default veto. Per the
*Boil-the-ocean false positive* failure mode, rejecting candidates
reflexively as "too big" misses the real question: "can this be cut
to a focused partial-implementation?"

**Why four criteria, not three.** The previous three-criteria rubric
biased the recommendation toward "implement now or ignore" — when the
implement-now threshold failed, the natural cognitive landing slid
past design-with-in-mind to ignore. Lifting shape-constraint to
criterion #1 pulls the design-shape question to the front of the
assessment, where it can land on DWIM as the right answer instead of
being skipped past.

Five outcomes per candidate:

- **Implement candidate first (flip ordering)** — when the candidate
  carries this feature's destination architecture (per 2b),
  implementing it first is the right route. This feature exits the
  current implementation pass and returns later, anchored on the
  candidate's slot-owner shape. Applies *only* to destination-
  architecture siblings; for ordinary fold-in candidates, this
  outcome doesn't apply. Per the *Order-inversion not surfaced*
  failure mode.
- **Fold in (full)** — implement the candidate (or candidate phase)
  in this implementation pass. Used when impact is high and scope
  fits.
- **Partial implementation** — implement a focused subset of the
  candidate in this pass. Concrete code lands; some of the
  candidate stays unimplemented. Used when impact is high and a
  focused cut exists.
- **Design with in mind** — no new code for the candidate, but this
  feature's implementation shape is constrained by the candidate's
  eventual needs. Used when impact is medium and the candidate's
  shape is enough to inform design but not enough to warrant code.
- **Ignore for now** — defer entirely. Used when impact is low or
  the candidate's eventual landing wouldn't meaningfully constrain
  this feature's shape.

Per the *Conflating partial-implementation with design-with-in-mind*
failure mode, the partial vs design-with-in-mind distinction is
load-bearing — partial means code lands; design-with-in-mind means
no code, only shape constraints.

**Default-recommended outcome per candidate type.** The four-criteria
walk can land anywhere on the outcome spectrum, but candidate type
carries strong priors. Diverging from the default without naming
*which criterion* pushed the assessment is a smell:

| Candidate type | Default outcome | Notes |
|---|---|---|
| **Destination-architecture sibling** (cluster sibling at `definition: technical`+ carrying this feature's destination slot-owner shape) | Flip ordering **or** Full fold-in | Per *Order-inversion not surfaced* failure mode. Never *ignore* — architecturally wrong by construction. |
| **Primary cluster sibling** | Full fold-in / Partial | Assess via the four criteria. *Ignore* only if low-impact AND low-shape-constraint. |
| **Cross-cluster axis cousin** (e.g., cluster D / E / G / H cousins for a cluster-C feature) | **Design with in mind** | Per *Cross-cluster axis traversal short-circuit* failure mode + `clusters.md` → *Selection / filtering across clusters*. Promote to Partial / Full only if Impact-if-deferred clears the threshold; demote to Ignore only if Shape-constraint-if-deferred is genuinely low. |
| **Use-case composition refactor** | Design with in mind | Let standard composition land cleanly; verify the variant engine composes post-landing. |

The defaults are starting points. When your assessment lands at a
different outcome, name *which criterion* pushed it (e.g.,
"Impact-if-deferred is high, so promoting capability-probing from
DWIM to Partial"). The defaults exist to counter-bias the historical
"implement now / ignore" pull of the four-criteria walk —
particularly for cross-cluster cousins, where the cluster doc
already says DWIM is the typical landing.

**Value-curve check before recommending scope.** Per `clusters.md`'s
"can-play vs actual support" framing, check whether the
scope-as-recommended produces user-meaningful capability. A cut
that ships only spec-compliance / passive recognition is a signal
that the scope needs revisiting — either fold in more of the
dynamic / interactive phases, or be explicit with the user about
the value-curve constraint.

**2e. Ask the user to confirm — one question per candidate.**

**Use `AskUserQuestion`** to present each candidate's recommendation
and let the user confirm or override. One question per candidate;
batch into rounds of up to 4 per `AskUserQuestion` call. For each
candidate's question:

- **Question text** — name the candidate and summarize the
  assessment in one sentence.
- **Options (4)** — four of the outcomes, with the recommended
  outcome listed first and labeled "(Recommended)". Order the
  remaining three by the next-best fit per the assessment.
- **Description per option** — one-line summary of what that
  outcome means for this candidate (concrete: "implement basic
  switchAudioQuality alongside" / "leave flush orchestration
  codec-change-extensible" / "no change").

When the candidate carries destination architecture (per 2b), the
five-outcome list exceeds `AskUserQuestion`'s 4-option cap. Drop
"Ignore for now" — ignoring a destination-architecture sibling is
architecturally-wrong-by-construction. The remaining four (Flip
ordering / Full fold-in / Partial / Design-with-in-mind) fit the
cap. **Ordering surfacing also belongs in Step 2's narrative
report**, not just inside the per-candidate `AskUserQuestion`:
mention the destination-architecture sibling and the flip-ordering
option in prose before the AskUserQuestion call, so the user sees
the framing alongside the recommendation.

Allow the user to select Other for adjustments not captured by the
listed-outcome shape (e.g., "partially implement but limit to X").

After confirmation, the **agreed scope** is the union of:

- This feature's chosen phases (refined in Step 3).
- Each fold-in / partial-implementation candidate's chosen scope.
- Each "design with in mind" candidate's shape constraint (informs
  design without adding code).

This agreed scope feeds Step 3's open-questions discussion and
final scope confirmation.

**Stop and report back to the user** with:

1. The cluster + axis identification (from 2a).
2. The destination architecture sketch (from 2b).
3. The candidate enumeration + per-candidate assessment +
   recommended outcome (from 2c-2d).
4. The value-curve check result.
5. The `AskUserQuestion`-confirmed outcomes per candidate (from 2e).
6. The resulting agreed scope.

### Step 3 — Resolve open questions + confirm final scope

An **explicit conversational stage** — not optional, not implicit.
After Step 2's fold-in assessment delivers the agreed scope:

- **Walk through the feature doc's Open questions section** plus any
  open questions surfaced by fold-in candidates. Which need to
  resolve *before* coding? Which can stay open as known-unknowns?
- **Confirm phase scope at chunk granularity.** Step 2's agreed scope
  is the high-level frame; this step decomposes to specific phase
  rows + fold-in subsets the implementation will produce.
- **Confirm composition mechanism per chunk** — (i) subtractive (no
  new code), (ii) config-driven (existing behavior gains a knob),
  (iii) new behavior (route to `/create-spf-behavior`), (iv)
  behavior update with purpose change (route to
  `/change-spf-behavior`), (v) behavior refactor with preserved
  purpose (route to `/change-spf-behavior`), (vi) media-layer /
  network-layer change (handle inline or defer per the
  downstream-skill-missing branch).
- **Resolve open questions the implementation needs.** Only resolve
  what the implementation forces; leave the rest as open questions
  in the doc.

**Use `AskUserQuestion`** for clear-cut choices (open-question
resolutions, composition mechanism per chunk).

### Step 4 — Map phases to implementation chunks

Per the agreed scope, decompose into discrete chunks. Each chunk is:

- **Small enough to TDD individually** — one test (or small test set), one
  implementation file change, one composition wiring tweak.
- **Categorized by composition mechanism** — drives Step 7's routing.
- **Sequenced for least-risk order** — primitives before behaviors;
  behaviors before composition wiring; composition wiring before
  integration tests.

**Output of this step.** A chunk list per the table shape:

| Chunk | Mechanism | Downstream skill | Test target |
|---|---|---|---|
| Add bandwidthState audio sampling | Update existing | `/change-spf-behavior` (setupAudioBufferActors) | `setup-buffer-actors.test.ts` audio sampling assertion |
| Create switchAudioQuality behavior | New behavior | `/create-spf-behavior` | `switch-audio-quality.test.ts` (new) |
| Wire switchAudioQuality into composition | Composition | None | `engine.test.ts` composition assertion |

### Step 5 — Apply cross-cutting concern checks

Run the failure-mode catalog and the feature doc's *Likely cross-cutting
impact* section against the chunk list. Each check fires when its signals
are present:

- **Conventions catalog application** — per chunk, which conventions
  apply? (behaviors.md for behavior creation/update; signals.md for slot
  map design + multi-writer; reactors.md for FSM-driven behaviors;
  actors.md for actor creation/consumption; config.md for config surface).
- **Multi-writer characterization** — for any slot the implementation
  writes that another behavior already writes, three-axis check per
  `conventions/signals.md`.
- **Per-type vs uniform-across-tracks** — per `conventions/behaviors.md`,
  ensure per-type chunks follow the sibling-behaviors-plus-shared-helper
  pattern; uniform chunks compose against the aggregating resource.
- **Composition-variant logic** — variant-specific chunks go in variant
  factories, not the default factory.
- **MSE codec-change implications** — per `/document-spf-feature`'s
  catalog, if the chunk touches buffer behavior and codecs change,
  surface the `changeType()` vs `flushBuffer` question explicitly.

### Step 6 — TDD plan

For each chunk, name:

- **The test** — file path, test name, what it asserts.
- **The implementation target** — file path, behavior/actor/helper name.
- **The composition wiring change** — if any.
- **Acceptance criterion** — what does "done" look like for this chunk?

This output drives Step 7's per-chunk implementation loop.

**The TDD plan is the seed of the feature doc's *Verification*
section.** Step 9 persists each chunk's test (file path + test name +
assertion summary) into the feature doc — the TDD plan does not live
only in chat. Name tests with assertion summaries suitable for the
doc from the start, so Step 9 is a transcription pass rather than a
re-articulation.

### Step 7 — Implement (test-first per chunk; route to downstream skills)

Iterate per chunk:

1. **Write the test first.** Run it failing.
2. **Branch by mechanism:**
   - **Subtractive / composition wiring** — handle inline.
   - **Config-driven** — handle inline.
   - **New behavior** — route to `/create-spf-behavior` for this chunk.
   - **Behavior update (purpose changing)** — route to `/change-spf-behavior`.
   - **Behavior refactor (purpose preserved)** — route to `/change-spf-behavior`.
   - **Structural (split/merge)** — route via `/change-spf-behavior`'s
     decomposition check.
   - **Media-layer / network-layer** — handle inline for now; future
     skills will own these.
3. **Run the test passing.**
4. **Run composition tests** to verify no regression.

**Downstream skill missing — explicit handling.** When a chunk routes to
a downstream skill that doesn't exist yet (or is only a stub):

- **Defer this chunk** pending the downstream skill's full development —
  if the chunk isn't load-bearing for the implementation goal.
- **Build the downstream skill inline now** — pause the implementation,
  invoke `/create-skill` to build the missing discipline, resume the
  implementation after the new skill lands.
- **Apply discipline ad-hoc with "extract later" flag** — implement the
  chunk with explicit awareness that the discipline isn't yet codified;
  flag in commit message and surface for skill extraction later.

The user makes the call. Don't apply ad-hoc discipline silently.

### Step 8 — Final-shape audit (per chunk + cumulative)

After each chunk:

- **Test passes? Composition tests pass?**
- **Conventions adherence?** Per-chunk check against the relevant
  conventions docs.
- **No scope creep?** Did the chunk stay within the agreed scope?

Cumulative audit after all chunks:

- **Feature-doc grounding** — does the implementation match what the
  doc said? Document drift surfaces here.
- **Cross-cutting impacts honored?** — every entry in the doc's
  *Likely cross-cutting impact* section either addressed or explicitly
  deferred?
- **No silent ad-hoc downstream discipline?** — if any chunk went the
  "apply discipline ad-hoc" path in Step 7, the extraction TODO is
  flagged.

### Step 9 — Update feature doc as living artifact

The feature doc transitions from `coarse` → `sketched` (or `technical` →
`sketched`) as code lands. Required updates:

- **Frontmatter `status`** — `implemented` once all phases land;
  `partial` if any phase landed but others haven't. **Update
  `definition` per the rule below.**
- **Status block** — reflect the implementation state, naming what
  shipped and what remains.
- **Phases of complexity** — phase rows that are now implemented may
  promote to *implemented*; partially-implemented rows note the partial
  state.
- **What's not implemented** — shrink to reflect what's now done.
- **Implementation surface (required once any phase implementation
  lands)** — populated with actual file paths, behavior names, state
  slots, helpers. See `audio-playback.md` for the canonical shape.
- **Verification (required once any phase implementation lands)** —
  **this is the persisted TDD artifact.** The Step 6 TDD plan lives
  here in the doc, not just in chat. Each chunk's test gets a line:
  test file path → test name → assertion summary. Add *Sandbox*
  entries where demos exist; add *Out of scope / deferred* sub-list
  for verification gaps (sandbox follow-ups, E2E coverage deferred
  elsewhere).
- **Open questions** — resolved-through-implementation entries moved
  to a *Resolved during Phase N implementation* sub-section (kept for
  traceability); new open questions surfaced by implementation
  experience added.
- **Related features** — if implementation revealed new cross-feature
  dependencies, add cross-refs.

**`definition` advancement rule.** Advance per the *highest*
implementation depth across all phases:

- Any phase's *Implementation surface + Verification* sections
  populated with concrete exports / file paths / test names →
  `sketched`.
- Phases all still scope-and-constraints-only, no implementation →
  leave at `technical`.
- Phases still broadly sketched, many open questions → leave at
  `coarse`.

A feature with Phase 1 implemented but other phases still broadly
sketched is `sketched` at the doc level — populated surface trumps
unimplemented phases (which surface in *Phases of complexity* as
not-yet-landed rows, not in the doc's overall depth).

This is **not optional** — the doc-as-living-artifact discipline is
load-bearing for the registry staying current. Per the *Status update
skipped* failure-mode entry.

### Step 10 — Commit (with user confirmation)

After Step 8 audit is clean and Step 9 doc update lands:

1. **Audit working-tree state.** `git status -s`. Surface any
   pre-existing uncommitted work outside the implementation scope.
2. **Propose a commit structure.** Common shapes:
   - **Per-chunk commits** — one commit per chunk + a final doc-update
     commit. Highest atomicity; clearest review trail.
   - **Per-phase commits** — chunks bundled by phase; one commit per
     phase + doc update. Cleaner when chunks within a phase are tightly
     coupled.
   - **Single feature-implementation commit + doc-update commit** —
     small features (audio-abr per its doc) may fit one commit.
   - **All-in-one** — small enough that splitting adds no value.
3. **Ask the user to confirm via `AskUserQuestion`.**
4. **On confirmation, run the commits.** Use `feat(spf)` for behavior-
   adding work; `refactor(spf)` for behavior-refactoring chunks;
   `docs(spf)` for the feature-doc update; conventional-commit scopes
   per the `git` skill.
5. **On decline or skip, stop.** The user owns the commit boundary.

## Output format

Propose Steps 1–6 outputs as structured reports before writing any code,
in order:

1. **Feature identification** (Step 1's report — feature, composition
   target, sources, template implementations)
2. **Destination architecture + fold-in assessment** (Step 2's report —
   cluster/axis identification, destination sketch, candidate
   assessment + recommendations, value-curve check, agreed scope after
   `AskUserQuestion` confirmations)
3. **Open questions + final scope** (Step 3 — resolved open questions,
   final phase-and-fold-in scope at chunk granularity)
4. **Chunk decomposition** (Step 4 — chunk list with mechanism +
   downstream skill routing)
5. **Cross-cutting concerns** (Step 5)
6. **TDD plan** (Step 6 — per-chunk test + implementation targets)

After user confirmation, proceed to Step 7 per-chunk loop. Surface Steps
8–10 outputs after implementation.

## Why this order

Same shape as `/document-spf-feature` and `/document-spf-use-case`. Steps
1–3 force framing before mechanical work. Step 4 commits to a concrete
chunk list; Step 5 runs cross-cutting checks while context is fresh; Step
6 commits to TDD targets. Step 7 produces the artifact; Step 8 audits.
Step 9 keeps the registry current. Step 10 hands the commit boundary to
the user.

The novel disciplines compared to the document-* skills:

- **Step 2's destination-architecture + fold-in assessment** —
  implementation choices anchor the architecture more concretely
  than documentation choices do; framing the destination + fold-ins
  *before* scope-committing prevents local-optimal cuts that don't
  fit the cluster's larger shape.
- **Chunk decomposition + per-chunk downstream-skill routing** at
  Steps 4–7 — implementation work is inherently more granular than
  documentation work, and the chunk-level discipline is what keeps
  it from sprawling.

## Why two discussion stages (not one)

This skill has **two** explicit conversational stages: Step 2 (fold-in
assessment, with `AskUserQuestion` per candidate) and Step 3 (open
questions + final scope). They're separated because they resolve
different decisions:

- **Step 2** decides *which features / phases* the implementation pass
  touches. Without this stage, scope-narrow choices that look reasonable
  in isolation ship implementations that get reworked when adjacent
  features land, or ship capabilities of low user-meaningful value.
- **Step 3** decides *the specifics within the agreed scope* — open
  questions, composition mechanisms per chunk, phase-row-level cuts.
  Without this stage, the open-questions-skipped failure mode produces
  silent design decisions that lose the user's design intent.

Both stages use `AskUserQuestion`. Resolving them in chat — without the
structured presentation — loses both the agreed scope and the agreed
design decisions.

## When this is the wrong skill

- **You want to document a feature (not yet implemented)** →
  `/document-spf-feature`.
- **You want to implement a use-case composition (not a single feature)** →
  `/implement-spf-use-case`. That skill consumes the use-case doc and
  routes per-constituent-feature back into this skill.
- **You want to refactor an existing behavior without feature scope** →
  `/change-spf-behavior`.
- **You want to split or merge behaviors** → `/change-spf-behavior`'s
  decomposition check.
- **The user requests a durable record** → treat it as a separate explicit
  task. Do not create it from this workflow.

## How the failure-mode catalog grows

Same pattern as other SPF skills: when a new failure mode surfaces during
use (most likely during Step 7 per-chunk implementation or Step 8 audit):

1. Add an entry to the *Failure-mode catalog* section above with the risk
   pattern and a worked-example citation.
2. If the failure-mode is downstream-workflow-shaped (a recurring need
   surfaces while creating or changing a behavior), that workflow's
   catalog grows too.
3. If the failure-mode is doc-shape-shaped (the feature doc template /
   conventions don't capture something), `/document-spf-feature`'s
   catalog or the conventions docs grow.

This skill is **new**; the catalog is expected to grow significantly as
the first real implementations exercise it. The seeded entries capture
patterns identified at skill-creation time from cross-skill failure-mode
analysis — they're starting points, not endpoints.
