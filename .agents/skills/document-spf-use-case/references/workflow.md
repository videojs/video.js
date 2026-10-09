---
name: document-spf-use-case
description: >-
  Produce or update an entry in the SPF use-case-composition registry at
  internal/design/spf/use-cases/. Triangulates context from multiple sources
  (Notion, GitHub, pasted writeups, existing use-case docs, constituent
  feature docs, codebase), grounds the use case in the four composition
  mechanisms (subtract / add / alternative-impl / alternative-default-config),
  applies use-case-specific cross-cutting concern checks, drafts the doc at
  the appropriate definition depth, and cascades narrow updates to
  constituent feature docs and sibling use cases. Triggers: "document
  use case", "register use case", "use case doc", "update use case doc",
  "deepen use-case stub", "new SPF use case", "use case composition",
  "draft use-case registry entry", "new use case composition".
---

# Document an SPF Use-Case Composition

Produce or update a use-case-composition registry doc at
`internal/design/spf/use-cases/<name>.md`. The canonical failure mode without
this discipline is jumping from invocation to drafting — producing a doc that
mistakes a middle-pattern feature for a composition variant, conflates
delivery-mode choice (Case-2) with source-shape correctness (Case-1), defaults
to subtractive-only composition framing when other mechanisms also apply,
promotes use-case-specific glue behaviors to standalone features
unnecessarily, or fails to cascade cross-links to constituent feature docs.

Steps 1–2 are the load-bearing ones. Skipping them produces drafts that look
superficially correct but anchor on the wrong scope, wrong doc-type, or wrong
constituent-feature mix. Steps 3–7 only make sense once the use case, sources,
and intent are named. Step 8 (cross-doc cascade) is where the registry stays
internally consistent rather than drifting.

## Usage

```
/document-spf-use-case [<use-case-name-or-description>]
```

The arg is optional. The skill is also invoked after the user pastes context,
links a Notion doc or GitHub issue describing a delivery scenario, or
describes a use case in conversation.

## Reference docs

Read these before drafting:

- `internal/design/spf/use-cases/README.md` — **source of truth** for the
  doc-type. Template, decomposition rubric, composition-mechanism taxonomy,
  cross-link discipline, complexity-phase framing all live here. The skill
  consults this at every step.
- `internal/design/spf/features/clusters.md` — `§ Composition vs Policy vs
  middle pattern` is the discriminator for what genuinely qualifies as
  composition vs the middle-pattern shape most candidates fail to. Cluster
  signals also help identify constituent features at Step 3.
- `internal/design/spf/conventions/behaviors.md` — `§ One behavior or
  several` + `§ Inverse: behaviors that operate uniformly across tracks`.
  Composition-variant discipline; the `updateMediaSourceDuration` worked
  example for how existing behaviors compose unchanged across variants.
- `internal/design/spf/use-cases/<name>.md` if a doc already exists for the
  use case — required reading for any deepen / update use case.
- `internal/design/spf/features/<constituent>.md` — constituent feature
  docs supplying the engine capabilities the use case rests on. Step 3
  grounding maps the variant's composition against these.
- `.agents/skills/document-spf-feature/SKILL.md` — parallel skill for
  feature docs; consult for the analogous discipline shape and the
  failure-mode catalog patterns that apply symmetrically.
- `internal/design/spf/evaluation-axes.md` — for Phase 3 (optimizations)
  candidates that surface the Path-A (update existing behavior) vs Path-B
  (create new behavior) judgment call. The use-cases/README.md
  *Implementation note* section forward-refs this for the principle.
- `internal/decisions/*.md` — for past tactical decisions that may
  constrain a use case's shape.
- `packages/spf/docs/hls-engine.md` — current HLS engine composition
  walkthrough; useful for grounding the "what behaviors does the default
  composition include" baseline that variants subtract from / add to.

## Failure-mode catalog (grows with use)

Inline checks embedded in the steps below. Each entry cites the principle
source or risk pattern; the catalog grows as new failure modes surface from
actual use.

