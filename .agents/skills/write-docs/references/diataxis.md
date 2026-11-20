# Diátaxis boundaries and language

Distilled from [Diátaxis](https://diataxis.fr/). The document-type map and the compass for picking a mode live in `site/src/content/docs/writing-style/write-guides.mdx`. Read this file when content drifts between modes or a passage's tone feels wrong for its page type.

## Apply the compass to passages, not only pages

The compass (action vs. cognition, study vs. work) also works at the sentence and paragraph level. When a passage feels off, ask which quadrant it serves and move it to the page type that owns that quadrant, leaving a link behind when readers need the trail.

## What does not belong in each type

- How-to guide: no teaching and no digression. Background beyond what the reader needs to adapt the code links to a concept page. Each section answers a reader goal ("to do X…") rather than touring an option; Diátaxis rejects how-tos defined by the operations a tool can perform. A table belongs in a how-to only when the reader acts on it, such as a migration mapping or origins to paste. A catalog of the machinery (events, options, defaults, parameters) belongs in reference, and the how-to links to it.
- Concept page: no step-by-step instruction and no close-up API detail. Steps that creep in belong in a how-to; exact surfaces belong in reference.
- Reference page: no instruction, persuasion, or opinion. Describe the machinery; do not walk the reader through tasks or argue for approaches. Link how-to guides for tasks and concept pages for rationale.
- Tutorial: we deliberately publish none yet. If we add true tutorials later: no alternatives and minimal explanation, and the writer carries the lesson — every step must work, produce a visible result quickly, and lead to the next.

## The language of each type

Each mode has characteristic sentence forms. When your sentences read like a different mode, the content is probably in the wrong place.

- How-to guide: imperatives and conditional imperatives aimed at the reader's goal. "To loop playback, set…" "If you self-host, configure…"
- Concept page: discussion of why and how things relate. "Features are split this way because…" "Compared with the native element…" Alternatives, trade-offs, and opinions are welcome here, and only here.
- Reference page: neutral statements of fact in one consistent shape per kind of entry. "`preload` accepts…" "Defaults to…" Examples illustrate usage without teaching or advocating.
- Tutorial (if we add them): guided steps with confirmations. "First, create…" "You should see…"

## Reference tone

Reference is austere by design: neutral, consistent, and example-rich. Its value is accuracy, completeness, and predictable structure. The api-docs-builder provides the structure; hold hand-written prose on reference pages to the same standard, and spend warmth and persuasion in how-tos and concepts instead.

## What the site checks

Hand-written pages, concept and how-to alike, live in `site/src/content/docs/guides/`; exact API and error-code descriptions live in `reference/`. `site/src/utils/docs/diataxis.ts` guards that line through `pnpm -F site test diataxis`: no title starts with "How to", no reference page carries a how-to template section (Recommended approach, How it works, Common variations, Troubleshooting) or `<CustomUiNote />`, and no guide under `guides/` repeats a reference page's prose paragraph or list item verbatim, or a table with the same columns and four or more of the same rows. Code examples may repeat. The test catches exact copies only; a restatement in other words is a review finding. Concept versus how-to inside guides is a writing and review judgement; the same test prints task-verb headings on pages under the Concepts sidebar section as warnings without failing. When a page moves or is renamed, add a `[[redirects]]` rule for the old URL and its `.md` twin to `site/netlify.toml`, above the section-wide rules. Pages may sit outside the sidebar or carry `hidden: true`; the test does not require a sidebar entry.
