---
status: draft
date: 2026-05-21
---

# SPF use-case compositions

> **A use-case composition is an engine variant composed for a specific delivery scenario by combining features and behavior choices.** Where features answer *"what can the engine do?"*, use-case docs answer *"how is the engine composed for this delivery scenario?"*

## What this directory is for

Use-case compositions are engine *variants*: the engine is composed this way to serve a specific delivery scenario. Same composition assembly + adapter pair, distinguished from the default `hls/video` engine + `HlsVideoAdapterCore` by which behaviors are subtracted, added, swapped, or default-tuned.

Each use case doc captures the variant assembly. Notion originally framed these as a Case-1 (Media-src composition) + Case-2 (Player composition) split — source-shape correctness versus delivery-mode choice. In practice, when both cases ship the *same* engine factory (which they do for the audio-only and video-only families), they consolidate into a single use-case doc with a *Variant-decision signal source* section that names both paths (adapter-upfront for the Case-2 framing, detect-from-parser for the Case-1 framing). When they don't share an implementation, separate docs.

The discriminating principle lives in [`../features/clusters.md` § Composition vs Policy vs Middle pattern](../features/clusters.md#composition-vs-policy-vs-middle-pattern), which already names composition as the third implementation shape and quotes the load-bearing line: *"Most 'feels like composition' items actually fit the middle pattern."* This directory holds the rare ones that genuinely qualify.

## Primary readership

> The primary reader is an LLM, with a human in the loop.

These docs are written to be consumed by and updated by LLMs (via `/document-spf-use-case` today, and the upcoming `implement-spf-use-case` skill) while doing SPF use-case-composition development. Humans are a secondary audience — code review, design review, and onboarding still benefit, but the shape is optimized for grounding agent work:

- Structured frontmatter and predictable section ordering
- Explicit composition-mechanism breakdown (subtract / add / alternative-impl / alternative-default-config)
- Heavy cross-refs to constituent features in [`../features/`](../features/)
- Narrow-cascade discipline so cross-doc context doesn't drift

## When something belongs here vs elsewhere

The cut is **by purpose**, not by composition mechanism. Both use-case compositions and middle-pattern features can add behaviors; the distinction is what question the doc is answering.

| Shape | Purpose it serves | Where it lives |
|---|---|---|
| **Feature** (Case-1) | An engine capability — what the engine can do correctly | [`../features/<name>.md`](../features/) |
| **Use-case composition** (Case-2) | A delivery scenario — how the engine is composed for a specific consumer use | `<name>.md` (this directory) |
| **Cluster-E selection policy** | Runtime bias on what's selected without composition change | [`../features/<name>.md`](../features/) (cluster E) |
| **Adapter / above-engine** | UI, chrome, consumer policy | Out of SPF scope |

*(The middle-pattern shape isn't a peer row — it's an implementation shape **for a feature**, not a doc-type. See [`../features/clusters.md`](../features/clusters.md) for the orthogonal axis.)*

### Discriminating principles

- **Capability vs delivery mode.** Case-1 (feature): does the engine handle this source-shape correctly? Case-2 (use case): how is the engine composed to deliver this scenario? Same vocabulary can appear on both sides — what differs is whether the question is *source-shape correctness* or *delivery-mode choice*.
- **Composition mechanisms (the full set, not just subtraction).** A use-case composition draws on any combination of:
  - **Subtractive composition** — leave out behaviors the variant doesn't need (e.g., omit video-side behaviors for audio-only delivery).
  - **Additive composition** — compose in new behaviors specific to this scenario (e.g., a "force audio-only delivery" variant-decision behavior).
  - **Alternative implementations** — swap an alternate implementation of a behavior the default composition uses (e.g., a loop-around buffer-fetching variant in place of the default forward-buffer behavior).
  - **Alternative default configurations** — tune existing behaviors' defaults for the variant (e.g., shorter forward-buffer targets, autoplay-muted by default, GPU/thermal-aware quality caps).
- **Bounded to delivery modes.** Currently `audio-only-mode-override` and `video-only-mode-override` ground the established modes (each covering both source-shape and delivery-mode framings via a shared engine factory). New modes (background-loop, short-form, podcast, picture-in-picture, …) are admissible but go through the rubric below.

## Decomposition rubric

A candidate earns its own use-case-composition doc when **all four** fire:

1. **Uses one or more composition mechanisms.** Subtract / add / alternative-impl / alternative-default-config or any combination thereof — i.e., the implementation changes the engine at composition time, not as runtime config inside existing behaviors. *(Counter-check: if everything works as runtime config on always-on behaviors, this fails — it's cluster-E policy.)*
2. **Names a delivery scenario.** A recognizable consumer scenario distinct from default delivery (audio-only delivery, background-loop, short-form, etc.). Not "tune the existing engine differently."
3. **Has constituent features.** At least one Case-1 feature in [`../features/`](../features/) provides engine capabilities the variant rests on. Most use cases have *multiple* constituent features. A use case with no constituent features is suspect: either the features aren't documented yet (write them first) or the candidate isn't actually a use-case composition.
4. **Names a customer/consumer scenario.** Who consumes this; what product story; what's being delivered to whom. Not "we could compose differently."

Failing any one routes elsewhere: cluster-E policy feature, a new phase row inside an existing feature doc, or an adapter concern.

## Template for individual use-case docs

| Section | Purpose |
|---|---|
| **Frontmatter** (`status`, `date`, `definition`) | Same shape as feature docs. `definition` follows the coarse / technical / sketched heuristic from `/document-spf-feature`. |
| **Opening paragraph** | One-paragraph framing: what the use case is, who consumes it, how it relates to Case-1 features. |
| **Status** | Implementation status; definition depth; source material (Notion epics, GitHub issues, prior-art repos). |
| **Target delivery context** | Who consumes this; what scenario; what's the customer story; what product the variant supports. |
| **Phases of complexity** | Default three-phase framing — see below. Other framings allowed when this doesn't fit. |
| **Composition specifics** | Per-mechanism breakdown: behaviors subtracted, behaviors added, alternative implementations swapped in, alternative default configurations. Combinations expected; some buckets may be empty. |
| **Constituent features** | Case-1 features (in [`../features/`](../features/)) supplying engine capabilities the variant rests on, each with the per-feature relationship: *used as-is* / *used with alternative defaults* / *used with alternative implementation of behavior X*. |
| **Customer-policy surface** | What consumers configure (loop flag, autoplay-muted, buffer targets, GPU/thermal caps, etc.). |
| **Variant-decision signal source** | Adapter-upfront opt-in vs detect-from-parser. This is a recurring question across all variants. Each use case enumerates both paths when both apply (see [`audio-only-mode-override.md`](./audio-only-mode-override.md) and [`video-only-mode-override.md`](./video-only-mode-override.md) for the established pattern). |
| **Likely cross-cutting impact** | Decisions this variant forces on existing code (not just additions). Includes implications for shared state slots, behaviors that compose unchanged across variants, and behaviors that need per-variant alternative implementations. |
| **Open questions** | Markers for things to think about, not prompts to resolve in the draft. |
| **Related use cases** *(when applicable)* | Sibling use-case compositions (e.g., `audio-only-mode-override` ↔ `video-only-mode-override` as inverse-axis siblings). Distinct from constituent features. |
| **See also** | Conventions docs, feature docs, Notion epics, GitHub issues, prior-art repos. |

### The three default complexity phases

Use-case docs default to a three-phase complexity framing:

| Phase | What |
|---|---|
| **1 — Basic functionality** | Minimum viable variant, built mostly on top of existing or generic behaviors. The composition assembly that gets the delivery scenario working end-to-end. |
| **2 — Features/functionality relevant to the use case** | Constituent features composed in beyond the baseline — capabilities the variant benefits from but doesn't strictly need for minimum viability. |
| **3 — Optimizations of behaviors relevant to the use case** | Alternative implementations or default configurations of behaviors that improve the variant's quality of delivery (buffer tuning, decode optimization, thermal-aware caps, etc.). |

Other framings are allowed when this doesn't fit (e.g., a use case with no meaningful optimization phase). The skill picks the framing per-use-case, the same way `/document-spf-feature` picks among content phases / scope slices / tier 1-2 for feature docs.

## Implementation note: customizing behaviors for use cases

Phase 2 (relevant features) and Phase 3 (optimizations) will routinely surface customization needs — the use case wants an existing behavior to do something slightly different than its default-composition role. Two paths:

- **Path A — Update existing behavior.** Add a config knob, a pluggable callback, or a state-driven branch so the behavior serves both the default composition and the use-case variant. Lower duplication cost; risk of complexity/assumption bloat in the shared behavior.
- **Path B — Create a new behavior.** Typically start as a copy of the original + refactor for the use-case-specific shape. Higher short-term duplication; preserves the original behavior's narrow assumptions and keeps the default composition's call site clean.

### Short-term principle

When the customization would significantly increase complexity or bake new assumptions into the original behavior, prefer **Path B**. Accept the duplication.

### Longer-term principle

Revisit Path-B duplications periodically to see whether a reunification path exists that doesn't reintroduce the original complexity. Both paths are valid at different times in a behavior's life — a Path-B duplication today may collapse back to a Path-A unification later when better abstractions emerge.

This judgment will be formalized — likely as an expansion of [`../evaluation-axes.md`](../evaluation-axes.md) (which currently scores cleanup and feature work but doesn't yet name the duplicate-vs-unify axis explicitly) or a new conventions doc — and codified in `implement-spf-use-case` when that skill lands. Captured here so Phase 3 entries in use-case docs can flag candidates without losing the reasoning.

## Cross-link discipline

The relationship between feature docs and use-case docs is **primarily compositional**: a use case composes capabilities from features, and a feature may be composed into multiple use cases.

- **Use-case doc** lists **Constituent features** — features whose capabilities the use case builds on, each with the per-feature relationship (used as-is / alternative defaults / alternative implementation of behavior X).
- **Feature doc** lists **Use cases that compose this feature** *(new section, populated via cascade as use cases land)*.

### When the constituent-features framing doesn't apply

Two shapes that don't cleanly fit "use case composes feature":

- **Use-case-specific behaviors that don't promote to features.** A variant-decision signal, a composition-wiring behavior, or a behavior that exists only to assemble the variant. These live in the use-case doc's **Composition specifics → Behaviors added** section — not in the feature registry. The rubric for "earns its place as a feature" is the same one `/document-spf-feature` applies: substantial independent implementation footprint, independent priority/timeline, or a primitive other engine consumers would draw on. Behaviors that fail all three stay in the use-case doc.
- **Features built exclusively for one use case.** A feature doc may exist for a capability that is, today, composed only by one use case. That's fine — the feature doc captures the engine capability, the use-case doc captures the variant assembly. The cascade cross-link still applies; the feature's "Use cases that compose this feature" list just has one entry.

### Sibling cross-links

For direct **Case-1 / Case-2 sibling** relationships that *don't* collapse into a single use case doc (i.e., the engine factory differs between the two cases), the cross-link still happens — the feature doc's *Out of scope (separate concerns)* flags the use case, and the use case's *Related features* or *See also* cross-refs back. But **constituent** is the primary framing; sibling is a special case. When both cases share an engine factory (the audio-only and video-only family pattern), they consolidate into a single use-case doc with a *Variant-decision signal source* section covering both paths — see [`audio-only-mode-override.md`](./audio-only-mode-override.md) for the established example.

A use case may have:

- One or many **constituent features** (always).
- Zero or one **direct Case-1 sibling** (sometimes).
- Zero or more **sibling use cases** (sometimes — e.g., audio-only-mode-override / video-only-mode-override as inverse-axis siblings).
- Zero or more **use-case-specific behaviors that don't promote to features** (sometimes — captured in Composition specifics, not the feature registry).

`/document-spf-use-case`'s cascade step enforces the bidirectional cross-link for the constituent-features, Case-1/Case-2 sibling, and sibling-use-case shapes when applicable. Use-case-specific behaviors are documented in the use case's Composition specifics section, not the feature registry.

## Index

Initially empty; populated as docs land. Candidates flagged in source material (bracketed per registry convention):

- [`audio-only-mode-override`](./audio-only-mode-override.md) *(partial — Phase 1 landed)* — audio-only delivery. Covers both truly-audio-only HLS sources and mixed-manifest sources delivered as audio-only via the same shared engine factory (the `hls/audio` engine). Subsumes what Notion originally framed as separate epics #4a (Basic Audio-only) and #4b (Audio-only Mode Override).
- [`video-only-mode-override`](./video-only-mode-override.md) *(coarse)* — video-only delivery. Inverse-axis sibling of [`audio-only-mode-override`](./audio-only-mode-override.md); same shape. Subsumes Notion epics NEW-A (Basic Video-only) and NEW-B (Video-only Composition).
- `[background-video]` — Mux's background-video product scenario: loop + autoplay-muted + GPU/thermal-aware caps + likely silent-video delivery. **Distinct from `video-only-mode-override`** despite shared Mux consumer context; both may share constituent features but address different delivery scenarios. *[GitHub #873](https://github.com/videojs/v10/issues/873); [`mux-background-video`](https://github.com/muxinc/mux-background-video) prior art.*
- Further candidates surfaced in source material but not yet scoped: picture-in-picture, short-form / shorts-player, audio-podcast mode, cast/remote-display compositions, ambient/decorative video.

## See also

- [`../features/clusters.md` § Composition vs Policy vs Middle pattern](../features/clusters.md#composition-vs-policy-vs-middle-pattern) — the classification axis that names composition as the third implementation shape and the load-bearing constraint that "most 'feels like composition' items actually fit the middle pattern."
- [`../features/clusters.md` § Feature classification axes](../features/clusters.md#feature-classification-axes) — the parent classification section. The Media-src-vs-Player axis here is the Case-1 (Media-src feature) vs Case-2 (Player feature / use-case composition) split implicit in Notion's "Composition cases per mode" framing.
- [`../conventions/behaviors.md` § Inverse: behaviors that operate uniformly across tracks](../conventions/behaviors.md#inverse-behaviors-that-operate-uniformly-across-tracks) — the discipline that lets composition variants compose existing behaviors unchanged; the `updateMediaSourceDuration` worked example.
- [`../evaluation-axes.md`](../evaluation-axes.md) — current axes for evaluating SPF code; will likely expand to formalize the Path-A-vs-Path-B judgment for use-case behavior customization.
- [`../../../../.agents/skills/document-spf-use-case/SKILL.md`](../../../../.agents/skills/document-spf-use-case/SKILL.md) — skill that produces and maintains docs in this directory.
- [`../../../../.agents/skills/document-spf-feature/SKILL.md`](../../../../.agents/skills/document-spf-feature/SKILL.md) — parallel skill for feature docs; consult for the analogous discipline shape.
- [SPF Epics Working Doc](https://www.notion.so/35f97a7f89d08123a13fecab1ca1cac4) — source material; Composition cases per mode framing; Case-2 epics tracked here.