- **Composition-vs-middle-pattern misclassification** — invocation says
  "composition" but the implementation shape is middle pattern (new
  state-producing behavior + targeted edits to consumers, no engine-time
  composition change). Per `clusters.md` § Composition vs Policy vs middle
  pattern: *"Most 'feels like composition' items actually fit the middle
  pattern."* Run this check explicitly. Signals of true composition: engine
  factory composes a different behavior list; behaviors are subtracted /
  added / swapped at composition time. Signals of middle pattern: behaviors
  read a new state slot at runtime; all behaviors compose uniformly. When
  middle pattern fires, route to `/document-spf-feature`.

- **Feature-vs-use-case framing confusion** — the invocation describes an
  engine capability (Case-1: "the engine handles this source-shape
  correctly") but is framed as a use-case composition (Case-2: "the engine
  is composed for this delivery scenario"), or vice versa. Same vocabulary
  appears on both sides — *audio-only*, *video-only*, *live* can mean a
  source-shape concern *or* a delivery-mode choice. Resolve by asking
  explicitly: is this *source-shape correctness* (route to feature doc) or
  *delivery-mode choice* (continue as use case)?

- **Subtractive-only thinking** — defaulting to "which behaviors do we
  leave out?" when the use case might also add behaviors, swap alternative
  implementations, or change defaults. Run all four composition mechanisms
  (subtract / add / alternative-impl / alternative-default-config) at
  scoping time, even if only one ends up populated. The `clusters.md` row's
  legacy *"ideally accomplished by subtraction only"* language pre-dates
  the four-mechanism view in `use-cases/README.md` — the broader taxonomy
  is the source of truth.

- **Use-case-specific behavior promoted to feature unnecessarily** — a
  variant-decision-glue behavior, composition-wiring behavior, or
  single-scenario tuning gets a feature doc when it should live in the
  use-case doc's *Composition specifics → Behaviors added* section. Apply
  the same "earns its place" rubric `/document-spf-feature` uses:
  substantial independent implementation footprint, independent
  priority/timeline, or a primitive other engine consumers would draw on.
  Failing all three → behavior stays in the use-case doc; no separate
  feature registry entry. See `use-cases/README.md` § Cross-link discipline
  → "When the constituent-features framing doesn't apply."

- **Forgetting the Case-1 feature sibling** — when a use case is the
  Case-2 axis of an existing Case-1 feature *and the two ship distinct
  engine factories*, the cross-link must go both ways. The feature doc's
  *Out of scope (separate concerns)* must reference the use case; the
  use case's *Related features* / *See also* must reference the feature.
  Step 8 cascade enforces; Step 7 audit catches misses. **Caveat:** when
  the Case-1 and Case-2 framings ship the *same* engine factory (the
  audio-only and video-only family pattern — see
  `audio-only-mode-override.md` for the canonical example), they
  consolidate into a single use-case doc with a *Variant-decision signal
  source* section covering both paths. The Case-1 feature doc does not
  exist separately in those cases. Not every use case has a Case-1
  sibling — `background-video` has constituent features but no
  single Case-1 axis-counterpart.

- **Conflating sibling use cases** — e.g., `video-only-mode-override` and
  `background-video` both touch the video-only delivery
  composition but address different delivery scenarios (video-without-audio
  delivery vs Mux background-video product). Check at Step 5: distinct
  customer story? distinct composition specifics? If yes, separate docs
  with a *Related use cases* cross-link between them — not a merged doc.
  Shared constituent features ≠ same use case.

- **Composition-variant logic in always-on behaviors** — applies
  symmetrically to use-case work; cross-ref the existing entry in
  `/document-spf-feature`'s catalog. When a use case wants to bias an
  always-on behavior's runtime, the answer is a per-variant alternative
  implementation (composed in place of the default) or alternative default
  configuration — not a runtime conditional branch in the always-on body.

- **Constituent features vs vocabulary-sharing features** —
  `audio-playback` is a *constituent feature* of
  `audio-only-mode-override` (the use case composes the feature's
  rendition selection + media playlist resolution + segment loading),
  not just a vocabulary sibling. The constituent relationship is
  "this use case composes the feature's behaviors." Vocabulary-sharing
  alone is not constituent: `audio-abr` shares vocabulary with
  `audio-only-mode-override` but is constituent only if the use case
  composes audio-abr's behaviors into the variant.

- **Cluster heuristic application via constituent features** — for any
  use case, identify the constituent features first, then run the cluster
  signals on those features (per `clusters.md` § Clusters → each cluster's
  Signals list). This surfaces cross-cluster touchpoints transitively: a
  use case's constituent feature's cluster pattern still applies to the
  composition variant.

- **Pre-deciding things the user wants left open** — open questions in
  the doc are markers to think about, not prompts to resolve via the
  edit. If the user says "this is required" or "this is not in scope,"
  update the doc to reflect the decision. If they ask for clarification,
  don't resolve via the edit.

## Steps (do these in order; do not skip)

### Step 1 — Identify the use case and gather source materials

The load-bearing setup step. Triangulate the use case from every available
source:

- **The user's invocation message.** Use-case name? Description? Delivery
  scenario? Customer story? Link(s)?
- **Linked Notion docs.** Fetch via the Notion MCP tool. Case-2 epics in
  the SPF Epics Working Document are the primary source.
- **Linked GitHub issues.** Fetch via `gh issue view <#>`. Mux product
  scenarios (e.g., `mux-background-video`) often anchor consumer
  context.
- **Pasted writeups in the conversation.** Read carefully — run the
  scope-writeup vintage check (current or historical?).
- **Existing use-case doc.** Check
  `internal/design/spf/use-cases/<use-case-name>.md` and obvious aliases.
- **Closely related use-case docs.** Pull in any documented use cases —
  shared customer context, shared constituent features, inverse-axis
  siblings.
- **Constituent feature docs.** Consult `features/clusters.md` to identify
  which clusters this use case likely touches; pull in the documented
  features from those clusters as candidate constituents.

**Constituent-feature identification.** Most use cases have multiple
constituent features. Identify them at Step 1 — they drive Steps 3, 4, 5, 8.
Common shapes:

- Delivery-mode-from-mixed-source use cases (audio-only-mode-override,
  video-only-mode-override) → constituent features include the parallel
  Case-1 source-shape feature plus the baseline playback / buffer /
  selection features.
- Product-scenario use cases (background-video, shorts-player) →
  constituent features include multiple capability features the variant
  assembles.

**Decomposition check (load-bearing).** Run the 4-criterion rubric from
`use-cases/README.md` § Decomposition rubric:

1. **Uses composition mechanisms** (subtract / add / alternative-impl /
   alternative-default-config) — not runtime config on always-on behaviors.
2. **Names a delivery scenario** — recognizable consumer mode.
3. **Has constituent features** — at least one Case-1 feature.
4. **Names a customer/consumer scenario** — who consumes this and what
   product story.

**Counter-routes when criteria fail:**

- Fails (1) → middle pattern or cluster-E policy → `/document-spf-feature`.
- Fails (2) or (4) → composition-variant *phase row* inside an existing
  feature doc (composition-variant pattern from
  [`../conventions/behaviors.md` § Inverse: behaviors that operate
  uniformly across tracks](../conventions/behaviors.md#inverse-behaviors-that-operate-uniformly-across-tracks)),
  not standalone.
- Fails (3) → either the features aren't documented yet (write them
  first via `/document-spf-feature`) or this isn't actually a use-case
  composition.

**Weak-criterion surface check.** When the rubric fires only *weakly* on
one or more criteria, surface alternative framings proactively in the
Step 1 report — same discipline as `/document-spf-feature`'s
weak-criterion check. The user gets to see the judgment call rather than
having to surface it themselves.

**Stop and report back to the user** with:

1. The use-case name (your best read).
2. Sources consulted (with links).
3. Existing doc status (none / coarse / technical / sketched).
4. Likely constituent features identified (with confidence notes).
5. Rubric criteria firing strongly / weakly / failing.
6. **Recommended framing** — new standalone use-case doc / extend
   `<existing use-case doc>` / extend `<existing feature doc>`'s
   composition-variant phase row / route to `/document-spf-feature` —
   with rubric reasoning. Always have a recommendation; don't hedge.
7. Ambiguities still unresolved (going into Step 2's discussion).

This is the load-bearing step. Getting it wrong invalidates everything
downstream — same failure shape as `/document-spf-feature`'s Step 1
misdiagnosis and `/change-spf-behavior`'s Step 1 purpose-articulation.

### Step 2 — Discuss to resolve ambiguities

An **explicit conversational stage** — not optional, not implicit. After
Step 1's report, drive toward answers for the questions that remain:

- **Implementation status.** Implemented? Partially? Not at all? Engine
  variant composed today vs proposed?
- **User's intent.** Register a new use case? Deepen an existing coarse
  stub? Update an existing doc because something changed? Discuss only
  (no draft)?
- **Definition depth target.** Coarse / technical / sketched? Default
  heuristic same as feature docs: implemented and code-grounded →
  sketched; proposed / under-discussion → coarse; scope articulated but
  no implementation → technical.
- **Composition mechanism mix.** Which of the four mechanisms (subtract /
  add / alternative-impl / alternative-default-config) is the use case
  likely to use? Often more than one. Asking up front grounds Step 3.
- **Customer-policy surface.** What's the consumer-facing API surface
  the variant exposes? (Loop flag, autoplay-muted, buffer targets, etc.)
- **Scope confirmation.** If any gathered material reads like scope
  framing (Notion epics, kickoff docs, product specs), explicitly ask
  whether it's current or historical context.
- **Concurrent considerations.** Are there related use cases the user
  wants tackled in concert, or are they cross-refs only?
- **Anything else** the source materials didn't clearly resolve.

**Use `AskUserQuestion`** when the choice is clear-cut and short-listable
(definition depth, implementation status, register-vs-update intent,
framing). Use free-form discussion when the question doesn't enumerate
cleanly (scope nuance, what's "related enough").

**Lead with Step 1's recommendation.** Per the system instructions on
`AskUserQuestion`, when you have a recommended option, it goes first and
is labeled `(Recommended)`. The Step 1 decomposition check produces this
recommendation — carry it through into Step 2's question rather than
presenting equivalent options without a recommendation.

**Discuss-only mode.** If the user signals they want to think out loud
without producing a doc, stay in Step 2 indefinitely until they
explicitly ask to draft.

### Step 3 — Ground the use case in the codebase

Required for `sketched` and `technical` definition depths; abbreviated
for `coarse`.

**For implemented variants (sketched depth).** Dispatch an `Explore`
agent or read code directly to map:

- **Composition specifics.** Which engine factory composes the variant?
  Which behaviors are subtracted, added, or swapped vs the default
  composition? Compare against the `hls/video` engine's behavior list
  in `packages/spf/src/playback/engines/hls/engine.ts` as the baseline.
- **Constituent features grounded.** For each constituent feature
  identified at Step 1, map the specific behaviors / actors / state
  slots the variant composes. Per-feature relationship per
  `use-cases/README.md` template: used as-is / alternative defaults /
  alternative implementation of behavior X.
- **Customer-policy surface in code.** Config inputs the variant accepts.
- **Variant-decision signal in code.** Adapter-upfront vs detect-from-
  parser — where does the variant get selected?
- **Tests covering the variant.** E.g., `engine.test.ts` "handles
  audio-only stream" for the audio-only path.

**For not-yet-implemented variants (coarse depth).** Identify the pieces
the variant would *touch*, not the implementation itself:

- Which existing behaviors would be subtracted / added / swapped?
- Which constituent features supply the baseline?
- Which behaviors would need alternative implementations (Path B per
  `use-cases/README.md` § Implementation note)?
- Which alternative defaults would the variant configure?
- Which variant-decision signal source would drive selection?

This output feeds the doc's *Composition specifics*, *Constituent
features*, and *Likely cross-cutting impact* sections.

### Step 4 — Apply cross-cutting concern checks

Run the failure-mode catalog and the cross-cluster patterns from
`clusters.md` against everything gathered. Cluster patterns apply
*through constituent features* — a constituent feature's cluster
patterns transfer to the use case that composes it.

**The use-case-specific failure-mode catalog** (this skill's catalog
above). Each check fires when its signals are present in the use case's
description, grounded code, or constituent features.

**The cross-cluster pattern checks (per `clusters.md`).** Apply each via
the constituent features:

- **Gating / prerequisite chains** — variant adds a gate on an existing
  behavior or introduces a prerequisite signal?
- **Multi-writer state slots** — variant adds a writer to a slot the
  default composition's behaviors already write?
- **Constraint + filter** — variant introduces a slot that narrows a
  default-composition behavior's candidate set?
- **Per-type specialization** — variant interacts with per-type
  behaviors (video/audio/text siblings)?
- **Sampling-baked-into-loading** — variant changes loading flow in a
  way that affects sampling?

**The composition-mechanism check.** For each of the four mechanisms,
which behaviors are affected? This drives the *Composition specifics*
section's per-bucket breakdown.

**Output of this step.** A list of: which patterns / checks fired, what
they imply for the doc's *Likely cross-cutting impact* section, what
behaviors qualify as use-case-specific (vs constituent), what
cross-references they pull in.

### Step 5 — Pick phase framing and identify relationships

**Phase framing.** Default to the three-phase complexity framing from
`use-cases/README.md` § The three default complexity phases:

- **Phase 1 — Basic functionality.** Minimum viable variant on existing
  / generic behaviors.
- **Phase 2 — Features/functionality relevant to the use case.**
  Constituent features composed in beyond the baseline.
- **Phase 3 — Optimizations.** Alternative implementations / default
  configurations that improve the variant's quality of delivery.

Other framings allowed when this doesn't fit (e.g., a use case with no
meaningful optimization phase). The skill picks the framing per-use-case.

**Relationships.** Sort related items into the right buckets per
`use-cases/README.md` § Cross-link discipline:

- **Constituent features (always)** → *Constituent features* section,
  with per-feature relationship (used as-is / alternative defaults /
  alternative implementation).
- **Use-case-specific behaviors (sometimes)** → *Composition specifics →
  Behaviors added*. Apply the "earns its place" rubric to confirm they
  shouldn't promote to feature docs.
- **Direct Case-1 sibling (sometimes)** → *Related features* or *See
  also* with the sibling framing made explicit.
- **Sibling use cases (sometimes)** → *Related use cases* section.
- **Cross-refs to existing docs** → *See also*.
- **Forward refs to candidate use cases / features (no doc yet)** →
  bracketed entries (per registry convention).
- **Open questions** → *Open questions* section.

**"One use case or many?" decomposition check.** Before locking the
phases in, ask: is this really one use case, or is the variant actually
a decomposition into multiple use cases? Heuristic: a slice belongs in
its own doc if it has (a) a distinct customer story, (b) distinct
composition specifics, or (c) independent timeline. Worked example:
`video-only-mode-override` vs `background-video` — both
exercise video-only delivery composition, distinct customer
stories, distinct composition specifics.

Name any additional record as a candidate only. Do not create it unless
the user explicitly requests that separate record.

### Step 6 — Draft (or update) the doc

Write the file at `internal/design/spf/use-cases/<name>.md` using the
template from `use-cases/README.md` § Template for individual use-case
docs. Section presence varies by definition depth (same table shape as
feature docs):

| Section | coarse | technical | sketched |
|---|---|---|---|
| Frontmatter (`status`, `date`, `definition`) | ✓ | ✓ | ✓ |
| Opening paragraph | ✓ | ✓ | ✓ |
| Status | ✓ | ✓ | ✓ |
| Target delivery context | ✓ | ✓ | ✓ |
| Phases of complexity | ✓ | ✓ | ✓ |
| Composition specifics | partial | ✓ | ✓ |
| Constituent features | ✓ | ✓ | ✓ |
| Customer-policy surface | partial | ✓ | ✓ |
| Variant-decision signal source | partial | ✓ | ✓ |
| Likely cross-cutting impact | ✓ | partial | — |
| Open questions | ✓ | partial | partial |
| Related use cases | ✓ | ✓ | ✓ |
| See also | ✓ | ✓ | ✓ |

**For updates to existing docs.** Preserve structure; make targeted
edits. Don't rewrite sections wholesale unless the user asks. Open
questions resolved through conversation update the section the answer
constrains; the open question itself gets removed.

**Show the user before treating the draft as final.** Iteration is
expected — failure-mode catalog updates may surface during user review.

### Step 7 — Final-shape audit

A deliberate second pass against the file as written. Most misses come
from the diff itself, not the pre-draft analysis. Run through:

- **Frontmatter** — `status`, `date`, `definition` match Step 2's
  agreement?
- **Phase framing** — the choice from Step 5 reflected, not silently
  drifted to a different shape?
- **Composition specifics** — all four mechanism buckets (subtract /
  add / alternative-impl / alternative-default-config) considered, even
  if some are empty? Empty buckets noted explicitly?
- **Constituent features** — each one listed with the per-feature
  relationship (used as-is / alternative defaults / alternative
  implementation of behavior X)?
- **Use-case-specific behaviors** — each one in *Composition specifics
  → Behaviors added* passes the "earns its place" rubric for staying in
  the use-case doc (not promoting to feature)?
- **Case-1 sibling check** — if the use case has a direct Case-1
  sibling, is the cross-link present in *Related features* / *See also*?
- **Cross-cutting concerns** — each pattern / check that fired in Step
  4 surfaced in the doc somewhere?
- **Cross-refs** — bracketed entries for not-yet-documented items?
  Plain links for existing docs? `See also` links resolve?
- **Implementation claims grounded** — every concrete behavior / actor /
  file-path reference came from Step 3's exploration, not invented?
- **Open questions appropriate** — at coarse depth, open questions are
  a feature; at sketched, they should cross-reference where they're
  being tracked.
- **Resolved questions not lingering** — anything resolved during Step
  2 / Step 6 landed in its constraining section and cleared from open
  questions?

### Step 8 — Cross-doc cascade

After the use-case doc is final, **survey other docs for narrow updates**
this draft entails. The cascade for use cases is heavier than for feature
docs because of the bidirectional cross-link discipline (use cases compose
features; features track which use cases compose them).

**Cascade candidates:**

- **Each constituent feature doc.** Add a *Use cases that compose this
  feature* entry (create the section if it doesn't exist yet). This is
  the cascade's load-bearing step — feature docs without this
  back-reference become stale.
- **Direct Case-1 sibling feature doc.** If the use case is the Case-2
  axis of an existing feature, update the feature doc's *Out of scope
  (separate concerns)* to reference the use case by name (drop any
  "yet-to-be-formalized" placeholder language). Cross-confirm the use
  case's *Related features* / *See also* references the feature.
- **Sibling use case docs.** Add bidirectional *Related use cases*
  cross-links.
- **`use-cases/README.md` Index.** Move the entry from bracketed
  `[name]` to plain `name` and update its description if needed.
- **`features/clusters.md`.** If a new composition pattern surfaced
  worth recording — e.g., the use case demonstrates a new composition
  mechanism shape — note in `§ Composition vs Policy vs middle
  pattern` or `§ Cross-cluster patterns`. Note also: the current
  Composition row's *"ideally accomplished by subtraction only"*
  language is broader than the four-mechanism view in
  `use-cases/README.md`; consider whether the row's Definition cell
  needs softening as part of this cascade.
- **`packages/spf/docs/hls-engine.md`.** If the use case introduces a
  new engine-variant factory, update the engine composition walkthrough.

**Discipline for cascade edits:**

- **Narrow** — add references, note relationships; don't restructure
  other docs.
- **Per-doc confirmation** — propose each candidate edit explicitly;
  user accepts / declines / modifies per doc.
- **Bounded** — only docs this use case explicitly references plus docs
  that reference this use case (i.e., its constituent features and any
  Case-1 sibling). Don't go fishing for unrelated cross-refs.

**Cascade may also trigger updates to `use-cases/README.md`** — a new
composition mechanism worth naming, a new failure mode for the catalog,
a template adjustment. These are part of the same cascade.

### Step 9 — Commit (with user confirmation)

After Step 7 audit is clean and Step 8 cascade edits are agreed:

1. **Audit working-tree state.** `git status -s`. Surface any
   pre-existing uncommitted work on files outside the doc scope; never
   commit files the user didn't ask you to touch.
2. **Propose a commit structure.** Common shapes:
   - **Single commit** — new use-case doc only, no cascade. Coarse stubs
     for novel use cases (no constituent features documented yet) may
     land here, though this is rare.
   - **Doc + constituent-feature cascade** — new use-case doc plus
     *Use cases that compose this feature* additions to constituent
     feature docs. Most use-case docs land here.
   - **Doc + Case-1 sibling cascade** — new use-case doc plus update to
     the Case-1 sibling feature doc dropping placeholder language.
     Often combined with constituent-feature cascade.
   - **Doc + README index update** — new use-case doc plus moving from
     bracketed forward-ref to plain entry in `use-cases/README.md`'s
     Index.
   - **All of the above** — large new use cases that earn updates across
     multiple constituent features, sibling feature, README, and
     possibly clusters.md.
3. **Ask the user to confirm via `AskUserQuestion`.** Options include
   "Land all commits as proposed," "Bundle into one commit," and
   "Skip — I'll handle commits."
4. **On confirmation, run the commits.** Stage per-commit by name (no
   `-A` / `git add .`), use the repo's commit-message conventions
   (`docs(spf)` scope per the project's `git` skill).
5. **On decline or skip, stop.** The user owns the commit boundary.

## Output format

Propose the doc in this order before writing the file. Use markdown
headers for each numbered section. Do not write the file until the user
confirms.

1. **Use-case identification** (Step 1's report — name, sources,
   existing doc status, constituent features, rubric criteria firing,
   recommended framing)
2. **Ambiguities to resolve** (Step 2 — questions for the user)
3. **Grounding summary** (Step 3 — composition specifics / constituent
   features grounded / customer-policy surface, or what-it-would-touch
   for coarse)
4. **Cross-cutting concerns identified** (Step 4 — which checks fired,
   composition mechanism mix, what they imply)
5. **Phase framing + relationships** (Step 5 — phase shape, what's in
   each scope bucket)
6. **Proposed doc** (Step 6 — the file content, ready to write)
7. **Cross-doc cascade** (Step 8 — proposed updates to constituent
   feature docs, Case-1 sibling, README, sibling use cases)

After user confirmation, write the file, run Step 7 audit, propose
Step 9 commit structure.

## Why this order

The canonical failure: invocation → drafting, skipping the
triangulation and discussion that surface the actual scope, doc-type,
and constituent-feature mix. Steps 1–2 force the framing before
mechanical work. Step 3 grounds claims in code; Step 4 runs the
failure-mode catalog while context is fresh; Step 5 commits the
structural choices before drafting. Step 6 produces the artifact. Step
7 is the second-pass audit that catches diff-introduced misses. Step 8
keeps the registry internally consistent (heavier than for feature docs
because of the bidirectional cross-link discipline). Step 9 hands the
commit boundary back to the user.

## Why a discussion stage (not implicit)

Source materials are often under-specified or ambiguous in ways the
user didn't notice until asked. The conversational stage is explicit
because making it implicit produces drafts that look right but anchor
on the wrong doc-type — the feature-vs-use-case framing confusion is
the canonical example. Step 2 short-circuits to drafting only when
ambiguities are genuinely resolved by Step 1's gathering.

## When this is the wrong skill

- **You want to document an engine capability (Case-1)** →
  `/document-spf-feature`. Capability docs answer "what can the engine
  do?"; use-case docs answer "how is the engine composed for this
  delivery scenario?"
- **Your candidate's implementation shape is middle-pattern, not
  composition** → `/document-spf-feature`. Per `clusters.md`: most
  candidates fail this check.
- **You want to refactor an existing behavior** → `/change-spf-behavior`.
- **You want to split or merge behaviors** → `/change-spf-behavior`'s
  Step 3 / Step 6a may route you to `/change-spf-behavior` or
  `/change-spf-behavior`.
- **The user requests a different durable record** → treat it as a separate
  explicit task. Do not create it from this workflow.
- **You want to write user-facing documentation** → `docs` skill.

## How the failure-mode catalog grows

When a new failure mode surfaces during use (most likely during Step 6
draft review or Step 7 audit):

1. Add an entry to the *Failure-mode catalog* section above with the
   risk pattern and a worked-example citation.
2. If the failure-mode is cluster-pattern-shaped, also update
   `clusters.md` § Cross-cluster patterns.
3. If the failure mode is doc-type-shaped (template, rubric, cross-link
   discipline), also update `use-cases/README.md` in the relevant
   section.
4. Note in the commit that the skill itself grew — `docs(spf): …`
   commit scope covers skill updates.

The catalog is the load-bearing distinction between this skill and a
generic "write a use-case doc" prompt. Every entry exists because a real
risk was hit (or, for the seeded entries, identified at skill-creation
time from cross-skill failure-mode patterns); keeping the catalog
up-to-date is the mechanism that keeps the skill earning its keep.
